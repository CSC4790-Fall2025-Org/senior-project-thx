from datetime import datetime, time as dt_time
import json
from typing import Optional

from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_datetime
from rest_framework import serializers
from django.utils.timezone import localdate, localtime, now
from django.db.models import Q

from .models import Service, Availability, Booking, ServiceImage

import os
import re

User = get_user_model()


def _parse_hhmmss(s):
    parts = (s or "").split(":")
    h, m = int(parts[0]), int(parts[1])
    sec = int(parts[2]) if len(parts) > 2 else 0
    from datetime import time as dt_time
    return dt_time(hour=h, minute=m, second=sec)


def _normalize_availability_payload(raw):
    import json
    from datetime import datetime
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return []
    if isinstance(raw, list):
        cleaned = []
        for s in raw:
            d, st, et = s.get("date"), s.get("start_time"), s.get("end_time")
            if not (d and st and et):
                continue
            try:
                d_obj = datetime.strptime(d, "%Y-%m-%d").date()
                st_obj = _parse_hhmmss(st)
                et_obj = _parse_hhmmss(et)
            except Exception:
                continue
            if st_obj >= et_obj:
                continue
            cleaned.append({"date": d_obj, "start_time": st_obj, "end_time": et_obj})
        return cleaned
    # legacy { "YYYY-MM-DD": [{start, end}] } allowed but ONLY uses time parts — no UTC shift
    if isinstance(raw, dict):
        from django.utils.dateparse import parse_datetime
        cleaned = []
        for d, slots in raw.items():
            try:
                d_obj = datetime.strptime(d, "%Y-%m-%d").date()
            except Exception:
                continue
            for s in (slots or []):
                sd, ed = parse_datetime(s.get("start")), parse_datetime(s.get("end"))
                if not (sd and ed):
                    continue
                st_obj = sd.timetz().replace(tzinfo=None) if hasattr(sd, "timetz") else sd.time()
                et_obj = ed.timetz().replace(tzinfo=None) if hasattr(ed, "timetz") else ed.time()
                if st_obj >= et_obj:
                    continue
                cleaned.append({"date": d_obj, "start_time": st_obj, "end_time": et_obj})
        return cleaned
    return []


# Availability Serializer
class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ["id", "date", "start_time", "end_time"]


# Base Service Serializer — shared fields
class BaseServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "description", "price", "type"]


# Service Image Serializer
class ServiceImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceImage
        fields = ("id", "url", "created_at")

    def get_url(self, obj):
        if not obj or not obj.image:
            return None
        request = self.context.get("request")
        try:
            url = obj.image.url
        except Exception:
            return None
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url


# Full Service Serializer — includes everything (used in UserMeSerializer, detailed views)
class FullServiceSerializer(BaseServiceSerializer):
    availabilities = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    location = serializers.CharField(source='user.location', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    # return the primary image as an absolute URL string via SerializerMethodField so it's consistent
    image = serializers.SerializerMethodField()
    isSaved = serializers.SerializerMethodField()
    provider_name = serializers.CharField(source='user.name', read_only=True)

    # New field: include owner's email directly on the service representation
    owner_email = serializers.CharField(source='user.email', read_only=True)

    class Meta(BaseServiceSerializer.Meta):
        fields = BaseServiceSerializer.Meta.fields + [
            "image",
            "isSaved",
            "availabilities",
            "user_id",
            "images",
            "provider_name",
            "location",
            "owner_email",
        ]

    def get_availabilities(self, obj):
        request = self.context.get("request")
        include_booked = False
        if request:
            include_booked = str(request.query_params.get("include_booked", "")).lower() in ("1", "true", "yes")

        qs = obj.availabilities.all()
        if not include_booked:
            qs = qs.exclude(booking__isnull=False)

        today = localdate()
        current_t = localtime(now()).time()
        qs = qs.filter(Q(date__gt=today) | Q(date=today, end_time__gt=current_t)).order_by("date", "start_time")

        return [
            {
                "id": a.id,
                "date": a.date.isoformat(),
                "start_time": a.start_time.strftime("%H:%M:%S"),
                "end_time": a.end_time.strftime("%H:%M:%S"),
            }
            for a in qs
        ]
    def get_image(self, obj):
        """
        Return the Service.image field as an absolute URL string or None.
        """
        request = self.context.get("request")
        img_field = getattr(obj, "image", None)
        if not img_field:
            return None
        try:
            url = img_field.url
        except Exception:
            return None
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url

    def _normalize_url_key(self, url: Optional[str]) -> Optional[str]:
        """
        Normalize a URL or filename to a dedupe key by taking its basename and removing trailing
        underscore+alnum parts before the extension. Lowercases for stable matching.
        Example: .../file_0sybk5b.jpg -> file.jpg
        """
        if not url:
            return None
        base = os.path.basename(url)
        return re.sub(r'_[0-9A-Za-z]+(?=\.\w+$)', '', base).lower()

    def get_images(self, obj):
        """
        Return a deduplicated list of image objects (id, url, created_at).
        Deduplication normalizes filenames so derived copies (e.g. _abcd.jpg) are considered
        duplicates of the original.
        """
        request = self.context.get("request")
        # serialize DB ServiceImage rows first (they include id + created_at)
        serialized = ServiceImageSerializer(obj.images.all(), many=True, context=self.context).data or []

        seen = set()
        out = []
        for item in serialized:
            u = item.get("url")
            if not u:
                continue
            key = self._normalize_url_key(u)
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(item)

        # Ensure primary image field (obj.image) is included once if it exists and isn't present already
        main_url = None
        try:
            if getattr(obj, "image", None):
                main_url = obj.image.url
                if request:
                    try:
                        main_url = request.build_absolute_uri(main_url)
                    except Exception:
                        pass
        except Exception:
            main_url = None

        main_key = self._normalize_url_key(main_url)
        if main_url and (main_key not in seen):
            # insert as first item so 'image' matches images[0] in clients that expect that
            out.insert(0, {"id": None, "url": main_url, "created_at": None})
            seen.add(main_key)

        return out
    
    def get_isSaved(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            return obj in user.saved_services.all()
        return False

    def create(self, validated_data):
        """
        Create Service for the authenticated request.user.
        Also create Availability rows if provided in request.data.
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError({"detail": "Authentication required."})

        validated_data.pop("user", None)
        service = Service.objects.create(user=user, **validated_data)

        incoming = request.data if request else {}
        raw_payload = (
            incoming.get("availability")
            or incoming.get("availabilities")
            or incoming.get("availability_list")
        )
        slots = _normalize_availability_payload(raw_payload)

        if slots:
            Availability.objects.bulk_create(Availability(service=service, **s) for s in slots)

        # Handle uploaded images (if request.FILES contains 'images')
        files = request.FILES.getlist("images") if request and hasattr(request.FILES, "getlist") else []
        for f in files:
            ServiceImage.objects.create(service=service, image=f)

        return service

    def update(self, instance, validated_data):
        """
        Update fields. If availability payload is present, replace rows.
        We respect partial updates (fields omitted won't be overwritten).
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        request = self.context.get("request")
        if request and any(k in request.data for k in ("availability", "availabilities", "availability_list")):
            raw_payload = (
                request.data.get("availability")
                or request.data.get("availabilities")
                or request.data.get("availability_list")
            )
            slots = _normalize_availability_payload(raw_payload)

            # only modify FREE slots; never delete booked ones

            # Existing availability rows for this service
            existing = list(Availability.objects.filter(service=instance))
            # Map of (date, start_time, end_time) -> Availability
            existing_by_key = {
                (a.date, a.start_time, a.end_time): a
                for a in existing
            }

            # Incoming desired free slots as keys
            incoming_keys = set(
                (s["date"], s["start_time"], s["end_time"])
                for s in slots
            )

            # 1) Delete unbooked slots that are NOT in incoming payload
            for a in existing:
                key = (a.date, a.start_time, a.end_time)
                # Check if this availability is currently booked
                has_booking = Booking.objects.filter(time=a).exists()
                if has_booking:
                    # booked slots must be preserved, regardless of payload
                    continue

                # If this free slot is not in the payload, delete it
                if key not in incoming_keys:
                    a.delete()

            # 2) Create new free slots that don't already exist
            for s in slots:
                key = (s["date"], s["start_time"], s["end_time"])
                if key in existing_by_key:
                    # already have this slot, leave as is
                    continue
                Availability.objects.create(service=instance, **s)

            return instance


# Optional Simple version — for lists, where full detail not needed
class SimpleServiceSerializer(BaseServiceSerializer):
    class Meta(BaseServiceSerializer.Meta):
        fields = BaseServiceSerializer.Meta.fields


# Booking Serializer
class BookingSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())
    service_name = serializers.SerializerMethodField()
    provider_name = serializers.CharField(source='service.user.name', read_only=True)
    time = serializers.PrimaryKeyRelatedField(queryset=Availability.objects.all())
    time_detail = AvailabilitySerializer(source="time", read_only=True)
    customer_id = serializers.IntegerField(source="user_id", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "service",
            "service_name",
            "provider_name",
            "time",
            "time_detail",
            "location",
            "customer_id",
            "customer_name",
            "customer_email",
            "created_at",
            "image",
        ]
        read_only_fields = ["created_at"]

    def get_service_name(self, obj):
        return obj.service.name if obj.service else None

    def get_image(self, obj):
        request = self.context.get('request')
        service = obj.service
        if not service:
            return None

        images = service.images.all()
        if not images:
            return None

        first_image = images.first()
        if not first_image or not first_image.image:
            return None

        try:
            image_url = first_image.image.url
        except Exception:
            return None

        if request:
            try:
                return request.build_absolute_uri(image_url)
            except Exception:
                return image_url
        return image_url

    def validate(self, attrs):
        service = attrs.get("service")
        slot = attrs.get("time")

        if slot.service_id != service.id:
            raise serializers.ValidationError(
                {"time": "This availability slot does not belong to the specified service."}
            )

        if Booking.objects.filter(time=slot).exists():
            raise serializers.ValidationError({"time": "This availability slot is already booked."})

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError({"detail": "Authentication required."})
        return Booking.objects.create(user=user, **validated_data)


# User Me Serializer
class UserMeSerializer(serializers.ModelSerializer):
    services = FullServiceSerializer(many=True, read_only=True)
    bookings = BookingSerializer(source="customer_bookings", many=True, read_only=True)
    saved_services = FullServiceSerializer(many=True, read_only=True)

    # make profile_picture writable so uploaded files are accepted on PATCH
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "location", "profile_picture", "services", "bookings", "saved_services"]
        read_only_fields = ["email"]

    def to_representation(self, instance):
        """
        Return canonical representation for the user and ensure profile_picture is an absolute URL.
        """
        request = self.context.get("request")
        rep = super().to_representation(instance)

        pic = None
        try:
            if getattr(instance, "profile_picture", None):
                pic = instance.profile_picture.url
        except Exception:
            pic = rep.get("profile_picture")

        if pic and request:
            try:
                rep["profile_picture"] = request.build_absolute_uri(pic)
            except Exception:
                rep["profile_picture"] = pic
        else:
            rep["profile_picture"] = None

        return rep


# alias for convenience
ServiceSerializer = FullServiceSerializer
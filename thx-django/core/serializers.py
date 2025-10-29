from datetime import datetime, time as dt_time
import json

from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_datetime
from rest_framework import serializers
from django.utils.timezone import localdate, localtime, now
from django.db.models import Q

from .models import Service, Availability, Booking, ServiceImage

User = get_user_model()

# def get_active_demo_user(request=None):
#     # Header or query param controls which demo we use
#     sel = None
#     if request is not None:
#         sel = request.headers.get("X-Demo-User") or request.query_params.get("demo")

#     if str(sel) in ("2", "demo2"):
#         email = "rphan01@villanova.edu"
#         defaults = {"name": "Rachel", "location": "Corr Hall"}
#     else:
#         email = "mdang01@villanova.edu"
#         defaults = {"name": "Mya", "location": "Friar Hall"}

#     user, _ = User.objects.get_or_create(email=email, defaults=defaults)
#     return user

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
        try: raw = json.loads(raw)
        except Exception: return []
    if isinstance(raw, list):
        cleaned = []
        for s in raw:
            d, st, et = s.get("date"), s.get("start_time"), s.get("end_time")
            if not (d and st and et): continue
            try:
                d_obj = datetime.strptime(d, "%Y-%m-%d").date()
                st_obj = _parse_hhmmss(st); et_obj = _parse_hhmmss(et)
            except Exception: continue
            if st_obj >= et_obj: continue
            cleaned.append({"date": d_obj, "start_time": st_obj, "end_time": et_obj})
        return cleaned
    # legacy { "YYYY-MM-DD": [{start, end}] } allowed but ONLY uses time parts — no UTC shift
    if isinstance(raw, dict):
        from django.utils.dateparse import parse_datetime
        cleaned = []
        for d, slots in raw.items():
            try: d_obj = datetime.strptime(d, "%Y-%m-%d").date()
            except Exception: continue
            for s in (slots or []):
                sd, ed = parse_datetime(s.get("start")), parse_datetime(s.get("end"))
                if not (sd and ed): continue
                st_obj = sd.timetz().replace(tzinfo=None) if hasattr(sd, "timetz") else sd.time()
                et_obj = ed.timetz().replace(tzinfo=None) if hasattr(ed, "timetz") else ed.time()
                if st_obj >= et_obj: continue
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


# Full Service Serializer — includes everything (used in UserMeSerializer, detailed views)
class FullServiceSerializer(BaseServiceSerializer):
    availabilities = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    location = serializers.CharField(source='user.location', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    image = serializers.ImageField(required=False)
    isSaved = serializers.BooleanField(default=False)
    provider_name = serializers.CharField(source='user.name', read_only=True)

    class Meta(BaseServiceSerializer.Meta):
        fields = BaseServiceSerializer.Meta.fields + [
            "image", "isSaved", "availabilities", "user_id", "images", "provider_name", "location"
        ]

    def get_availabilities(self, obj):
        request = self.context.get("request")
        include_booked = False
        if request:
            include_booked = str(request.query_params.get("include_booked", "")).lower() in ("1","true","yes")

        qs = obj.availabilities.all()
        if not include_booked:
            qs = qs.exclude(booking__isnull=False)

        today = localdate()
        current_t = localtime(now()).time()
        qs = qs.filter(Q(date__gt=today) | Q(date=today, end_time__gt=current_t)).order_by("date","start_time")

        return [
            {
                "id": a.id,
                "date": a.date.isoformat(),
                "start_time": a.start_time.strftime("%H:%M:%S"),
                "end_time": a.end_time.strftime("%H:%M:%S"),
            } for a in qs
        ]

    def get_images(self, obj):
        return ServiceImageSerializer(obj.images.all(), many=True, context=self.context).data

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
            Availability.objects.bulk_create(
                Availability(service=service, **s) for s in slots
            )

        return service

    def update(self, instance, validated_data):
        """
        Update fields. If availability payload is present, replace rows.
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

            Availability.objects.filter(service=instance).delete()
            if slots:
                Availability.objects.bulk_create(
                    Availability(service=instance, **s) for s in slots
                )

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
            'provider_name', 
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

        image_url = first_image.image.url  # Correct reference to ImageField

        if request:
            return request.build_absolute_uri(image_url)

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

    class Meta:
        model = User
        fields = ["id", "name", "email", "location", "profile_picture", "services", "bookings"]
        read_only_fields = ["email"]

# Service Image Serializer
class ServiceImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceImage
        fields = ("id", "url", "created_at")

    def get_url(self, obj):
        return obj.image.url if obj.image else None
    
ServiceSerializer = FullServiceSerializer
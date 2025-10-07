from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Service, Availability, Booking
from django.utils.dateparse import parse_datetime

# DEMO USER
User = get_user_model()

# def get_demo_user(): 
#     # create demo user
#     demo, _ = User.objects.get_or_create(
#         email = 'mdang01@villanova.edu',
#         defaults = {'username': 'mdang', 
#                     'name': 'Mya',
#                     'location': 'Friar Hall'}
#     )
#     return demo

def get_active_demo_user(request=None):
    # Header or query param controls which demo we use
    sel = None
    if request is not None:
        sel = request.headers.get("X-Demo-User") or request.query_params.get("demo")

    if str(sel) in ("2", "demo2"):
        email = "rphan01@villanova.edu"
        defaults = {"name": "Rachel", "location": "Corr Hall"}
    else:
        email = "mdang01@villanova.edu"
        defaults = {"name": "Mya", "location": "Friar Hall"}

    user, _ = User.objects.get_or_create(email=email, defaults=defaults)
    return user


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ["id", "date", "start_time", "end_time"]


class ServiceSerializer(serializers.ModelSerializer):
    # availabilities = AvailabilitySerializer(many=True, read_only=True)
    availabilities = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ["id", "name", "description", "price", "type", "image", "isSaved", "availabilities"]

    def get_availabilities(self, obj):
        """
        By default, return only *unbooked* slots.
        If you ever need the old behavior, allow `?include_booked=true`.
        """
        req = self.context.get("request")
        include_booked = False
        if req:
            flag = req.query_params.get("include_booked")
            include_booked = str(flag).lower() in ("1", "true", "yes")

        qs = obj.availabilities.all()
        if not include_booked:
            # Fast and simple: exclude any slot that has a Booking referencing it
            booked_ids = Booking.objects.values_list("time_id", flat=True)
            qs = qs.exclude(id__in=booked_ids)

        qs = qs.order_by("date", "start_time")
        return AvailabilitySerializer(qs, many=True).data
    
    def create(self, validated_data):
        # Pick an owner: authenticated user, or the demo user when anonymous
        req = self.context.get("request")
        user = getattr(req, "user", None)
        if not getattr(user, "is_authenticated", False):
            user = get_active_demo_user()

        service = Service.objects.create(user=user, **validated_data)

        # (Optional) create Availability from incoming payload (both shapes)
        incoming = req.data if req else {}
        to_create = []

        # A) list of dicts: [{"date", "start_time", "end_time"}, ...]
        slots_list = incoming.get("availabilities") or incoming.get("availability_list")
        if isinstance(slots_list, list):
            for s in slots_list:
                if {"date", "start_time", "end_time"} <= set(s.keys()):
                    to_create.append(Availability(service=service, **s))

        # B) map of date -> [{start, end}] (string or dict)
        slots_map = incoming.get("availability")
        if isinstance(slots_map, str):
            import json
            try:
                slots_map = json.loads(slots_map)
            except Exception:
                slots_map = None
        if isinstance(slots_map, dict):
            for date_key, slots in slots_map.items():
                for slot in slots or []:
                    sd = parse_datetime(slot.get("start"))
                    ed = parse_datetime(slot.get("end"))
                    if sd and ed:
                        to_create.append(Availability(
                            service=service,
                            date=date_key,
                            start_time=sd.time(),
                            end_time=ed.time(),
                        ))

        if to_create:
            Availability.objects.bulk_create(to_create)

        return service
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class BookingSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())
    time = serializers.PrimaryKeyRelatedField(queryset=Availability.objects.all())
    time_detail = AvailabilitySerializer(source="time", read_only=True)
    customer_id = serializers.IntegerField(source="user_id", read_only=True)  # ⬅️ NEW

    class Meta:
        model = Booking
        fields = [
            "id",
            "service",
            "time",
            "time_detail",
            "location",          # suggested location
            "customer_id",   
            "customer_name",
            "customer_email",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        service = attrs.get("service")
        slot = attrs.get("time")

        # Ensure the slot belongs to the same service
        if slot.service_id != service.id:
            raise serializers.ValidationError(
                {"time": "This availability slot does not belong to the specified service."}
            )

        # (Optional) App-level guard against double booking (DB unique also covers this)
        if Booking.objects.filter(time=slot).exists():
            raise serializers.ValidationError({"time": "This availability slot is already booked."})

        return attrs
    
    def create(self, validated_data):
        req = self.context.get("request")
        user = getattr(req, "user", None)
        if not getattr(user, "is_authenticated", False):
            user = get_active_demo_user(req)

        return Booking.objects.create(user=user, **validated_data)
    
class UserMeSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    bookings = BookingSerializer(source="customer_bookings", many=True, read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "name", "email", "location", "profile_picture", "services", "bookings"]
        read_only_fields = ["email"]

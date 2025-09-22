from rest_framework import serializers
from .models import Service, Booking

class ServiceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Service
        fields = ["id","name","description","price","tag","availability","image","image_url","created_at"]
        read_only_fields = ["id","image_url","created_at"]
    def get_image_url(self, obj):
        req = self.context.get("request")
        return req.build_absolute_uri(obj.image.url) if (req and obj.image) else None

class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    class Meta:
        model = Booking
        fields = ["id","service","service_name","client_name","client_email","location","date","start_iso","end_iso","status","created_at"]
        read_only_fields = ["id","service_name","status","created_at"]

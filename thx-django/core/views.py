from rest_framework import viewsets, status
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Service, Booking
from .serializers import ServiceSerializer, BookingSerializer

# Create your views here.

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by("-id")
    serializer_class = ServiceSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # JSON + file upload

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by("-id")
    serializer_class = BookingSerializer
    http_method_names = ["get","post","patch","delete"]

    # Optional: prevent double-booking of the exact same slot
    def create(self, request, *args, **kwargs):
        s = request.data.get("service")
        d = request.data.get("date")
        start = request.data.get("start_iso")
        if s and d and start and Booking.objects.filter(service_id=s, date=d, start_iso=start).exists():
            return Response({"detail":"This time is already booked."}, status=status.HTTP_409_CONFLICT)
        return super().create(request, *args, **kwargs)


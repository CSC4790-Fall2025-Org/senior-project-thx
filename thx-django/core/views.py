from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_datetime


from .models import Service, Availability, Booking
from .serializers import UserMeSerializer, ServiceSerializer, BookingSerializer, get_active_demo_user

# DEMO USER
# User = get_user_model()

# def get_demo_user(): 
#     # create demo user
#     demo, _ = User.objects.get_or_create(
#         email = 'mdang01@villanova.edu',
#         defaults = {'username': 'mdang', 
#                     'name': 'Mya',
#                     'location': 'Friar Hall'}
#     )
#     return demo

def resolve_request_user(request):
    """
    Priority:
      1) authenticated request.user
      2) header X-User-Id or userId
      3) X-Demo-User / ?demo=  -> uses serializers.get_active_demo_user
      4) default demo
    """
    if getattr(request.user, "is_authenticated", False):
        return request.user

    header_user_id = request.headers.get("X-User-Id") or request.headers.get("userId")
    if header_user_id:
        try:
            return User.objects.get(id=header_user_id)
        except User.DoesNotExist:
            pass

    # use the single source of truth
    return get_active_demo_user(request)

class ProfileMeView(APIView):
    """
    GET   /api/profile/me/   -> demo profile + demo services
    PATCH /api/profile/me/   -> update demo profile fields
    """
    def get(self, request):
        user = get_active_demo_user()
        ser = UserMeSerializer(user, context={"request": request})
        return Response(ser.data)

    def patch(self, request):
        user = get_active_demo_user()
        ser = UserMeSerializer(user, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_200_OK)

# class ProfileMeView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         serializer = UserMeSerializer(request.user, context={"request": request})
#         return Response(serializer.data)

#     def patch(self, request):
#         serializer = UserMeSerializer(
#             request.user, data=request.data, partial=True, context={"request": request}
#         )
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data, status=status.HTTP_200_OK)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    GET    /api/services/?tag=Beauty&name=hair
    POST   /api/services/
    GET    /api/services/{id}/
    PATCH  /api/services/{id}/
    DELETE /api/services/{id}/
    """
    serializer_class = ServiceSerializer
    lookup_field = "id"

    def get_queryset(self):
        qs = Service.objects.all().order_by("-id")  # newest first
        tag = (self.request.query_params.get("tag") or "").strip()
        name = (self.request.query_params.get("name") or "").strip()

        if tag:
            qs = qs.filter(type__iexact=tag)          # exact value match
        if name:
            qs = qs.filter(name__icontains=name)      # partial, case-insensitive

        return qs
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request  # ensures get_availabilities sees the query params
        return ctx

    def perform_create(self, serializer):
        # DRF already injects request into serializer.context,
        # so no need to pass it here.
        serializer.save()
        # serializer.save(context={"request": self.request})


class BookingViewSet(viewsets.ModelViewSet):
    """
    POST /api/bookings/
      { "service": <service_id>, "time": <availability_id>, "location": "...",
        "customer_name": "...", "customer_email": "..." }

    GET  /api/bookings/  -> bookings for current user (by auth, header, or demo)
    DELETE /api/bookings/{id}/  -> delete own booking; slot becomes available again
    """
    serializer_class = BookingSerializer
    queryset = Booking.objects.select_related("service", "time").order_by("-created_at")
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        user = resolve_request_user(self.request)
        return self.queryset.filter(user=user)

    def create(self, request, *args, **kwargs):
        # attach user resolved from request
        user = resolve_request_user(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Optional: sanity check availability exists
        availability_id = serializer.validated_data["time"].id
        _ = get_object_or_404(Availability, id=availability_id)

        booking = Booking.objects.create(user=user, **serializer.validated_data)
        out = self.get_serializer(booking)
        return Response(out.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/bookings/{id}/
        Only deletes the current user's booking. After deletion, the slot is free
        because no Booking row points to that Availability anymore (your unique
        constraint on Booking.time will allow a new booking to be created).
        """
        instance = self.get_object()  # respects get_queryset scoping to current user
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
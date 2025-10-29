from rest_framework.views import APIView
from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_datetime

from .models import Service, Availability, Booking, ServiceImage
from .serializers import (
    UserMeSerializer,
    ServiceSerializer,
    BookingSerializer,
    ServiceImageSerializer,
    get_active_demo_user,
)

# User = get_user_model()


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

    return get_active_demo_user(request)


class ProfileMeView(APIView):
    """
    GET   /api/profile/me/   -> demo profile + demo services
    PATCH /api/profile/me/   -> update demo profile fields
    """
    def get(self, request):
        user = request.user
        ser = UserMeSerializer(user, context={"request": request})
        return Response(ser.data)

    def patch(self, request):
        user = request.user
        ser = UserMeSerializer(user, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_200_OK)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    GET    /api/services/?tag=Beauty&name=hair
    POST   /api/services/          (supports multipart/form-data with repeated 'images' files)
    GET    /api/services/{id}/
    PATCH  /api/services/{id}/     (supports multipart/form-data to append new images)
    DELETE /api/services/{id}/
    """
    serializer_class = ServiceSerializer
    lookup_field = "id"
    parser_classes = (MultiPartParser, FormParser)  # enable multipart parsing for uploads

    def get_queryset(self):
        qs = Service.objects.all().order_by("-id")  # newest first
        tag = (self.request.query_params.get("tag") or "").strip()
        name = (self.request.query_params.get("name") or "").strip()

        if tag:
            qs = qs.filter(type__iexact=tag)
        if name:
            qs = qs.filter(name__icontains=name)

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_image_save(self, service, files):
        """
        Persist ServiceImage objects for uploaded files (files is an iterable of UploadedFile).
        Returns list of ServiceImage instances created.
        """
        created = []
        for f in files:
            img = ServiceImage.objects.create(service=service, image=f)
            created.append(img)
        return created

    def create(self, request, *args, **kwargs):
        """
        Handle POST /api/services/
        Accepts JSON or multipart/form-data. If 'images' files are included, store them.
        """
        data = request.data.copy()

        # resolve the user from auth/header/demo
        user = resolve_request_user(request)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        # Save service with the user attached (prevents NOT NULL constraint failure)
        service = serializer.save(user=user)

        files = request.FILES.getlist("images")
        if files:
            self.perform_image_save(service, files)

        out = ServiceSerializer(service, context={"request": request})
        headers = self.get_success_headers(serializer.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)
        

    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH /api/services/{id}/
        Accepts JSON or multipart/form-data. If 'images' files are included, append them.
        """
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        data = request.data.copy()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        files = request.FILES.getlist("images")
        if files:
            self.perform_image_save(instance, files)

        out = ServiceSerializer(instance, context={"request": request}).data
        return Response(out)

    @action(detail=True, methods=["post"], url_path="toggle-save")
    def toggle_save(self, request, id=None):
        """
        POST /api/services/{id}/toggle-save/
        Toggles whether the logged-in user has saved this service.
        Returns JSON: {"saved": true/false}
        """
        service = self.get_object()
        user = resolve_request_user(request)  # your helper for getting demo/auth user

        if service in user.saved_services.all():
            user.saved_services.remove(service)
            saved = False
        else:
            user.saved_services.add(service)
            saved = True

        return Response({"saved": saved}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"], url_path="saved")
    def list_saved(self, request):
        user = resolve_request_user(request)
        qs = user.saved_services.all()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ServiceImageViewSet(mixins.DestroyModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    DELETE /api/service-images/{id}/ -> deletes DB row and file from storage
    GET /api/service-images/{id}/ -> info about single image
    """
    queryset = ServiceImage.objects.all().order_by("-created_at")
    serializer_class = ServiceImageSerializer
    # Add permission checks here if required (ownership, authentication)

    def perform_destroy(self, instance):
        # delete file from storage first
        try:
            instance.image.delete(save=False)
        except Exception:
            pass
        instance.delete()


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
        instance = self.get_object()  # respects get_queryset scoping to current user
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
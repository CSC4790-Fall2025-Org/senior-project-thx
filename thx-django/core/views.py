from rest_framework.views import APIView
from rest_framework import viewsets, status, mixins, parsers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ParseError
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_datetime
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Notification
from django.db.models import Q
import logging
import json
from datetime import datetime, date, time
from typing import List, Dict, Any
from .models import Service, Availability, Booking, ServiceImage
from .serializers import (
    UserMeSerializer,
    ServiceSerializer,
    BookingSerializer,
    ServiceImageSerializer,
)

logger = logging.getLogger(__name__)

# Ensure User is available for resolve_request_user
User = get_user_model()

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
    return None


class ProfileMeView(APIView):
    """
    GET   /api/profile/me/   -> profile for current user (or demo)
    PATCH /api/profile/me/   -> update profile fields (accepts multipart for file uploads and JSON)
    """
    # Accept multipart/form-data, form, and JSON
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get(self, request):
        # Resolve the effective user (supports demo/header fallback when unauthenticated)
        user = resolve_request_user(request)
        ser = UserMeSerializer(user, context={"request": request})
        return Response(ser.data)

    def patch(self, request):
        # DEBUG: log incoming raw data to help troubleshoot
        logger.debug("[ProfileMeView.patch] REQUEST.CONTENT_TYPE=%s", request.content_type)
        try:
            logger.debug("[ProfileMeView.patch] REQUEST.DATA keys: %s", list(request.data.keys()))
        except Exception:
            logger.debug("[ProfileMeView.patch] REQUEST.DATA unreadable")

        # Resolve the effective user so we don't pass AnonymousUser to the serializer
        user = resolve_request_user(request)
        if user is None:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data.copy()

        # Special-case: clearing the profile picture. Client sends profile_picture='' in multipart
        # to indicate "clear". When that happens, remove the file and omit profile_picture from data so serializer doesn't try to set invalid value.
        if "profile_picture" in data and not request.FILES.get("profile_picture") and str(data.get("profile_picture", "")).strip() == "":
            try:
                # remove file from storage and clear the field
                user.profile_picture.delete(save=False)
            except Exception:
                pass
            user.profile_picture = None
            user.save()
            # remove key so serializer doesn't confuse empty-string with actual upload
            data.pop("profile_picture", None)

        # Prevent accidental overwrite with blank strings for text fields:
        # If the client submits name/location/email as an empty string but didn't intend to clear them,
        # we remove those keys so they remain unchanged.
        for k in ("name", "location", "email"):
            if k in data and (data.get(k) is None or str(data.get(k)).strip() == ""):
                data.pop(k, None)

        ser = UserMeSerializer(user, data=data, partial=True, context={"request": request})
        if not ser.is_valid():
            logger.warning("[ProfileMeView.patch] serializer invalid. errors=%s request.data=%s", ser.errors, request.data)
            return Response({"detail": "Invalid data", "errors": ser.errors}, status=status.HTTP_400_BAD_REQUEST)

        # Save validated fields
        ser.save()

        # After save, re-serialize and return full canonical object (guarantees profile_picture and other fields present)
        user.refresh_from_db()
        out = UserMeSerializer(user, context={"request": request}).data
        logger.debug("[ProfileMeView.patch] saved. returning: %s", out)
        return Response(out, status=status.HTTP_200_OK)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    GET    /api/services/?tag=Beauty&name=hair
    POST   /api/services/          (multipart or JSON; 'images' optional)
    GET    /api/services/{id}/
    PATCH  /api/services/{id}/     (multipart or JSON; can replace availability)
    DELETE /api/services/{id}/
    """
    serializer_class = ServiceSerializer
    lookup_field = "id"
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)
    permission_classes = (IsAuthenticatedOrReadOnly,)

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
        Requires authentication. Attaches request.user to the service.
        """
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data.copy()
        serializer = self.get_serializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        service = serializer.save()  # user handled in serializer.create

        files = request.FILES.getlist("images") if hasattr(request.FILES, "getlist") else []
        if files:
            self.perform_image_save(service, files)

        out = ServiceSerializer(service, context={"request": request})
        headers = self.get_success_headers(serializer.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH /api/services/{id}/
        Auth required. Support removing existing images via 'remove_image_ids' (JSON list or comma-separated string)
        and appending new uploaded files under 'images'.
        """
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        data = request.data.copy()

        # Parse remove_image_ids if present (could be JSON string or comma-separated)
        remove_ids_raw = data.get("remove_image_ids") or data.get("deleted_image_ids") or None
        remove_ids = []
        if remove_ids_raw:
            try:
                # try JSON first
                if isinstance(remove_ids_raw, str):
                    remove_ids = json.loads(remove_ids_raw)
                else:
                    remove_ids = list(remove_ids_raw)
            except Exception:
                # fallback: comma-separated integers
                try:
                    remove_ids = [int(x.strip()) for x in str(remove_ids_raw).split(",") if x.strip().isdigit()]
                except Exception:
                    remove_ids = []

        if remove_ids:
            logger.debug("[ServiceViewSet.partial_update] removing images: %s", remove_ids)
            ServiceImage.objects.filter(id__in=remove_ids, service=instance).delete()

        # Use serializer to update other fields (availability handling is in serializer.update)
        serializer = self.get_serializer(instance, data=data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Save any newly uploaded images
        files = request.FILES.getlist("images") if hasattr(request.FILES, "getlist") else []
        if files:
            self.perform_image_save(instance, files)

        # Refresh and return canonical representation
        instance.refresh_from_db()
        out = ServiceSerializer(instance, context={"request": request}).data
        return Response(out, status=status.HTTP_200_OK)

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
        serializer = self.get_serializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        return super().destroy(request, *args, **kwargs)


class ServiceImageViewSet(mixins.DestroyModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    DELETE /api/service-images/{id}/ -> deletes DB row and file from storage
    GET /api/service-images/{id}/ -> info about single image
    """
    queryset = ServiceImage.objects.all().order_by("-created_at")
    serializer_class = ServiceImageSerializer
    # Add permission checks here if required (ownership, authentication)

    def perform_destroy(self, instance):
        # delete file from storage first (ServiceImage.delete handles it)
        try:
            instance.delete()
        except Exception:
            pass


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
        role = (self.request.query_params.get("role")
                or self.request.headers.get("X-Bookings-Role")
                or "client").lower()

        # if role not in {"client", "provider"}:
        #     raise ParseError(detail="Invalid role. Use 'client' or 'provider'.")

        qs = self.queryset
        if role == "provider":
            return qs.filter(service__user=user)
        elif role == "client":
            return qs.filter(user=user)
        else:
            return qs.filter(Q(user=user) | Q(service__user=user))
        # if role == "provider":
        #     return qs.filter(service__user=user)
        # elif role == "client":
        #     return qs.filter(user=user)
        # else:
        # # Allow both roles if unspecified (for DELETE calls that don't send ?role=)
        #     return qs.filter(Q(user=user) | Q(service__user=user))
        # if role == "provider":
        #     # Bookings made on services that this user provides
        #     return qs.filter(service__user=user)
        # # role == "client" (default): bookings this user made
        # return qs.filter(user=user)

    def create(self, request, *args, **kwargs):
        user = resolve_request_user(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        availability_id = serializer.validated_data["time"].id
        _ = get_object_or_404(Availability, id=availability_id)

        booking = Booking.objects.create(user=user, **serializer.validated_data)
        out = self.get_serializer(booking)
        return Response(out.data, status=status.HTTP_201_CREATED)

    # def destroy(self, request, *args, **kwargs):
    #     # NOTE: Deletion remains scoped to client-owned bookings.
    #     # Providers won't be able to delete client bookings through this action.
    #     instance = self.get_object()
    #     instance.delete()
    #     return Response(status=status.HTTP_204_NO_CONTENT)
    def destroy(self, request, *args, **kwargs):
        user = resolve_request_user(request)

        instance = get_object_or_404(
            Booking.objects.filter(Q(user=user) | Q(service__user=user)),
            pk=kwargs["pk"]
        )

        time_obj = getattr(instance, "time", None)
        if time_obj and hasattr(time_obj, "is_booked"):
            time_obj.is_booked = False
            time_obj.save(update_fields=["is_booked"])

        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.filter(
        recipient=request.user
    ).order_by('-created_at')

    data = [
        {
            "id": n.id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M"),
        }
        for n in notifications
    ]
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notif_id):
    try:
        notif = Notification.objects.get(id=notif_id, recipient=request.user)
        notif.is_read = True
        notif.save()
        return Response({"status": "ok"})
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=404)

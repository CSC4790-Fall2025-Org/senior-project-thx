from rest_framework import routers
from django.urls import path, include

from .views import ServiceViewSet, ServiceImageViewSet, BookingViewSet, ProfileMeView

router = routers.DefaultRouter()
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"service-images", ServiceImageViewSet, basename="service-image")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("", include(router.urls)),
    path("profile/me/", ProfileMeView.as_view(), name="profile-me"),
]
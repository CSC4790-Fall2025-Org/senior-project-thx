from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileMeView, ServiceViewSet, BookingViewSet
from django.contrib import admin
router = DefaultRouter()
router.register("services", ServiceViewSet, basename="service")
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("profile/me/", ProfileMeView.as_view(), name="profile-me"),
    path("", include(router.urls)),
    path('auth/', include('core.authentication.urls')), 
]

from . import views
from rest_framework import routers
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib import admin

from .views import ServiceViewSet, ServiceImageViewSet, BookingViewSet, ProfileMeView

router = DefaultRouter()
router.register("services", ServiceViewSet, basename="service")
router.register("service-images", ServiceImageViewSet, basename="service-image")
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("", include(router.urls)),
    path("profile/me/", ProfileMeView.as_view(), name="profile-me"),
    path('auth/', include('core.authentication.urls')),
    path('services/<int:pk>/toggle_saved/', ServiceViewSet.as_view({'post': 'toggle_saved'}), name='toggle_saved'),
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/<int:notif_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/<int:notif_id>/delete/', views.delete_notification, name='delete_notification'),
]
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib import admin
# from .views import ServiceViewSet, BookingViewSet

# router = DefaultRouter()
# router.register(r"services", ServiceViewSet, basename="services")
# router.register(r"bookings", BookingViewSet, basename="bookings")

urlpatterns = [
    path('auth/', include('core.authentication.urls')), 
]

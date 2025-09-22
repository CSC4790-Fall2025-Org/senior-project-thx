from django.contrib import admin
from .models import Service, Booking

# Register your models here.

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id","name","price","tag","created_at")
    search_fields = ("name","tag")

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id","service","client_name","date","status","created_at")
    list_filter = ("status","date")
    search_fields = ("client_name","client_email")

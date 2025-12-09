from django.contrib import admin
from .models import User, Service, Booking, Availability

admin.site.register(User)
admin.site.register(Service)
admin.site.register(Booking)
admin.site.register(Availability)

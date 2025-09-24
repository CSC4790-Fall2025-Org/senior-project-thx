from django.db import models

# Create your models here.

class Service(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    tag = models.CharField(max_length=50)  # "Haircuts", "Nails", etc.
    # {"YYYY-MM-DD": [{"start":"ISO", "end":"ISO"}], ...}
    availability = models.JSONField(default=dict, blank=True)
    image = models.ImageField(upload_to="service_images/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class Booking(models.Model):
    STATUS = [("requested","Requested"),("confirmed","Confirmed"),("canceled","Canceled")]
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="bookings")
    client_name = models.CharField(max_length=120)
    client_email = models.EmailField()
    location = models.CharField(max_length=200, blank=True)
    date = models.DateField()           # "YYYY-MM-DD"
    start_iso = models.CharField(max_length=40)
    end_iso = models.CharField(max_length=40)
    status = models.CharField(max_length=20, choices=STATUS, default="requested")
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.client_name} → {self.service.name} on {self.date}"

from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.conf import settings

# Create your models here.

class User(AbstractUser):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to="profile_pics/", blank=True, null=True)
    location = models.CharField(max_length=200, blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    groups = models.ManyToManyField(
        Group,
        related_name="custom_user_set", 
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_permissions_set",  
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )
    def __str__(self):
        return self.email
    
class Service(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    type = models.CharField(max_length=10)  # "Haircuts", "Nails", etc.
    image = models.ImageField(upload_to="service_images/", blank=True, null=True)
    def __str__(self): 
        return self.name

class Availability(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="availabilities")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    def __str__(self): 
        return f"{self.service.name} on {self.date}"

class Booking(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="bookings", null=True, blank=True)
    time = models.ForeignKey(Availability, on_delete=models.CASCADE)
    location = models.CharField(max_length=200, blank=True)
    def __str__(self): 
        return f"{self.service.name} on {self.time.date}"

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db.models import F, Q
from django.conf import settings
import os

# Create your models here.

class Service(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    type = models.CharField(max_length=10)  # "Haircuts", "Nails", etc.
    image = models.ImageField(upload_to="service_images/", blank=True, null=True)
    isSaved = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["type"]),
            models.Index(fields=["name"]),
        ]
        ordering = ["-id"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    name = models.CharField(max_length=100, blank = True)
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
    saved_services = models.ManyToManyField(Service, related_name="saved_by", blank=True)

    def __str__(self):
        return self.email


class Availability(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="availabilities")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        constraints = [
            # Prevent duplicate identical slots for the same service
            models.UniqueConstraint(
                fields=["service", "date", "start_time", "end_time"],
                name="uniq_service_date_start_end",
            ),
            # Ensure end_time is after start_time
            models.CheckConstraint(
                check=Q(end_time__gt=F("start_time")),
                name="end_after_start",
            ),
        ]
        indexes = [
            models.Index(fields=["service", "date", "start_time"]),
        ]
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.service.name} on {self.date}"


class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_bookings", null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="bookings", null=True, blank=True)
    time = models.OneToOneField(
        Availability,
        on_delete=models.CASCADE,
        related_name="booking",  # lets you do Availability.booking
    )
    location = models.CharField(max_length=200, blank=True)
    customer_name = models.CharField(max_length=120, blank=True)
    customer_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        try:
            return f"{self.service.name} on {self.time.date}"
        except Exception:
            return f"Booking {self.pk}"


@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    if created and instance.service and instance.service.user:
        Notification.objects.create(
            recipient=instance.service.user,
            message=f"{instance.customer_name or 'Someone'} booked your service '{instance.service.name}' for {instance.time.date}."
        )
        
class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.message[:40]}"


class ServiceImage(models.Model):
    service = models.ForeignKey(Service, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="services/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # more robust string representation
        return f"Image for service {self.service_id} ({self.id})"

    def delete(self, *args, **kwargs):
        """
        Ensure file is removed from storage when deleting a ServiceImage instance.
        """
        try:
            # store path, then delete model so storage backends remove the file
            storage = self.image.storage
            path = self.image.name
            super().delete(*args, **kwargs)
            if path:
                try:
                    storage.delete(path)
                except Exception:
                    pass
        except Exception:
            # fallback: ensure instance is deleted even when file removal fails
            try:
                super().delete(*args, **kwargs)
            except Exception:
                pass
from django.conf import settings
from django.db import models


class Booking(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmée"
        CANCELLED = "cancelled", "Annulée"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    room = models.ForeignKey("rooms.Room", on_delete=models.PROTECT, related_name="bookings")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.CONFIRMED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["room", "status", "starts_at", "ends_at"]),
            models.Index(fields=["user", "starts_at"]),
        ]

    def __str__(self):
        return f"{self.room} · {self.starts_at:%Y-%m-%d %H:%M}"
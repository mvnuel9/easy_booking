from django.utils import timezone
from rest_framework import serializers

from rooms.models import Room
from rooms.serializers import RoomSerializer
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(source="room", queryset=Room.objects.filter(is_active=True), write_only=True)

    class Meta:
        model = Booking
        fields = ("id", "room", "room_id", "starts_at", "ends_at", "status", "created_at")
        read_only_fields = ("id", "status", "created_at")

    def validate(self, attrs):
        starts_at = attrs["starts_at"]
        ends_at = attrs["ends_at"]
        if starts_at >= ends_at:
            raise serializers.ValidationError({"ends_at": "La fin doit être après le début."})
        if starts_at <= timezone.now():
            raise serializers.ValidationError({"starts_at": "La réservation doit commencer dans le futur."})
        if self.conflicts(attrs["room"], starts_at, ends_at):
            raise serializers.ValidationError({"room_id": "Cette salle est déjà réservée sur ce créneau."})
        return attrs

    @staticmethod
    def conflicts(room, starts_at, ends_at):
        return Booking.objects.filter(
            room=room,
            status=Booking.Status.CONFIRMED,
            starts_at__lt=ends_at,
            ends_at__gt=starts_at,
        ).exists()
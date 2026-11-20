from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from bookings.models import Booking
from .models import Room
from .serializers import RoomSerializer


def parse_filter_datetime(value, name):
    parsed = parse_datetime(value)
    if parsed is None:
        raise ValidationError({name: "Fournissez une date ISO valide."})
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed)
    return parsed


class RoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        rooms = Room.objects.filter(is_active=True)
        capacity = self.request.query_params.get("capacity")
        if capacity:
            try:
                minimum_capacity = int(capacity)
                if minimum_capacity < 1:
                    raise ValueError
            except ValueError as error:
                raise ValidationError({"capacity": "La capacité doit être un entier positif."}) from error
            rooms = rooms.filter(capacity__gte=minimum_capacity)

        equipment = self.request.query_params.get("equipment")
        if equipment:
            rooms = [room for room in rooms if equipment in room.equipment]

        starts_at = self.request.query_params.get("available_from")
        ends_at = self.request.query_params.get("available_to")
        if bool(starts_at) != bool(ends_at):
            raise ValidationError("Les filtres available_from et available_to doivent être fournis ensemble.")
        if starts_at and ends_at:
            start = parse_filter_datetime(starts_at, "available_from")
            end = parse_filter_datetime(ends_at, "available_to")
            if start >= end:
                raise ValidationError({"available_to": "La fin doit être après le début."})
            reserved_room_ids = Booking.objects.filter(
                status=Booking.Status.CONFIRMED,
                starts_at__lt=end,
                ends_at__gt=start,
            ).values_list("room_id", flat=True)
            rooms = [room for room in rooms if room.id not in reserved_room_ids]
        return rooms

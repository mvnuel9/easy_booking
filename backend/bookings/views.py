from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from rooms.models import Room
from .models import Booking
from .serializers import BookingSerializer


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related("room")

    def perform_create(self, serializer):
        room = serializer.validated_data["room"]
        starts_at = serializer.validated_data["starts_at"]
        ends_at = serializer.validated_data["ends_at"]
        with transaction.atomic():
            Room.objects.select_for_update().get(pk=room.pk)
            conflict = Booking.objects.filter(
                room=room,
                status=Booking.Status.CONFIRMED,
                starts_at__lt=ends_at,
                ends_at__gt=starts_at,
            ).exists()
            if conflict:
                raise ValidationError({"room_id": "Cette salle vient d’être réservée sur ce créneau."})
            serializer.save(user=self.request.user)

    @action(detail=True, methods=["patch"])
    def cancel(self, request, pk=None):
        booking = get_object_or_404(self.get_queryset(), pk=pk)
        if booking.status != Booking.Status.CONFIRMED:
            return Response({"detail": "Cette réservation n’est plus active."}, status=status.HTTP_400_BAD_REQUEST)
        if booking.starts_at <= timezone.now():
            return Response({"detail": "Une réservation commencée ne peut plus être annulée."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)
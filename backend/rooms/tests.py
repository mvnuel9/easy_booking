from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from bookings.models import Booking
from .models import Room


class RoomApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="Camille", email="camille@example.com", password="Room!Booking42")
        self.client.force_authenticate(self.user)
        self.small_room = Room.objects.create(name="Studio", capacity=4, equipment=["Écran"])
        self.large_room = Room.objects.create(name="Atelier", capacity=12, equipment=["Écran", "Visioconférence"])

    def test_filters_by_minimum_capacity_and_equipment(self):
        response = self.client.get("/api/rooms/?capacity=8&equipment=Visioconférence")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([room["name"] for room in response.data], ["Atelier"])

    def test_excludes_rooms_with_overlapping_confirmed_booking(self):
        start = timezone.now() + timedelta(days=1)
        Booking.objects.create(user=self.user, room=self.small_room, starts_at=start, ends_at=start + timedelta(hours=1))
        response = self.client.get("/api/rooms/", {
            "available_from": start.isoformat(),
            "available_to": (start + timedelta(minutes=30)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([room["name"] for room in response.data], ["Atelier"])

    def test_rejects_invalid_capacity(self):
        response = self.client.get("/api/rooms/?capacity=large")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_room_list_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/rooms/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
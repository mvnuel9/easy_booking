from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Booking
from rooms.models import Room


class BookingApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="Camille", email="camille@example.com", password="Room!Booking42")
        self.other_user = User.objects.create_user(username="Alex", email="alex@example.com", password="Room!Booking42")
        self.room = Room.objects.create(name="Studio", capacity=4, equipment=["Écran"])
        self.starts_at = timezone.now() + timedelta(days=2)
        self.payload = {
            "room_id": self.room.id,
            "starts_at": self.starts_at.isoformat(),
            "ends_at": (self.starts_at + timedelta(hours=1)).isoformat(),
        }
        self.client.force_authenticate(self.user)

    def test_creates_booking_and_returns_room_details(self):
        response = self.client.post("/api/bookings/", self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["room"]["name"], "Studio")
        self.assertEqual(Booking.objects.get().user, self.user)

    def test_rejects_overlapping_booking_but_allows_adjacent_slot(self):
        Booking.objects.create(user=self.other_user, room=self.room, starts_at=self.starts_at, ends_at=self.starts_at + timedelta(hours=1))
        response = self.client.post("/api/bookings/", self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("room_id", response.data)

        self.payload["starts_at"] = (self.starts_at + timedelta(hours=1)).isoformat()
        self.payload["ends_at"] = (self.starts_at + timedelta(hours=2)).isoformat()
        adjacent_response = self.client.post("/api/bookings/", self.payload, format="json")
        self.assertEqual(adjacent_response.status_code, status.HTTP_201_CREATED)

    def test_rejects_end_before_start_and_past_booking(self):
        invalid_range = {**self.payload, "ends_at": (self.starts_at - timedelta(minutes=1)).isoformat()}
        self.assertEqual(self.client.post("/api/bookings/", invalid_range, format="json").status_code, status.HTTP_400_BAD_REQUEST)
        past = {**self.payload, "starts_at": (timezone.now() - timedelta(hours=2)).isoformat()}
        self.assertEqual(self.client.post("/api/bookings/", past, format="json").status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_only_sees_and_cancels_their_own_bookings(self):
        own = Booking.objects.create(user=self.user, room=self.room, starts_at=self.starts_at, ends_at=self.starts_at + timedelta(hours=1))
        foreign = Booking.objects.create(user=self.other_user, room=self.room, starts_at=self.starts_at + timedelta(hours=1), ends_at=self.starts_at + timedelta(hours=2))
        listing = self.client.get("/api/bookings/")
        self.assertEqual([item["id"] for item in listing.data], [own.id])
        self.assertEqual(self.client.patch(f"/api/bookings/{foreign.id}/cancel/").status_code, status.HTTP_404_NOT_FOUND)
        cancelled = self.client.patch(f"/api/bookings/{own.id}/cancel/")
        self.assertEqual(cancelled.status_code, status.HTTP_200_OK)
        self.assertEqual(cancelled.data["status"], Booking.Status.CANCELLED)

    def test_cancelled_booking_releases_its_time_slot(self):
        booking = Booking.objects.create(
            user=self.user,
            room=self.room,
            starts_at=self.starts_at,
            ends_at=self.starts_at + timedelta(hours=1),
        )
        self.client.patch(f"/api/bookings/{booking.id}/cancel/")
        response = self.client.get("/api/rooms/", {
            "available_from": self.starts_at.isoformat(),
            "available_to": (self.starts_at + timedelta(hours=1)).isoformat(),
        })
        self.assertEqual([room["id"] for room in response.data], [self.room.id])
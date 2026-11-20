from rest_framework import status
from rest_framework.test import APITestCase


class AccountApiTests(APITestCase):
    def test_register_and_obtain_jwt_with_email(self):
        response = self.client.post("/api/auth/register/", {
            "username": "camille_martin",
            "email": "camille@example.com",
            "password": "Room!Booking42",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "camille@example.com")
        self.assertNotIn("password", response.data)

        token_response = self.client.post("/api/token/", {
            "email": "camille@example.com",
            "password": "Room!Booking42",
        }, format="json")
        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", token_response.data)
        self.assertIn("refresh", token_response.data)

    def test_rejects_duplicate_email_case_insensitively(self):
        payload = {"username": "Camille", "email": "camille@example.com", "password": "Room!Booking42"}
        self.client.post("/api/auth/register/", payload, format="json")
        payload["username"] = "Autre"
        payload["email"] = "CAMILLE@example.com"
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_weak_password(self):
        response = self.client.post("/api/auth/register/", {
            "username": "Camille", "email": "camille@example.com", "password": "12345678",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_rejects_invalid_login(self):
        response = self.client.post("/api/token/", {
            "email": "absent@example.com", "password": "Room!Booking42",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
import pytest
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Movie, Room
from users.models import User

REST_FRAMEWORK_OVERRIDE = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {},
    "EXCEPTION_HANDLER": "cineprime_api.exception_handler.standardized_exception_handler",
}


@pytest.fixture
def admin_client():
    client = APIClient()
    admin = User.objects.create_user(
        email="runtime-admin@example.com",
        username="runtime_admin",
        password="StrongPass123",
        is_staff=True,
    )
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def movie_120():
    return Movie.objects.create(
        title="Two-Hour Film",
        synopsis="A long film.",
        duration_minutes=120,
        release_date="2026-06-01",
        poster_url="https://example.com/poster.jpg",
    )


@pytest.fixture
def room():
    return Room.objects.create(name="Test Room", capacity=50, base_price="30.00")


@pytest.mark.django_db
@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_OVERRIDE)
def test_session_rejects_end_time_shorter_than_movie_runtime(admin_client, movie_120, room):
    """End time must cover the movie's runtime; the API returns 400 when it doesn't."""
    response = admin_client.post(
        "/api/v1/catalog/sessions/",
        {
            "movie": str(movie_120.id),
            "room": str(room.id),
            "start_time": "2026-07-01T19:00:00Z",
            "end_time": "2026-07-01T19:30:00Z",  # only 30 min, movie is 120 min
        },
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "end_time" in data.get("error", {}).get("details", {})


@pytest.mark.django_db
@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_OVERRIDE)
def test_session_accepts_end_time_equal_to_movie_runtime(admin_client, movie_120, room):
    """End time exactly matching runtime (start + 120 min) is valid."""
    response = admin_client.post(
        "/api/v1/catalog/sessions/",
        {
            "movie": str(movie_120.id),
            "room": str(room.id),
            "start_time": "2026-07-02T19:00:00Z",
            "end_time": "2026-07-02T21:00:00Z",  # exactly 120 min
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_OVERRIDE)
def test_session_accepts_end_time_within_tolerance(admin_client, movie_120, room):
    """End time up to 5 min short of runtime is accepted (tolerance buffer)."""
    response = admin_client.post(
        "/api/v1/catalog/sessions/",
        {
            "movie": str(movie_120.id),
            "room": str(room.id),
            "start_time": "2026-07-03T19:00:00Z",
            "end_time": "2026-07-03T20:56:00Z",  # 116 min — within 5 min tolerance
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_OVERRIDE)
def test_session_rejects_end_time_outside_tolerance(admin_client, movie_120, room):
    """End time 6 min short of runtime (outside 5-min tolerance) is rejected."""
    response = admin_client.post(
        "/api/v1/catalog/sessions/",
        {
            "movie": str(movie_120.id),
            "room": str(room.id),
            "start_time": "2026-07-05T19:00:00Z",
            "end_time": "2026-07-05T20:54:00Z",  # 114 min — outside 5-min tolerance
        },
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "end_time" in response.json().get("error", {}).get("details", {})


@pytest.mark.django_db
@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_OVERRIDE)
def test_session_accepts_longer_end_time(admin_client, movie_120, room):
    """End time longer than runtime (e.g. with intermission/ads) is valid."""
    response = admin_client.post(
        "/api/v1/catalog/sessions/",
        {
            "movie": str(movie_120.id),
            "room": str(room.id),
            "start_time": "2026-07-04T19:00:00Z",
            "end_time": "2026-07-04T21:30:00Z",  # 150 min — longer than runtime
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED

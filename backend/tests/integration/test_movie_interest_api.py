from itertools import count

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Movie, MovieInterest
from users.models import User

_ip_counter = count(1)


@pytest.mark.django_db
class TestMovieInterestApi:
    @pytest.fixture
    def movie(self):
        return Movie.objects.create(
            title="Em Breve: O Filme",
            synopsis="Um filme que está por vir.",
            duration_minutes=110,
            release_date="2027-01-01",
            poster_url="https://example.com/poster.jpg",
            status="em_breve",
        )

    @pytest.fixture
    def user_a(self):
        return User.objects.create_user(
            email="usera@example.com",
            username="user_a",
            password="StrongPass123",
        )

    @pytest.fixture
    def user_b(self):
        return User.objects.create_user(
            email="userb@example.com",
            username="user_b",
            password="StrongPass123",
        )

    @pytest.fixture
    def client_a(self, user_a):
        client = APIClient()
        client.force_authenticate(user=user_a)
        return client

    @pytest.fixture
    def client_b(self, user_b):
        client = APIClient()
        client.force_authenticate(user=user_b)
        return client

    @pytest.fixture
    def anon_client(self):
        client = APIClient()
        client.defaults["REMOTE_ADDR"] = f"10.50.60.{next(_ip_counter)}"
        return client

    def _url(self, movie):
        return f"/api/v1/catalog/movies/{movie.id}/interest/"

    # --- GET ---

    def test_get_returns_zero_count_and_null_for_anonymous(self, anon_client, movie):
        response = anon_client.get(self._url(movie))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0
        assert response.data["user_interested"] is None

    def test_get_returns_count_and_false_for_authenticated_non_interested(
        self, client_a, user_b, movie
    ):
        MovieInterest.objects.create(movie=movie, user=user_b)

        response = client_a.get(self._url(movie))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["user_interested"] is False

    def test_get_returns_count_and_true_for_interested_user(self, client_a, user_a, movie):
        MovieInterest.objects.create(movie=movie, user=user_a)

        response = client_a.get(self._url(movie))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["user_interested"] is True

    def test_get_returns_404_for_nonexistent_movie(self, anon_client):
        import uuid

        response = anon_client.get(f"/api/v1/catalog/movies/{uuid.uuid4()}/interest/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    # --- POST ---

    def test_post_marks_interest_and_returns_count(self, client_a, movie):
        response = client_a.post(self._url(movie))

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["count"] == 1
        assert response.data["user_interested"] is True
        assert MovieInterest.objects.filter(movie=movie).count() == 1

    def test_post_is_idempotent_when_already_interested(self, client_a, user_a, movie):
        MovieInterest.objects.create(movie=movie, user=user_a)

        response = client_a.post(self._url(movie))

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["count"] == 1
        assert MovieInterest.objects.filter(movie=movie).count() == 1

    def test_post_requires_authentication(self, anon_client, movie):
        response = anon_client.post(self._url(movie))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_post_multiple_users_accumulates_count(self, client_a, client_b, movie):
        client_a.post(self._url(movie))
        client_b.post(self._url(movie))

        response = client_a.get(self._url(movie))

        assert response.data["count"] == 2

    # --- DELETE ---

    def test_delete_removes_interest(self, client_a, user_a, movie):
        MovieInterest.objects.create(movie=movie, user=user_a)

        response = client_a.delete(self._url(movie))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not MovieInterest.objects.filter(movie=movie, user=user_a).exists()

    def test_delete_is_idempotent_when_not_interested(self, client_a, movie):
        response = client_a.delete(self._url(movie))

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_requires_authentication(self, anon_client, movie):
        response = anon_client.delete(self._url(movie))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_does_not_affect_other_users_interest(
        self, client_a, user_a, user_b, movie
    ):
        MovieInterest.objects.create(movie=movie, user=user_a)
        MovieInterest.objects.create(movie=movie, user=user_b)

        client_a.delete(self._url(movie))

        assert MovieInterest.objects.filter(movie=movie).count() == 1
        assert MovieInterest.objects.filter(movie=movie, user=user_b).exists()

    # --- Interest count isolation between movies ---

    def test_interest_is_scoped_to_movie(self, client_a, user_a, movie):
        other_movie = Movie.objects.create(
            title="Outro Filme",
            synopsis="Sinopse.",
            duration_minutes=90,
            release_date="2027-06-01",
            poster_url="https://example.com/other.jpg",
            status="em_breve",
        )
        MovieInterest.objects.create(movie=other_movie, user=user_a)

        response = client_a.get(self._url(movie))

        assert response.data["count"] == 0
        assert response.data["user_interested"] is False

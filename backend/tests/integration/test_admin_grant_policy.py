import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import AdminPermissionLog, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="admin@cineprime.local",
        username="admin",
        password="AdminPass123!",
    )


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        email="user@cineprime.local",
        username="regular",
        password="UserPass123!",
    )


@pytest.fixture
def second_admin(db):
    return User.objects.create_superuser(
        email="admin2@cineprime.local",
        username="admin2",
        password="AdminPass123!",
    )


def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


def grant_url(user):
    return f"/api/v1/users/{user.id}/admin/"


# --- Grant (POST) ---

@pytest.mark.django_db
def test_admin_can_grant_admin_to_user(admin_user, regular_user):
    client = auth_client(admin_user)

    response = client.post(grant_url(regular_user))

    assert response.status_code == status.HTTP_200_OK
    regular_user.refresh_from_db()
    assert regular_user.is_staff is True
    assert regular_user.is_superuser is True


@pytest.mark.django_db
def test_grant_creates_audit_log(admin_user, regular_user):
    client = auth_client(admin_user)
    client.post(grant_url(regular_user))

    log = AdminPermissionLog.objects.get(target=regular_user)
    assert log.action == AdminPermissionLog.Action.GRANTED
    assert log.actor == admin_user


@pytest.mark.django_db
def test_grant_is_idempotent(admin_user, regular_user):
    client = auth_client(admin_user)

    client.post(grant_url(regular_user))
    response = client.post(grant_url(regular_user))

    assert response.status_code == status.HTTP_200_OK
    assert AdminPermissionLog.objects.filter(target=regular_user).count() == 1


@pytest.mark.django_db
def test_regular_user_cannot_grant_admin(regular_user, second_admin):
    client = auth_client(regular_user)

    response = client.post(grant_url(second_admin))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_unauthenticated_cannot_grant_admin(api_client, regular_user):
    response = api_client.post(grant_url(regular_user))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_grant_returns_404_for_nonexistent_user(admin_user):
    import uuid
    client = auth_client(admin_user)

    response = client.post(f"/api/v1/users/{uuid.uuid4()}/admin/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


# --- Revoke (DELETE) ---

@pytest.mark.django_db
def test_admin_can_revoke_admin_from_another_admin(admin_user, second_admin):
    client = auth_client(admin_user)

    response = client.delete(grant_url(second_admin))

    assert response.status_code == status.HTTP_200_OK
    second_admin.refresh_from_db()
    assert second_admin.is_staff is False
    assert second_admin.is_superuser is False


@pytest.mark.django_db
def test_revoke_creates_audit_log(admin_user, second_admin):
    client = auth_client(admin_user)
    client.delete(grant_url(second_admin))

    log = AdminPermissionLog.objects.get(target=second_admin)
    assert log.action == AdminPermissionLog.Action.REVOKED
    assert log.actor == admin_user


@pytest.mark.django_db
def test_last_admin_cannot_be_revoked(admin_user, api_client):
    client = auth_client(admin_user)

    response = client.delete(grant_url(admin_user))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    admin_user.refresh_from_db()
    assert admin_user.is_staff is True


@pytest.mark.django_db
def test_regular_user_cannot_revoke_admin(regular_user, second_admin):
    client = auth_client(regular_user)

    response = client.delete(grant_url(second_admin))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_unauthenticated_cannot_revoke_admin(api_client, second_admin):
    response = api_client.delete(grant_url(second_admin))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_revoke_is_idempotent(admin_user, second_admin):
    client = auth_client(admin_user)

    client.delete(grant_url(second_admin))
    response = client.delete(grant_url(second_admin))

    assert response.status_code == status.HTTP_200_OK
    assert AdminPermissionLog.objects.filter(target=second_admin).count() == 1

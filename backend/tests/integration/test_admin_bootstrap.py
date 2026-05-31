import pytest
from django.core.management import call_command

from users.models import User


@pytest.fixture
def clean_users(db):
    User.objects.all().delete()


@pytest.mark.django_db
def test_bootstrap_creates_admin_when_none_exists(clean_users, monkeypatch):
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "admin@cineprime.local")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_USERNAME", "admin")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "StrongPass123!")

    call_command("bootstrap_admin")

    user = User.objects.get(email="admin@cineprime.local")
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.check_password("StrongPass123!")


@pytest.mark.django_db
def test_bootstrap_skips_when_admin_already_exists(clean_users, monkeypatch):
    User.objects.create_superuser(
        email="existing@cineprime.local",
        username="existing_admin",
        password="ExistingPass123!",
    )

    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "new@cineprime.local")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_USERNAME", "newadmin")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "NewPass123!")

    call_command("bootstrap_admin")

    assert not User.objects.filter(email="new@cineprime.local").exists()
    assert User.objects.filter(is_staff=True).count() == 1


@pytest.mark.django_db
def test_bootstrap_promotes_existing_user(clean_users, monkeypatch):
    user = User.objects.create_user(
        email="promote@cineprime.local",
        username="promote_me",
        password="OldPass123!",
    )
    assert user.is_staff is False

    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "promote@cineprime.local")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_USERNAME", "promote_me")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "AnyPass123!")

    call_command("bootstrap_admin")

    user.refresh_from_db()
    assert user.is_staff is True
    assert user.is_superuser is True
    # password is NOT changed when the user already existed
    assert user.check_password("OldPass123!")


@pytest.mark.django_db
def test_bootstrap_aborts_when_env_vars_missing(clean_users, monkeypatch):
    monkeypatch.delenv("BOOTSTRAP_ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("BOOTSTRAP_ADMIN_USERNAME", raising=False)
    monkeypatch.delenv("BOOTSTRAP_ADMIN_PASSWORD", raising=False)

    call_command("bootstrap_admin")

    assert not User.objects.filter(is_staff=True).exists()

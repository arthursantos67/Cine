from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = "users"

    def ready(self):
        from . import checks  # noqa: F401 — registra system checks de criptografia

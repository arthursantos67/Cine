from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = "users"

    def ready(self):
        from . import checks  # noqa: F401 — registra system checks de criptografia

        from cineprime_api.encryption import _get_fernet

        try:
            _get_fernet()
        except ValueError as exc:
            from django.core.exceptions import ImproperlyConfigured

            raise ImproperlyConfigured(
                f"SITE_CONFIG_ENCRYPTION_KEY inválida: {exc}. "
                'Gere com: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
            ) from exc

import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings
from django.core.checks import Error, Tags, Warning, register


@register(Tags.security)
def check_encryption_key(app_configs, **kwargs):
    messages = []
    raw = getattr(settings, "SITE_CONFIG_ENCRYPTION_KEY", None)

    if not raw and not settings.DEBUG:
        messages.append(
            Warning(
                "SITE_CONFIG_ENCRYPTION_KEY não está definida.",
                hint=(
                    "Em produção, defina SITE_CONFIG_ENCRYPTION_KEY com uma chave Fernet válida. "
                    "Gere com: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\". "
                    "Sem ela, a chave é derivada de SECRET_KEY — rotacionar SECRET_KEY invalida todos os tokens criptografados."
                ),
                id="cineprime.W001",
            )
        )

    if raw:
        key = raw.encode() if isinstance(raw, str) else raw
    else:
        key = base64.urlsafe_b64encode(
            hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        )

    try:
        Fernet(key)
    except (ValueError, Exception) as exc:
        messages.append(
            Error(
                f"SITE_CONFIG_ENCRYPTION_KEY inválida: {exc}",
                hint=(
                    "A chave deve ser uma string Fernet de 32 bytes em base64. "
                    "Gere com: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
                ),
                id="cineprime.E001",
            )
        )

    return messages

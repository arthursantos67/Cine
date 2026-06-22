"""
Fernet symmetric encryption for sensitive SiteConfig values.

The encryption key is read from SITE_CONFIG_ENCRYPTION_KEY (recommended for
production — generate once with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())").

If that var is absent, a key is derived from SECRET_KEY via SHA-256.  This is
convenient for development but means rotating SECRET_KEY invalidates all
encrypted values — set a dedicated key in production.

Encrypted values are stored with a "fernet:" prefix so legacy plaintext rows
continue to be readable until they are re-saved.
"""
import base64
import functools
import hashlib
import logging

from cryptography.fernet import Fernet
from django.conf import settings

logger = logging.getLogger(__name__)

_ENCRYPTED_PREFIX = "fernet:"


@functools.lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    raw = getattr(settings, "SITE_CONFIG_ENCRYPTION_KEY", None)
    if raw:
        key = raw.encode() if isinstance(raw, str) else raw
    else:
        # Derive a 32-byte Fernet key from SECRET_KEY.
        key = base64.urlsafe_b64encode(
            hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        )
    return Fernet(key)


def encrypt_value(plaintext: str) -> str:
    token = _get_fernet().encrypt(plaintext.encode()).decode()
    return f"{_ENCRYPTED_PREFIX}{token}"


def decrypt_value(stored: str) -> str:
    if not stored.startswith(_ENCRYPTED_PREFIX):
        logger.warning("SiteConfig value is unencrypted (plaintext); re-save to encrypt")
        return stored
    token = stored[len(_ENCRYPTED_PREFIX):]
    return _get_fernet().decrypt(token.encode()).decode()

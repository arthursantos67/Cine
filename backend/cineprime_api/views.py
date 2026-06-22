import hmac

from cryptography.fernet import InvalidToken
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .encryption import decrypt_value
from .health import HealthCheckService


def _health_response(result):
    status_code = 200 if result["status"] == "ok" else 503
    return JsonResponse(result, status=status_code)


@require_GET
def internal_tmdb_token(request):
    """Server-to-server endpoint for Next.js to retrieve the stored TMDB token."""
    internal_key = getattr(settings, "INTERNAL_API_KEY", None)
    provided_key = request.headers.get("X-Internal-Key", "")
    if not internal_key or not hmac.compare_digest(provided_key, internal_key):
        return JsonResponse({"error": "Forbidden"}, status=403)

    from users.models import SiteConfig
    try:
        cfg = SiteConfig.objects.get(key="tmdb_api_read_token")
        plaintext = decrypt_value(cfg.value) if cfg.value else None
        return JsonResponse({"value": plaintext or None})
    except SiteConfig.DoesNotExist:
        return JsonResponse({"value": None})
    except InvalidToken:
        return JsonResponse({"error": "Token de criptografia inválido — possível rotação de chave"}, status=503)


def health_check(request):
    return readiness_check(request)


def liveness_check(request):
    result = HealthCheckService().liveness()
    return _health_response(result)


def readiness_check(request):
    result = HealthCheckService().readiness()
    return _health_response(result)


def deep_health_check(request):
    result = HealthCheckService().deep()
    return _health_response(result)

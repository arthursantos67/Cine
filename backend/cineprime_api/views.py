from django.conf import settings
from django.http import JsonResponse

from .health import HealthCheckService


def _health_response(result):
    status_code = 200 if result["status"] == "ok" else 503
    return JsonResponse(result, status=status_code)


def internal_tmdb_token(request):
    """Server-to-server endpoint for Next.js to retrieve the stored TMDB token."""
    internal_key = getattr(settings, "INTERNAL_API_KEY", None)
    if not internal_key or request.headers.get("X-Internal-Key") != internal_key:
        return JsonResponse({"error": "Forbidden"}, status=403)

    from users.models import SiteConfig
    try:
        cfg = SiteConfig.objects.get(key="tmdb_api_read_token")
        return JsonResponse({"value": cfg.value or None})
    except SiteConfig.DoesNotExist:
        return JsonResponse({"value": None})


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

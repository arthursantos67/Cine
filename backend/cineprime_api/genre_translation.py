from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

from cineprime_api.localization import SUPPORTED_LOCALES

logger = logging.getLogger(__name__)

_MYMEMORY_URL = "https://api.mymemory.translated.net/get"
_REQUEST_TIMEOUT = 5
_MAX_WORKERS = 4
_MAX_RETRIES = 2
_TOTAL_TRANSLATE_TIMEOUT = 10


def _translate_one(name: str, source_locale: str, target_locale: str) -> tuple[str, str]:
    params = urllib.parse.urlencode({"q": name, "langpair": f"{source_locale}|{target_locale}"})
    url = f"{_MYMEMORY_URL}?{params}"

    for attempt in range(_MAX_RETRIES):
        try:
            with urllib.request.urlopen(url, timeout=_REQUEST_TIMEOUT) as response:  # noqa: S310 — URL base is constant; user params are URL-encoded
                data = json.loads(response.read())

            if data.get("responseStatus") == 429:
                raise ValueError(f"MyMemory daily limit reached for {target_locale}")

            translated = data["responseData"]["translatedText"]
            if not isinstance(translated, str) or not translated.strip():
                raise ValueError(f"Empty translation received for {target_locale}")

            return target_locale, translated.strip()
        except ValueError:
            raise
        except Exception:
            if attempt == _MAX_RETRIES - 1:
                raise


def translate_genre_name(name: str, source_locale: str) -> dict[str, str]:
    """
    Translate a genre name to all supported locales using the free MyMemory API.

    Returns a flat dict {locale: translated_name} for ALL supported locales
    (including the source locale). Locales that fail are omitted.
    Returns an empty dict only if all requests fail.
    """
    target_locales = [loc for loc in SUPPORTED_LOCALES if loc != source_locale]
    result: dict[str, str] = {source_locale: name}

    try:
        with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as executor:
            futures = {
                executor.submit(_translate_one, name, source_locale, loc): loc
                for loc in target_locales
            }
            for future in as_completed(futures, timeout=_TOTAL_TRANSLATE_TIMEOUT):
                loc = futures[future]
                try:
                    locale, translated = future.result()
                    result[locale] = translated
                except Exception:
                    logger.warning("Genre translation to %s failed for %r", loc, name)

        return result

    except Exception:
        logger.exception("Genre translation failed for %r (%s)", name, source_locale)
        return {}

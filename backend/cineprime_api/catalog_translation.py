from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError, as_completed

from cineprime_api.localization import SUPPORTED_LOCALES

logger = logging.getLogger(__name__)

_MYMEMORY_URL = "https://api.mymemory.translated.net/get"
_REQUEST_TIMEOUT = 3
_MAX_WORKERS = 4
_MAX_RETRIES = 1
_TOTAL_TRANSLATE_TIMEOUT = 5


def _translate_one(text: str, source_locale: str, target_locale: str) -> tuple[str, str]:
    params = urllib.parse.urlencode({"q": text, "langpair": f"{source_locale}|{target_locale}"})
    url = f"{_MYMEMORY_URL}?{params}"

    for attempt in range(_MAX_RETRIES):
        try:
            with urllib.request.urlopen(url, timeout=_REQUEST_TIMEOUT) as response:  # noqa: S310
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


def translate_text(text: str, source_locale: str) -> dict[str, str]:
    """
    Translate a short text string to all supported locales using the free MyMemory API.

    Returns a flat dict {locale: translated_text} for ALL supported locales
    (including the source locale). Locales that fail are omitted.
    Returns an empty dict only if all requests fail.
    """
    target_locales = [loc for loc in SUPPORTED_LOCALES if loc != source_locale]
    result: dict[str, str] = {source_locale: text}

    try:
        with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as executor:
            futures = {
                executor.submit(_translate_one, text, source_locale, loc): loc
                for loc in target_locales
            }
            try:
                for future in as_completed(futures, timeout=_TOTAL_TRANSLATE_TIMEOUT):
                    loc = futures[future]
                    try:
                        locale, translated = future.result()
                        result[locale] = translated
                    except Exception:
                        logger.warning("Translation to %s failed for %r", loc, text)
            except FutureTimeoutError:
                logger.warning(
                    "Translation timed out after %ss for %r; partial results returned",
                    _TOTAL_TRANSLATE_TIMEOUT,
                    text,
                )

        return result

    except Exception:
        logger.exception("Translation failed for %r (%s)", text, source_locale)
        return {}

import os
import time

import requests
from django.core.management.base import BaseCommand

from catalog.models import Movie
from cineprime_api.localization import DEFAULT_LOCALE, SUPPORTED_LOCALES

TMDB_BASE = "https://api.themoviedb.org/3"
TRANSLATION_LOCALES = [l for l in SUPPORTED_LOCALES if l != DEFAULT_LOCALE]


class Command(BaseCommand):
    help = "Fetch TMDB translations for all movies in all supported locales."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be updated without saving.",
        )
        parser.add_argument(
            "--movie-id",
            type=str,
            help="Update only the movie with this UUID.",
        )
        parser.add_argument(
            "--tmdb-id",
            type=int,
            help="Override TMDB ID (use with --movie-id for manual correction).",
        )

    def handle(self, *args, **options):
        token = os.environ.get("TMDB_API_READ_TOKEN")
        if not token:
            self.stderr.write(self.style.ERROR("TMDB_API_READ_TOKEN not set."))
            return

        headers = {"Authorization": f"Bearer {token}"}
        dry_run = options["dry_run"]
        movie_id = options.get("movie_id")

        qs = Movie.objects.all().order_by("title")
        if movie_id:
            qs = qs.filter(pk=movie_id)

        self.stdout.write(f"Processing {qs.count()} movie(s)...")

        forced_tmdb_id = options.get("tmdb_id")

        for movie in qs:
            self.stdout.write(f"\n→ {movie.title}")

            tmdb_id = forced_tmdb_id or self._find_tmdb_id(movie.title, headers)
            if tmdb_id is None:
                self.stdout.write(self.style.WARNING("  TMDB: not found, skipping."))
                continue

            self.stdout.write(f"  TMDB ID: {tmdb_id}")
            translations = dict(movie.translations or {})

            for locale in TRANSLATION_LOCALES:
                if locale == DEFAULT_LOCALE:
                    continue

                data = self._fetch_locale(tmdb_id, locale, headers)
                if data is None:
                    self.stdout.write(self.style.WARNING(f"  {locale}: fetch failed."))
                    continue

                title = data.get("title", "").strip()
                synopsis = data.get("overview", "").strip()

                if not title and not synopsis:
                    self.stdout.write(f"  {locale}: no content from TMDB.")
                    continue

                translations[locale] = {
                    "title": title,
                    "synopsis": synopsis,
                }
                self.stdout.write(self.style.SUCCESS(f"  {locale}: \"{title[:50]}\""))

                # Respect TMDB rate limit (40 req/10s)
                time.sleep(0.3)

            if not dry_run:
                movie.translations = translations
                movie.save(update_fields=["translations"])
            else:
                self.stdout.write("  [dry-run] not saved.")

        self.stdout.write(self.style.SUCCESS("\nDone."))

    def _find_tmdb_id(self, title: str, headers: dict) -> int | None:
        url = f"{TMDB_BASE}/search/movie"
        params = {"query": title, "language": "pt-BR", "page": 1}
        try:
            res = requests.get(url, params=params, headers=headers, timeout=10)
            res.raise_for_status()
            results = res.json().get("results", [])
            if not results:
                # Retry with English
                params["language"] = "en-US"
                res = requests.get(url, params=params, headers=headers, timeout=10)
                res.raise_for_status()
                results = res.json().get("results", [])
            return results[0]["id"] if results else None
        except Exception:
            return None

    def _fetch_locale(self, tmdb_id: int, locale: str, headers: dict) -> dict | None:
        url = f"{TMDB_BASE}/movie/{tmdb_id}"
        try:
            res = requests.get(url, params={"language": locale}, headers=headers, timeout=10)
            res.raise_for_status()
            return res.json()
        except Exception:
            return None

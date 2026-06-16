from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Genre
from cineprime_api.genre_translation import translate_genre_name
from cineprime_api.localization import DEFAULT_LOCALE, SUPPORTED_LOCALES, normalize_locale


class Command(BaseCommand):
    help = (
        "Auto-translate genre names to all supported locales using the MyMemory API. "
        "Skips genres that already have translations unless --force is given."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--source-language",
            default=DEFAULT_LOCALE,
            metavar="LOCALE",
            help=(
                f"Locale the existing genre names are written in "
                f"(default: {DEFAULT_LOCALE}). Supported: {', '.join(SUPPORTED_LOCALES)}."
            ),
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-translate genres that already have translations.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would happen without saving anything.",
        )

    def handle(self, *args, **options):
        source_language = normalize_locale(options["source_language"])
        if source_language is None:
            raise CommandError(
                f"Unsupported locale '{options['source_language']}'. "
                f"Expected one of: {', '.join(SUPPORTED_LOCALES)}."
            )

        dry_run: bool = options["dry_run"]
        force: bool = options["force"]

        genres = list(Genre.objects.order_by("name"))
        if not force:
            genres = [g for g in genres if not g.translations]

        if not genres:
            self.stdout.write("Nothing to translate — all genres already have translations.")
            return

        suffix = " (dry run)" if dry_run else ""
        self.stdout.write(
            f"Translating {len(genres)} genre(s) from '{source_language}'{suffix}...\n"
        )

        ok = failed = 0
        genres_to_save: list[tuple[Genre, list[str]]] = []

        for genre in genres:
            self.stdout.write(f"  {genre.name!r} ... ", ending="")
            try:
                translated = translate_genre_name(genre.name, source_language)
                if not translated:
                    self.stdout.write(self.style.WARNING("FAILED (API unavailable)"))
                    failed += 1
                    continue

                new_translations = {
                    loc: {"name": name}
                    for loc, name in translated.items()
                    if loc != DEFAULT_LOCALE
                }

                update_fields = ["translations"]
                genre.translations = new_translations

                if source_language != DEFAULT_LOCALE and DEFAULT_LOCALE in translated:
                    genre.name = translated[DEFAULT_LOCALE]
                    update_fields.append("name")

                if dry_run:
                    self.stdout.write(self.style.SUCCESS(f"OK → name={genre.name!r}"))
                else:
                    genres_to_save.append((genre, update_fields))
                    self.stdout.write(self.style.SUCCESS("OK"))

                ok += 1

            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"ERROR: {exc}"))
                failed += 1

        if not dry_run and genres_to_save:
            with transaction.atomic():
                for genre, update_fields in genres_to_save:
                    genre.save(update_fields=update_fields)

        self.stdout.write("")
        self.stdout.write(f"Done. {ok} translated, {failed} failed.")

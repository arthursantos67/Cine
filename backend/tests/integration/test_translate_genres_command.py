import unittest.mock
from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from catalog.models import Genre


@pytest.mark.django_db
class TestTranslateGenresCommand:
    @pytest.fixture
    def genre(self):
        return Genre.objects.create(name="Ação")

    @pytest.fixture
    def genre_with_translations(self):
        return Genre.objects.create(
            name="Drama",
            translations={"en-US": {"name": "Drama"}},
        )

    def _mock_translations(self, base: str = "Action") -> dict:
        return {
            "pt-BR": f"{base}_pt",
            "en-US": base,
            "es-ES": f"{base}_es",
            "fr-FR": f"{base}_fr",
            "de-DE": f"{base}_de",
            "it-IT": f"{base}_it",
            "zh-CN": f"{base}_zh",
            "ja-JP": f"{base}_ja",
        }

    def test_dry_run_does_not_save(self, genre):
        with unittest.mock.patch(
            "catalog.management.commands.translate_genres.translate_genre_name",
            return_value=self._mock_translations("Ação"),
        ):
            out = StringIO()
            call_command("translate_genres", dry_run=True, stdout=out)

        genre.refresh_from_db()
        assert genre.translations == {}

    def test_translates_and_saves_genre(self, genre):
        fake = self._mock_translations("Ação")
        with unittest.mock.patch(
            "catalog.management.commands.translate_genres.translate_genre_name",
            return_value=fake,
        ):
            call_command("translate_genres")

        genre.refresh_from_db()
        assert genre.translations["en-US"]["name"] == "Ação"
        assert "pt-BR" not in genre.translations

    def test_skips_genres_with_existing_translations(self, genre, genre_with_translations):
        with unittest.mock.patch(
            "catalog.management.commands.translate_genres.translate_genre_name",
            return_value=self._mock_translations(),
        ) as mock_translate:
            call_command("translate_genres")

        assert mock_translate.call_count == 1
        assert mock_translate.call_args[0][0] == "Ação"

    def test_force_retranslates_genres_with_existing_translations(
        self, genre, genre_with_translations
    ):
        with unittest.mock.patch(
            "catalog.management.commands.translate_genres.translate_genre_name",
            return_value=self._mock_translations(),
        ) as mock_translate:
            call_command("translate_genres", force=True)

        assert mock_translate.call_count == 2

    def test_invalid_locale_raises_command_error(self):
        with pytest.raises(CommandError, match="Unsupported locale"):
            call_command("translate_genres", source_language="xx-XX")

    def test_api_failure_counts_as_failed(self, genre):
        with unittest.mock.patch(
            "catalog.management.commands.translate_genres.translate_genre_name",
            return_value={},
        ):
            out = StringIO()
            call_command("translate_genres", stdout=out)

        output = out.getvalue()
        assert "0 translated, 1 failed" in output

    def test_non_pt_br_source_language_updates_primary_name(self):
        genre = Genre.objects.create(name="Action")
        fake = self._mock_translations("Action")
        with unittest.mock.patch(
            "catalog.management.commands.translate_genres.translate_genre_name",
            return_value=fake,
        ):
            call_command("translate_genres", source_language="en-US")

        genre.refresh_from_db()
        assert genre.name == "Action_pt"

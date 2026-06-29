import type { CatalogGenre, CatalogMovie, CatalogTranslationLocale } from "@/types/catalog";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";

export function formatMovieDuration(
  durationMinutes: number,
  locale: Locale | string = DEFAULT_LOCALE
) {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return t(locale, "movie.durationUnavailable");
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function formatMovieGenres(
  genres: CatalogMovie["genres"],
  locale: Locale | string = DEFAULT_LOCALE
) {
  if (genres.length === 0) {
    return t(locale, "movie.genreUnavailable");
  }

  const resolvedLocale = resolveLocale(locale) as CatalogTranslationLocale;
  return genres
    .map(
      (genre: CatalogGenre) =>
        genre.translations?.[resolvedLocale]?.name ?? genre.name
    )
    .join(", ");
}

export function formatMovieReleaseDate(
  releaseDate?: string | null,
  locale: Locale | string = DEFAULT_LOCALE
) {
  if (!releaseDate) {
    return t(locale, "movie.releaseUnavailable");
  }

  const parsedDate = new Date(`${releaseDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return t(locale, "movie.releaseUnavailable");
  }

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    timeZone: "UTC",
  }).format(parsedDate);
}

export function getMovieDetailsHref(movieId: CatalogMovie["id"]) {
  return `/movies/${movieId}`;
}

function t(locale: Locale | string, key: string) {
  const resolvedLocale = resolveLocale(locale);
  return messages[resolvedLocale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}

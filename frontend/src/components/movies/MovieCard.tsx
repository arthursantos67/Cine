import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import type { CatalogMovie } from "@/types/catalog";

import {
  formatMovieDuration,
  formatMovieGenres,
  getMovieDetailsHref,
} from "./movie-formatters";

type MovieCardProps = {
  movie: CatalogMovie;
};

type StatusBadge = { label: string; tone: BadgeTone };

function getStatusBadge(movie: CatalogMovie): StatusBadge | null {
  if (movie.status === "pre_venda") {
    return { label: "Pré-venda", tone: "accent" };
  }
  if (movie.is_featured) {
    return { label: "Destaque", tone: "brand" };
  }
  return null;
}

export function MovieCard({ movie }: MovieCardProps) {
  const genres = formatMovieGenres(movie.genres);
  const duration = formatMovieDuration(movie.duration_minutes);
  const badge = getStatusBadge(movie);

  return (
    <article className="movie-card">
      <Link
        aria-label={`Ver detalhes de ${movie.title}`}
        className="movie-card__link"
        href={getMovieDetailsHref(movie.id)}
      >
        <div className="relative">
          <ResponsiveImage
            alt={`Poster de ${movie.title}`}
            className="movie-card__poster"
            height={480}
            loading="lazy"
            src={movie.poster_url}
            sizes="(max-width: 820px) 100vw, (max-width: 1200px) 33vw, 220px"
            unoptimized
            width={320}
          />
          {badge ? (
            <div className="absolute bottom-2 left-2">
              <Badge size="sm" tone={badge.tone}>
                {badge.label}
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="movie-card__body">
          <h2 className="movie-card__title">{movie.title}</h2>
          <p className="movie-card__genres">{genres}</p>
          <p className="movie-card__duration">{duration}</p>
        </div>
      </Link>
    </article>
  );
}

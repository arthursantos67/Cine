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
    <article className="h-full overflow-hidden rounded-card bg-[#1e2535] border border-white/[0.08] shadow-[0_4px_20px_rgb(0_0_0/0.3)]">
      <Link
        aria-label={`Ver detalhes de ${movie.title}`}
        className="group grid h-full focus-visible:outline-offset-[-4px]"
        data-carousel-item-link
        href={getMovieDetailsHref(movie.id)}
      >
        <div className="relative">
          <ResponsiveImage
            alt={`Poster de ${movie.title}`}
            className="aspect-[2/3] w-full object-cover bg-surface-muted block"
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
        <div className="content-start grid gap-2 p-[14px]">
          <h2 className="m-0 text-[17px] leading-[1.25] text-text transition-colors duration-150 group-hover:text-brand">
            {movie.title}
          </h2>
          <p className="m-0 text-sm leading-[1.45] text-muted">{genres}</p>
          <p className="m-0 text-sm font-extrabold leading-[1.45] text-text">{duration}</p>
        </div>
      </Link>
    </article>
  );
}

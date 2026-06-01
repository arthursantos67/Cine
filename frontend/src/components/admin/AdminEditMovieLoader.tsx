"use client";

import { useEffect, useState } from "react";

import { adminApi } from "@/api/admin";
import type { CatalogMovieDetail } from "@/types/catalog";
import { AdminMovieForm } from "./AdminMovieForm";
import { AdminToolbar } from "./AdminToolbar";
import { ButtonLink } from "@/components/ui/Button";

export function AdminEditMovieLoader({ movieId }: { movieId: string }) {
  const [movie, setMovie] = useState<CatalogMovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getMovie(movieId)
      .then(setMovie)
      .catch(() => setError("Filme não encontrado ou você não tem permissão para editá-lo."))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/movies" size="sm" variant="ghost">
              Voltar
            </ButtonLink>
          }
          title="Editar filme"
        />
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="h-10 animate-pulse rounded-[8px] bg-white/[0.05]" key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/movies" size="sm" variant="ghost">
              Voltar
            </ButtonLink>
          }
          title="Editar filme"
        />
        <p className="text-sm font-bold text-error" role="alert">
          {error ?? "Filme não encontrado."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/movies" size="sm" variant="ghost">
            Voltar
          </ButtonLink>
        }
        title={`Editar: ${movie.title}`}
      />
      <AdminMovieForm movie={movie} />
    </div>
  );
}

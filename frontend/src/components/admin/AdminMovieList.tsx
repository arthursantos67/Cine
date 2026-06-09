"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi } from "@/api/admin";
import type { CatalogMovieDetail, MovieStatus } from "@/types/catalog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";
import { useI18n } from "@/i18n";

const STATUS_TONES: Record<MovieStatus, "success" | "info" | "neutral"> = {
  em_cartaz: "success",
  pre_venda: "info",
  em_breve: "neutral",
};

export function AdminMovieList() {
  const { formatDate, t } = useI18n();
  const [movies, setMovies] = useState<CatalogMovieDetail[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MovieStatus | "">("");
  const [deleteTarget, setDeleteTarget] = useState<CatalogMovieDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setErrorMessage(null);

      try {
        const result = await adminApi.listMovies({
          page: pageNum,
          search: search || undefined,
          status: statusFilter || undefined,
        });

        setMovies((prev) => (replace ? result.results : [...prev, ...result.results]));
        setHasMore(result.next !== null);
        setPage(pageNum);
      } catch {
        setErrorMessage(t("admin.movie.loadError"));
      } finally {
        if (replace) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [search, statusFilter, t]
  );

  // Reset and fetch page 1 whenever filters change.
  useEffect(() => {
    setMovies([]);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    fetchPage(1, true);
  }, [fetchPage]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 120;
    if (nearBottom && hasMore && !loadingMore && !loading) {
      fetchPage(page + 1, false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteMovie(deleteTarget.id);
      setDeleteTarget(null);
      setMovies([]);
      fetchPage(1, true);
    } catch {
      setErrorMessage(t("admin.movie.deleteError"));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: AdminTableColumn<Record<string, unknown>>[] = [
    {
      className: "w-14",
      key: "poster",
      label: t("admin.movie.poster"),
      render: (row) => {
        const movie = row as unknown as CatalogMovieDetail;
        return movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={movie.title}
            className="h-12 w-8 rounded object-cover"
            src={movie.poster_url}
          />
        ) : (
          <div className="h-12 w-8 rounded bg-white/[0.06]" />
        );
      },
    },
    {
      key: "title",
      label: t("admin.movie.titleField"),
      render: (row) => {
        const movie = row as unknown as CatalogMovieDetail;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-white">{movie.title}</span>
            {movie.genres.length > 0 && (
              <span className="text-xs text-white/40">
                {movie.genres.map((g) => g.name).join(", ")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      className: "hidden sm:table-cell",
      key: "duration_minutes",
      label: t("admin.movie.duration"),
      render: (row) => {
        const movie = row as unknown as CatalogMovieDetail;
        return t("admin.movie.durationUnit", { count: movie.duration_minutes });
      },
    },
    {
      className: "hidden md:table-cell",
      key: "release_date",
      label: t("admin.movie.releaseShort"),
      render: (row) => {
        const movie = row as unknown as CatalogMovieDetail;
        return movie.release_date
          ? formatDate(`${movie.release_date}T00:00:00`)
          : "—";
      },
    },
    {
      key: "status",
      label: t("admin.movie.status"),
      render: (row) => {
        const movie = row as unknown as CatalogMovieDetail;
        return (
          <Badge size="sm" tone={STATUS_TONES[movie.status]}>
            {t(`domain.movieStatus.${movie.status}`)}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: t("admin.actions"),
      render: (row) => {
        const movie = row as unknown as CatalogMovieDetail;
        return (
          <div className="flex items-center gap-2">
            <ButtonLink
              href={`/admin/movies/${movie.id}/edit`}
              size="sm"
              variant="ghost"
            >
              {t("admin.edit")}
            </ButtonLink>
            <Button
              onClick={() => setDeleteTarget(movie)}
              size="sm"
              variant="danger"
            >
              {t("admin.delete")}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/movies/new" size="sm" variant="primary">
            {t("admin.movie.new")}
          </ButtonLink>
        }
        filters={
          <select
            aria-label={t("admin.movie.statusFilter")}
            className="rounded-control border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition focus:border-brand focus:bg-white/[0.07]"
            onChange={(e) => setStatusFilter(e.target.value as MovieStatus | "")}
            value={statusFilter}
          >
            <option value="">{t("admin.movie.statusAll")}</option>
            <option value="em_cartaz">{t("domain.movieStatus.em_cartaz")}</option>
            <option value="pre_venda">{t("domain.movieStatus.pre_venda")}</option>
            <option value="em_breve">{t("domain.movieStatus.em_breve")}</option>
          </select>
        }
        onSearch={setSearchInput}
        searchPlaceholder={t("admin.movie.search")}
        title={t("admin.movies")}
      />

      {errorMessage ? (
        <p className="text-sm font-bold text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {/* Scrollable table container — scroll happens here, not on the page */}
      <div
        className="max-h-[600px] overflow-y-auto rounded-[8px]"
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
        <AdminTable
          caption={t("admin.movie.listCaption")}
          columns={columns}
          data={movies as unknown as Record<string, unknown>[]}
          emptyDescription={t("admin.movie.noneDescription")}
          emptyTitle={t("admin.movie.noneTitle")}
          keyField="id"
          loading={loading}
        />

        {loadingMore ? (
          <p className="border-t border-white/[0.05] py-3 text-center text-xs text-white/40">
            {t("admin.movie.loadingMore")}
          </p>
        ) : null}
      </div>

      <AdminConfirmDialog
        confirmLabel={isDeleting ? t("admin.deleting") : t("admin.delete")}
        description={t("admin.movie.deleteDescription", { title: deleteTarget?.title ?? "" })}
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("admin.movie.delete")}
        tone="danger"
      />
    </div>
  );
}

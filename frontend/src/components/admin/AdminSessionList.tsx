"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminRoom, AdminSession, CatalogMovieDetail } from "@/types/catalog";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";
import { useI18n } from "@/i18n";

function isProtected(session: AdminSession): boolean {
  return Boolean(session.has_reservations || session.has_purchases);
}

export function AdminSessionList() {
  const { formatCurrency, formatDate, formatDateTime, t } = useI18n();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [dateFilter, setDateFilter] = useState("");
  const [movieFilter, setMovieFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  const [movies, setMovies] = useState<CatalogMovieDetail[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);

  const dateFilterId = useId();

  useEffect(() => {
    Promise.all([adminApi.listAllMovies(), adminApi.listAllRooms()]).then(
      ([allMovies, allRooms]) => {
        setMovies(allMovies);
        setRooms(allRooms);
      }
    );
  }, []);

  const fetchSessions = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (replace) setLoading(true);
      setErrorMessage(null);

      try {
        const result = await adminApi.listSessions({
          date: dateFilter || undefined,
          movie: movieFilter || undefined,
          page: pageNum,
          room: roomFilter || undefined,
        });

        if (replace) {
          setSessions(result.results);
        } else {
          setSessions((prev) => [...prev, ...result.results]);
        }

        setHasMore(result.next !== null);
        setPage(pageNum);
      } catch {
        setErrorMessage(t("admin.session.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dateFilter, movieFilter, roomFilter, t]
  );

  useEffect(() => {
    fetchSessions(1, true);
  }, [fetchSessions]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteSession(deleteTarget.id);
      setDeleteTarget(null);
      fetchSessions(1, true);
    } catch {
      setErrorMessage(t("admin.session.deleteError"));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: AdminTableColumn<Record<string, unknown>>[] = [
    {
      key: "movie",
      label: t("admin.session.movie"),
      render: (row) => {
        const s = row as unknown as AdminSession;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-white">{s.movie.title}</span>
            <span className="text-xs text-white/40">
              {formatDateTime(s.start_time)}
            </span>
          </div>
        );
      },
    },
    {
      className: "hidden sm:table-cell",
      key: "room",
      label: t("admin.session.room"),
      render: (row) => {
        const s = row as unknown as AdminSession;
        return (
          <span className="text-white/80">
            {s.room.display_name ?? s.room.name}
          </span>
        );
      },
    },
    {
      className: "hidden md:table-cell",
      key: "base_price",
      label: t("admin.session.basePrice"),
      render: (row) => {
        const s = row as unknown as AdminSession;
        return (
          <span className="text-white/80">
            {formatCurrency(Number(s.base_price))}
          </span>
        );
      },
    },
    {
      className: "hidden lg:table-cell",
      key: "formats",
      label: t("admin.session.format"),
      render: (row) => {
        const s = row as unknown as AdminSession;
        const tags: string[] = [];
        if (s.audio_format) tags.push(t(`domain.audio.${s.audio_format}`));
        if (s.projection_format)
          tags.push(t(`domain.projection.${s.projection_format}`));
        if (s.session_type)
          tags.push(t(`domain.sessionType.${s.session_type}`));

        if (tags.length === 0) return <span className="text-white/30">—</span>;

        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} size="sm" tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: t("admin.actions"),
      render: (row) => {
        const s = row as unknown as AdminSession;
        const protected_ = isProtected(s);

        return (
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink
              href={`/admin/sessions/${s.id}/edit`}
              size="sm"
              variant="ghost"
            >
              {t("admin.edit")}
            </ButtonLink>
            <Button
              disabled={protected_}
              onClick={() => !protected_ && setDeleteTarget(s)}
              size="sm"
              title={
                protected_
                  ? t("admin.session.protectedDelete")
                  : undefined
              }
              variant="danger"
            >
              {t("admin.delete")}
            </Button>
          </div>
        );
      },
    },
  ];

  const movieOptions = movies.map((m) => ({ label: m.title, value: m.id }));
  const roomOptions = rooms.map((r) => ({
    label: r.display_name ? `${r.name} — ${r.display_name}` : r.name,
    value: r.id,
  }));

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/sessions/new" size="sm" variant="primary">
            {t("admin.session.new")}
          </ButtonLink>
        }
        title={t("admin.sessions")}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1.5">
          <label
            className="text-sm font-extrabold text-white"
            htmlFor={dateFilterId}
          >
            {t("admin.session.date")}
          </label>
          <input
            className="min-h-[var(--control-height-lg)] rounded-control border border-border bg-surface px-3 py-2 text-sm text-white outline-none transition focus:border-brand focus:shadow-focus"
            id={dateFilterId}
            onChange={(e) => setDateFilter(e.target.value)}
            type="date"
            value={dateFilter}
          />
        </div>

        <div className="min-w-[200px]">
          <SelectMenu
            label={t("admin.session.movie")}
            onChange={setMovieFilter}
            options={movieOptions}
            placeholder={t("admin.session.allMovies")}
            value={movieFilter}
          />
        </div>

        <div className="min-w-[200px]">
          <SelectMenu
            label={t("admin.session.room")}
            onChange={setRoomFilter}
            options={roomOptions}
            placeholder={t("admin.session.allRooms")}
            value={roomFilter}
          />
        </div>

        {(dateFilter || movieFilter || roomFilter) && (
          <Button
            onClick={() => {
              setDateFilter("");
              setMovieFilter("");
              setRoomFilter("");
            }}
            size="sm"
            variant="ghost"
          >
            {t("admin.session.clearFilters")}
          </Button>
        )}
      </div>

      {errorMessage ? (
        <p className="text-sm font-bold text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <AdminTable
        caption={t("admin.session.listCaption")}
        columns={columns}
        data={sessions as unknown as Record<string, unknown>[]}
        emptyDescription={t("admin.session.noneDescription")}
        emptyTitle={t("admin.session.noneTitle")}
        keyField="id"
        loading={loading}
      />

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchSessions(page + 1, false)}
            variant="ghost"
          >
            {t("admin.session.loadMore")}
          </Button>
        </div>
      ) : null}

      <AdminConfirmDialog
        confirmLabel={isDeleting ? t("admin.deleting") : t("admin.delete")}
        description={
          deleteTarget
            ? t("admin.session.deleteDescription", {
                date: formatDate(deleteTarget.start_time),
                title: deleteTarget.movie.title,
              })
            : ""
        }
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("admin.session.delete")}
        tone="danger"
      />
    </div>
  );
}

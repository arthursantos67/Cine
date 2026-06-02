"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminRoom, AdminSession, CatalogMovieDetail } from "@/types/catalog";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";

const AUDIO_LABELS: Record<string, string> = {
  dublado: "Dublado",
  legendado: "Legendado",
  original: "Original",
};

const PROJECTION_LABELS: Record<string, string> = {
  "2d": "2D",
  "3d": "3D",
  imax: "IMAX",
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  preview: "Pré-estreia",
  regular: "Regular",
  special_event: "Evento especial",
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR");
}

function isProtected(session: AdminSession): boolean {
  return Boolean(session.has_reservations || session.has_purchases);
}

export function AdminSessionList() {
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
  const movieFilterId = useId();
  const roomFilterId = useId();

  useEffect(() => {
    Promise.all([adminApi.listMovies(), adminApi.listRooms()]).then(
      ([moviesRes, roomsRes]) => {
        setMovies(moviesRes.results);
        setRooms(roomsRes.results);
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
        setErrorMessage("Não foi possível carregar as sessões. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [dateFilter, movieFilter, roomFilter]
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
      setErrorMessage("Não foi possível excluir a sessão. Tente novamente.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: AdminTableColumn<Record<string, unknown>>[] = [
    {
      key: "movie",
      label: "Filme",
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
      label: "Sala",
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
      label: "Preço base",
      render: (row) => {
        const s = row as unknown as AdminSession;
        return (
          <span className="text-white/80">
            {Number(s.base_price).toLocaleString("pt-BR", {
              currency: "BRL",
              style: "currency",
            })}
          </span>
        );
      },
    },
    {
      className: "hidden lg:table-cell",
      key: "formats",
      label: "Formato",
      render: (row) => {
        const s = row as unknown as AdminSession;
        const tags: string[] = [];
        if (s.audio_format) tags.push(AUDIO_LABELS[s.audio_format] ?? s.audio_format);
        if (s.projection_format)
          tags.push(PROJECTION_LABELS[s.projection_format] ?? s.projection_format);
        if (s.session_type)
          tags.push(SESSION_TYPE_LABELS[s.session_type] ?? s.session_type);

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
      label: "Ações",
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
              Editar
            </ButtonLink>
            <Button
              disabled={protected_}
              onClick={() => !protected_ && setDeleteTarget(s)}
              size="sm"
              title={
                protected_
                  ? "Esta sessão possui assentos reservados ou comprados"
                  : undefined
              }
              variant="danger"
            >
              Excluir
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
            Nova sessão
          </ButtonLink>
        }
        title="Sessões"
      />

      <div className="flex flex-wrap items-end gap-4 rounded-[8px] border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="grid gap-1.5">
          <label
            className="text-xs font-extrabold uppercase tracking-wider text-white/40"
            htmlFor={dateFilterId}
          >
            Data
          </label>
          <input
            className="min-h-9 rounded-control border border-border bg-surface px-3 py-2 text-sm text-white outline-none transition focus:border-brand focus:shadow-focus"
            id={dateFilterId}
            onChange={(e) => setDateFilter(e.target.value)}
            type="date"
            value={dateFilter}
          />
        </div>

        <div className="grid gap-1.5">
          <label
            className="text-xs font-extrabold uppercase tracking-wider text-white/40"
            htmlFor={movieFilterId}
          >
            Filme
          </label>
          <select
            className="min-h-9 rounded-control border border-border bg-surface px-3 py-2 text-sm text-white outline-none transition focus:border-brand focus:shadow-focus"
            id={movieFilterId}
            onChange={(e) => setMovieFilter(e.target.value)}
            value={movieFilter}
          >
            <option value="">Todos os filmes</option>
            {movieOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label
            className="text-xs font-extrabold uppercase tracking-wider text-white/40"
            htmlFor={roomFilterId}
          >
            Sala
          </label>
          <select
            className="min-h-9 rounded-control border border-border bg-surface px-3 py-2 text-sm text-white outline-none transition focus:border-brand focus:shadow-focus"
            id={roomFilterId}
            onChange={(e) => setRoomFilter(e.target.value)}
            value={roomFilter}
          >
            <option value="">Todas as salas</option>
            {roomOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
            Limpar filtros
          </Button>
        )}
      </div>

      {errorMessage ? (
        <p className="text-sm font-bold text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <AdminTable
        caption="Lista de sessões"
        columns={columns}
        data={sessions as unknown as Record<string, unknown>[]}
        emptyDescription="Nenhuma sessão encontrada. Ajuste os filtros ou crie uma nova sessão."
        emptyTitle="Nenhuma sessão encontrada"
        keyField="id"
        loading={loading}
      />

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchSessions(page + 1, false)}
            variant="ghost"
          >
            Carregar mais
          </Button>
        </div>
      ) : null}

      <AdminConfirmDialog
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir"}
        description={
          deleteTarget
            ? `Tem certeza que deseja excluir a sessão de "${deleteTarget.movie.title}" em ${formatDate(deleteTarget.start_time)}? Esta ação não pode ser desfeita.`
            : ""
        }
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir sessão"
        tone="danger"
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi, type AdminGenre } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export function AdminGenreList() {
  const [genres, setGenres] = useState<AdminGenre[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminGenre | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showCreateInput, setShowCreateInput] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setErrorMessage(null);

    try {
      const result = await adminApi.listGenres({ page: pageNum });
      setGenres((prev) => (replace ? result.results : [...prev, ...result.results]));
      setHasMore(result.next !== null);
      setPage(pageNum);
    } catch {
      setErrorMessage("Não foi possível carregar os gêneros. Tente novamente.");
    } finally {
      if (replace) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120 && hasMore && !loadingMore && !loading) {
      fetchPage(page + 1, false);
    }
  }

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
    }
  }, [editingId]);

  useEffect(() => {
    if (showCreateInput) {
      createInputRef.current?.focus();
    }
  }, [showCreateInput]);

  function startEdit(genre: AdminGenre) {
    setEditingId(genre.id);
    setEditName(genre.name);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditError(null);
  }

  async function handleSaveEdit(genreId: string) {
    const name = editName.trim();
    if (!name) return;

    setIsSaving(true);
    setEditError(null);
    try {
      const updated = await adminApi.updateGenre(genreId, { name });
      setGenres((prev) => prev.map((g) => (g.id === genreId ? { ...g, ...updated } : g)));
      cancelEdit();
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        const details = err.details as Record<string, unknown> | null;
        const nameErr = details?.name;
        setEditError(Array.isArray(nameErr) ? nameErr[0] : String(nameErr ?? "Nome inválido."));
      } else {
        setEditError("Não foi possível salvar. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteGenre(deleteTarget.id);
      setDeleteTarget(null);
      setGenres([]);
      fetchPage(1, true);
    } catch {
      setErrorMessage("Não foi possível excluir o gênero. Tente novamente.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreate() {
    const name = createName.trim();
    if (!name) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await adminApi.createGenre({ name });
      setCreateName("");
      setShowCreateInput(false);
      setGenres([]);
      fetchPage(1, true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        const details = err.details as Record<string, unknown> | null;
        const nameErr = details?.name;
        setCreateError(Array.isArray(nameErr) ? nameErr[0] : String(nameErr ?? "Nome inválido."));
      } else {
        setCreateError("Não foi possível criar o gênero. Tente novamente.");
      }
    } finally {
      setIsCreating(false);
    }
  }

  const columns: AdminTableColumn<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Nome",
      render: (row) => {
        const genre = row as unknown as AdminGenre;
        if (editingId === genre.id) {
          return (
            <div className="flex flex-col gap-1">
              <input
                className={[
                  "min-h-[var(--control-height)] rounded-control border bg-surface px-3 py-1.5",
                  "text-sm text-white outline-none transition focus:border-brand focus:shadow-focus",
                  editError ? "border-error" : "border-border",
                ].join(" ")}
                disabled={isSaving}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit(genre.id);
                  if (e.key === "Escape") cancelEdit();
                }}
                ref={editInputRef}
                value={editName}
              />
              {editError ? (
                <p className="text-xs font-bold text-error" role="alert">
                  {editError}
                </p>
              ) : null}
            </div>
          );
        }
        return <span className="font-medium text-white">{genre.name}</span>;
      },
    },
    {
      key: "actions",
      label: "Ações",
      render: (row) => {
        const genre = row as unknown as AdminGenre;
        if (editingId === genre.id) {
          return (
            <div className="flex items-center gap-2">
              <Button
                disabled={isSaving || !editName.trim()}
                isLoading={isSaving}
                onClick={() => handleSaveEdit(genre.id)}
                size="sm"
                type="button"
                variant="primary"
              >
                Salvar
              </Button>
              <Button
                disabled={isSaving}
                onClick={cancelEdit}
                size="sm"
                type="button"
                variant="ghost"
              >
                Cancelar
              </Button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => startEdit(genre)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Editar
            </Button>
            <Button
              onClick={() => setDeleteTarget(genre)}
              size="sm"
              type="button"
              variant="danger"
            >
              Excluir
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
          <Button
            onClick={() => {
              setShowCreateInput(true);
              setCreateName("");
              setCreateError(null);
            }}
            size="sm"
            type="button"
            variant="primary"
          >
            Novo gênero
          </Button>
        }
        title="Gêneros"
      />

      {errorMessage ? (
        <p className="text-sm font-bold text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {showCreateInput ? (
        <div className="flex flex-col gap-2 rounded-[8px] border border-brand/30 bg-brand/5 p-4">
          <span className="text-sm font-extrabold text-white">Novo gênero</span>
          <div className="flex gap-2">
            <input
              className={[
                "flex-1 min-h-[var(--control-height-lg)] rounded-control border bg-surface px-3 py-2",
                "text-sm text-white placeholder:text-white/30 outline-none transition",
                "focus:border-brand focus:shadow-focus",
                createError ? "border-error" : "border-border",
              ].join(" ")}
              disabled={isCreating}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowCreateInput(false);
                  setCreateName("");
                  setCreateError(null);
                }
              }}
              placeholder="Nome do gênero"
              ref={createInputRef}
              value={createName}
            />
            <Button
              disabled={isCreating || !createName.trim()}
              isLoading={isCreating}
              onClick={handleCreate}
              size="sm"
              type="button"
              variant="primary"
            >
              Criar
            </Button>
            <Button
              disabled={isCreating}
              onClick={() => {
                setShowCreateInput(false);
                setCreateName("");
                setCreateError(null);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Cancelar
            </Button>
          </div>
          {createError ? (
            <p className="text-sm font-bold text-error" role="alert">
              {createError}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Scrollable table container — scroll happens here, not on the page */}
      <div
        className="max-h-[600px] overflow-y-auto rounded-[8px]"
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
        <AdminTable
          caption="Lista de gêneros"
          columns={columns}
          data={genres as unknown as Record<string, unknown>[]}
          emptyDescription="Nenhum gênero cadastrado. Clique em 'Novo gênero' para adicionar."
          emptyTitle="Nenhum gênero cadastrado"
          keyField="id"
          loading={loading}
        />

        {loadingMore ? (
          <p className="border-t border-white/[0.05] py-3 text-center text-xs text-white/40">
            Carregando mais gêneros…
          </p>
        ) : null}
      </div>

      <AdminConfirmDialog
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir"}
        description={`Tem certeza que deseja excluir o gênero "${deleteTarget?.name}"?`}
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir gênero"
        tone="danger"
      />
    </div>
  );
}

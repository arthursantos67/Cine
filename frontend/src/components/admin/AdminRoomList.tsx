"use client";

import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminRoom } from "@/types/catalog";
import type { CatalogRoomExperienceType } from "@/types/catalog";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";

const EXPERIENCE_LABELS: Record<CatalogRoomExperienceType, string> = {
  "": "—",
  imax: "IMAX",
  premium: "Premium",
  standard: "Standard",
  vip: "VIP",
};

const EXPERIENCE_TONES: Record<
  CatalogRoomExperienceType,
  "neutral" | "info" | "success" | "accent"
> = {
  "": "neutral",
  imax: "info",
  premium: "success",
  standard: "neutral",
  vip: "accent",
};

export function AdminRoomList() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await adminApi.listRooms();
      setRooms(result.results);
    } catch {
      setErrorMessage("Não foi possível carregar as salas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteRoom(deleteTarget.id);
      setDeleteTarget(null);
      fetchRooms();
    } catch {
      setErrorMessage("Não foi possível excluir a sala. Tente novamente.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: AdminTableColumn<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Nome",
      render: (row) => {
        const room = row as unknown as AdminRoom;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-white">{room.name}</span>
            {room.display_name ? (
              <span className="text-xs text-white/40">{room.display_name}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      className: "hidden sm:table-cell",
      key: "capacity",
      label: "Capacidade",
      render: (row) => {
        const room = row as unknown as AdminRoom;
        return `${room.capacity} lugares`;
      },
    },
    {
      className: "hidden md:table-cell",
      key: "experience_type",
      label: "Experiência",
      render: (row) => {
        const room = row as unknown as AdminRoom;
        const expType = (room.experience_type ?? "") as CatalogRoomExperienceType;
        if (!expType) return <span className="text-white/40">—</span>;
        return (
          <Badge size="sm" tone={EXPERIENCE_TONES[expType]}>
            {EXPERIENCE_LABELS[expType]}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Ações",
      render: (row) => {
        const room = row as unknown as AdminRoom;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink
              href={`/admin/rooms/${room.id}/layout`}
              size="sm"
              variant="secondary"
            >
              Layout
            </ButtonLink>
            <ButtonLink
              href={`/admin/rooms/${room.id}/edit`}
              size="sm"
              variant="ghost"
            >
              Editar
            </ButtonLink>
            <Button
              onClick={() => setDeleteTarget(room)}
              size="sm"
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
          <ButtonLink href="/admin/rooms/new" size="sm" variant="primary">
            Nova sala
          </ButtonLink>
        }
        title="Salas"
      />

      {errorMessage ? (
        <p className="text-sm font-bold text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <AdminTable
        caption="Lista de salas"
        columns={columns}
        data={rooms as unknown as Record<string, unknown>[]}
        emptyDescription="Nenhuma sala cadastrada. Clique em 'Nova sala' para criar uma."
        emptyTitle="Nenhuma sala cadastrada"
        keyField="id"
        loading={loading}
      />

      <AdminConfirmDialog
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir"}
        description={`Tem certeza que deseja excluir a sala "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir sala"
        tone="danger"
      />
    </div>
  );
}

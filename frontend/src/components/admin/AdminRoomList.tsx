"use client";

import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminRoom } from "@/types/catalog";
import type { CatalogRoomExperienceType } from "@/types/catalog";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
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
      setErrorMessage(t("admin.room.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setErrorMessage(t("admin.room.deleteError"));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: AdminTableColumn<Record<string, unknown>>[] = [
    {
      key: "name",
      label: t("admin.room.name"),
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
      label: t("admin.room.capacity"),
      render: (row) => {
        const room = row as unknown as AdminRoom;
        return t("admin.room.capacityPlaces", { count: room.capacity });
      },
    },
    {
      className: "hidden md:table-cell",
      key: "experience_type",
      label: t("admin.room.experience"),
      render: (row) => {
        const room = row as unknown as AdminRoom;
        const expType = (room.experience_type ?? "") as CatalogRoomExperienceType;
        if (!expType) return <span className="text-white/40">—</span>;
        return (
          <Badge size="sm" tone={EXPERIENCE_TONES[expType]}>
            {t(`domain.roomExperience.${expType}`)}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: t("admin.actions"),
      render: (row) => {
        const room = row as unknown as AdminRoom;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink
              href={`/admin/rooms/${room.id}/layout`}
              size="sm"
              variant="secondary"
            >
              {t("admin.layout")}
            </ButtonLink>
            <ButtonLink
              href={`/admin/rooms/${room.id}/edit`}
              size="sm"
              variant="ghost"
            >
              {t("admin.edit")}
            </ButtonLink>
            <Button
              onClick={() => setDeleteTarget(room)}
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
          <ButtonLink href="/admin/rooms/new" size="sm" variant="primary">
            {t("admin.room.new")}
          </ButtonLink>
        }
        title={t("admin.rooms")}
      />

      {errorMessage ? (
        <p className="text-sm font-bold text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <AdminTable
        caption={t("admin.room.listCaption")}
        columns={columns}
        data={rooms as unknown as Record<string, unknown>[]}
        emptyDescription={t("admin.room.noneDescription")}
        emptyTitle={t("admin.room.noneTitle")}
        keyField="id"
        loading={loading}
      />

      <AdminConfirmDialog
        confirmLabel={isDeleting ? t("admin.deleting") : t("admin.delete")}
        description={t("admin.room.deleteDescription", { name: deleteTarget?.name ?? "" })}
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("admin.room.delete")}
        tone="danger"
      />
    </div>
  );
}

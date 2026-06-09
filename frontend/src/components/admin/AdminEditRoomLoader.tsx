"use client";

import { useEffect, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminRoom } from "@/types/catalog";
import { AdminRoomForm } from "./AdminRoomForm";
import { AdminToolbar } from "./AdminToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { useI18n } from "@/i18n";

export function AdminEditRoomLoader({ roomId }: { roomId: string }) {
  const { t } = useI18n();
  const [room, setRoom] = useState<AdminRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getRoom(roomId)
      .then(setRoom)
      .catch(() => setError(t("admin.room.notFoundOrDenied")))
      .finally(() => setLoading(false));
  }, [roomId, t]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/rooms" size="sm" variant="ghost">
              {t("admin.back")}
            </ButtonLink>
          }
          title={t("admin.room.edit")}
        />
        <div className="grid max-w-2xl gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              className="h-10 animate-pulse rounded-[8px] bg-white/[0.05]"
              key={i}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/rooms" size="sm" variant="ghost">
              {t("admin.back")}
            </ButtonLink>
          }
          title={t("admin.room.edit")}
        />
        <p className="text-sm font-bold text-error" role="alert">
          {error ?? t("admin.room.notFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink
              href={`/admin/rooms/${room.id}/layout`}
              size="sm"
              variant="secondary"
            >
              {t("admin.layout")}
            </ButtonLink>
            <ButtonLink href="/admin/rooms" size="sm" variant="ghost">
              {t("admin.back")}
            </ButtonLink>
          </div>
        }
        title={t("admin.editPrefix", { name: room.name })}
      />
      <AdminRoomForm room={room} />
    </div>
  );
}

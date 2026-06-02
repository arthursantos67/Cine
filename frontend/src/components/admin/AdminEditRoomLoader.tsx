"use client";

import { useEffect, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminRoom } from "@/types/catalog";
import { AdminRoomForm } from "./AdminRoomForm";
import { AdminToolbar } from "./AdminToolbar";
import { ButtonLink } from "@/components/ui/Button";

export function AdminEditRoomLoader({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<AdminRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getRoom(roomId)
      .then(setRoom)
      .catch(() =>
        setError("Sala não encontrada ou você não tem permissão para editá-la.")
      )
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/rooms" size="sm" variant="ghost">
              Voltar
            </ButtonLink>
          }
          title="Editar sala"
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
              Voltar
            </ButtonLink>
          }
          title="Editar sala"
        />
        <p className="text-sm font-bold text-error" role="alert">
          {error ?? "Sala não encontrada."}
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
              Layout
            </ButtonLink>
            <ButtonLink href="/admin/rooms" size="sm" variant="ghost">
              Voltar
            </ButtonLink>
          </div>
        }
        title={`Editar: ${room.name}`}
      />
      <AdminRoomForm room={room} />
    </div>
  );
}

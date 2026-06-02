"use client";

import { useEffect, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminSession } from "@/types/catalog";
import { ButtonLink } from "@/components/ui/Button";
import { AdminSessionForm } from "./AdminSessionForm";
import { AdminToolbar } from "./AdminToolbar";

export function AdminEditSessionLoader({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getSession(sessionId)
      .then(setSession)
      .catch(() =>
        setError(
          "Sessão não encontrada ou você não tem permissão para editá-la."
        )
      )
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/sessions" size="sm" variant="ghost">
              Voltar
            </ButtonLink>
          }
          title="Editar sessão"
        />
        <div className="grid max-w-2xl gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              className="h-10 animate-pulse rounded-[8px] bg-white/[0.05]"
              key={i}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/sessions" size="sm" variant="ghost">
              Voltar
            </ButtonLink>
          }
          title="Editar sessão"
        />
        <p className="text-sm font-bold text-error" role="alert">
          {error ?? "Sessão não encontrada."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/sessions" size="sm" variant="ghost">
            Voltar
          </ButtonLink>
        }
        title={`Editar: ${session.movie.title} — ${formatDate(session.start_time)}`}
      />
      <AdminSessionForm session={session} />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

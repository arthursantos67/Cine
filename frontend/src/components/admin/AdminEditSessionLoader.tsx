"use client";

import { useEffect, useState } from "react";

import { adminApi } from "@/api/admin";
import type { AdminSession } from "@/types/catalog";
import { ButtonLink } from "@/components/ui/Button";
import { AdminSessionForm } from "./AdminSessionForm";
import { AdminToolbar } from "./AdminToolbar";
import { useI18n } from "@/i18n";

export function AdminEditSessionLoader({ sessionId }: { sessionId: string }) {
  const { formatDateTime, t } = useI18n();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getSession(sessionId)
      .then(setSession)
      .catch(() => setError(t("admin.session.notFoundOrDenied")))
      .finally(() => setLoading(false));
  }, [sessionId, t]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <AdminToolbar
          actions={
            <ButtonLink href="/admin/sessions" size="sm" variant="ghost">
              {t("admin.back")}
            </ButtonLink>
          }
          title={t("admin.session.edit")}
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
              {t("admin.back")}
            </ButtonLink>
          }
          title={t("admin.session.edit")}
        />
        <p className="text-sm font-bold text-error" role="alert">
          {error ?? t("admin.session.notFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/sessions" size="sm" variant="ghost">
            {t("admin.back")}
          </ButtonLink>
        }
        title={t("admin.editPrefix", {
          name: `${session.movie.title} - ${formatDateTime(session.start_time)}`,
        })}
      />
      <AdminSessionForm session={session} />
    </div>
  );
}

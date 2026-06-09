"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CalendarDays, Film, TrendingUp } from "lucide-react";

import { adminApi, type AdminSummary } from "@/api/admin";
import { useI18n } from "@/i18n";

type StatCardProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  value: number | null;
};

function StatCard({ href, icon, label, loading, value }: StatCardProps) {
  return (
    <Link
      className="group flex flex-col gap-3 rounded-[10px] border border-white/[0.07] bg-surface-muted p-5 transition hover:border-white/[0.14] hover:bg-white/[0.06]"
      href={href}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-[750] uppercase tracking-wider text-white/40">
          {label}
        </span>
        <span aria-hidden="true" className="text-white/30 group-hover:text-white/50">
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-16 animate-pulse rounded bg-white/[0.06]" />
      ) : (
        <span className="text-3xl font-[850] tabular-nums text-white">
          {value ?? "—"}
        </span>
      )}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi
      .getSummary()
      .then(setSummary)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-[850] text-white">
          {t("admin.dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {t("admin.dashboard.overview")}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {t("admin.dashboard.countsError")}
        </p>
      ) : null}

      <section aria-label={t("admin.dashboard.summary")}>
        <h2 className="mb-4 text-xs font-[750] uppercase tracking-wider text-white/40">
          {t("admin.dashboard.summary")}
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            href="/admin/movies"
            icon={<Film size={18} />}
            label={t("admin.movies")}
            loading={loading}
            value={summary?.movieCount ?? null}
          />
          <StatCard
            href="/admin/movies"
            icon={<TrendingUp size={18} />}
            label={t("domain.movieStatus.em_cartaz")}
            loading={loading}
            value={summary?.nowShowingCount ?? null}
          />
          <StatCard
            href="/admin/sessions"
            icon={<CalendarDays size={18} />}
            label={t("admin.sessionsToday")}
            loading={loading}
            value={summary?.sessionsTodayCount ?? null}
          />
          <StatCard
            href="/admin/rooms"
            icon={<Building2 size={18} />}
            label={t("admin.rooms")}
            loading={loading}
            value={summary?.roomCount ?? null}
          />
        </div>
      </section>

      <section aria-label={t("admin.dashboard.shortcuts")}>
        <h2 className="mb-4 text-xs font-[750] uppercase tracking-wider text-white/40">
          {t("admin.dashboard.management")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/movies", label: t("admin.movies") },
            { href: "/admin/genres", label: t("admin.genres") },
            { href: "/admin/rooms", label: t("admin.rooms") },
            { href: "/admin/seat-rows", label: t("admin.seats") },
            { href: "/admin/sessions", label: t("admin.sessions") },
            { href: "/admin/users", label: t("admin.users") },
          ].map((item) => (
            <Link
              className="rounded-[8px] border border-white/[0.07] px-4 py-3 text-sm font-bold text-white/60 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

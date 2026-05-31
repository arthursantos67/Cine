"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CalendarDays, Film, TrendingUp } from "lucide-react";

import { adminApi, type AdminSummary } from "@/api/admin";

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
        <h1 className="text-2xl font-[850] text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">
          Visão geral do sistema CinePrime.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-error" role="alert">
          Não foi possível carregar os contadores. Recarregue a página para tentar novamente.
        </p>
      ) : null}

      <section aria-label="Resumo do sistema">
        <h2 className="mb-4 text-xs font-[750] uppercase tracking-wider text-white/40">
          Resumo
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            href="/admin/movies"
            icon={<Film size={18} />}
            label="Filmes"
            loading={loading}
            value={summary?.movieCount ?? null}
          />
          <StatCard
            href="/admin/movies"
            icon={<TrendingUp size={18} />}
            label="Em cartaz"
            loading={loading}
            value={summary?.nowShowingCount ?? null}
          />
          <StatCard
            href="/admin/sessions"
            icon={<CalendarDays size={18} />}
            label="Sessões hoje"
            loading={loading}
            value={summary?.sessionsTodayCount ?? null}
          />
          <StatCard
            href="/admin/rooms"
            icon={<Building2 size={18} />}
            label="Salas"
            loading={loading}
            value={summary?.roomCount ?? null}
          />
        </div>
      </section>

      <section aria-label="Atalhos de gerenciamento">
        <h2 className="mb-4 text-xs font-[750] uppercase tracking-wider text-white/40">
          Gerenciamento
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/movies", label: "Filmes" },
            { href: "/admin/genres", label: "Gêneros" },
            { href: "/admin/rooms", label: "Salas" },
            { href: "/admin/seat-rows", label: "Fileiras e Assentos" },
            { href: "/admin/sessions", label: "Sessões" },
            { href: "/admin/users", label: "Administradores" },
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

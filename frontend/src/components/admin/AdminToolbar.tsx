"use client";

import React, { type ReactNode } from "react";

import { useI18n } from "@/i18n";

type AdminToolbarProps = {
  actions?: ReactNode;
  filters?: ReactNode;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  title: string;
};

export function AdminToolbar({
  actions,
  filters,
  onSearch,
  searchPlaceholder,
  title,
}: AdminToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-[850] text-white">{title}</h1>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {(onSearch ?? filters) ? (
        <div className="flex flex-wrap items-center gap-2">
          {onSearch ? (
            <input
              aria-label={t("admin.searchIn", { title })}
              className={[
                "min-w-[200px] flex-1 rounded-control border border-white/[0.12]",
                "bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/30",
                "outline-none transition focus:border-brand focus:bg-white/[0.07]",
              ].join(" ")}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder ?? t("admin.searchPlaceholder")}
              type="search"
            />
          ) : null}
          {filters}
        </div>
      ) : null}
    </div>
  );
}

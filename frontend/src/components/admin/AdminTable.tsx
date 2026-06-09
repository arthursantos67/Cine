"use client";

import React, { type ReactNode } from "react";

import { cn } from "@/components/ui/classNames";
import { useI18n } from "@/i18n";
import { AdminEmptyState } from "./AdminEmptyState";

export type AdminTableColumn<T> = {
  className?: string;
  key: string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
};

type AdminTableProps<T extends Record<string, unknown>> = {
  caption?: string;
  columns: AdminTableColumn<T>[];
  data: T[];
  emptyDescription?: string;
  emptyTitle?: string;
  keyField: keyof T;
  loading?: boolean;
};

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td className="px-4 py-3" key={i}>
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        </td>
      ))}
    </tr>
  );
}

export function AdminTable<T extends Record<string, unknown>>({
  caption,
  columns,
  data,
  emptyDescription,
  emptyTitle,
  keyField,
  loading = false,
}: AdminTableProps<T>) {
  const { t } = useI18n();

  if (!loading && data.length === 0) {
    return (
      <AdminEmptyState
        description={emptyDescription}
        title={emptyTitle ?? t("admin.table.emptyTitle")}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-white/[0.07]">
      <table className="w-full text-sm">
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : null}
        <thead>
          <tr className="border-b border-white/[0.07] bg-white/[0.03]">
            {columns.map((col) => (
              <th
                className={cn(
                  "px-4 py-3 text-left text-xs font-[750] uppercase tracking-wider text-white/40",
                  col.className
                )}
                key={col.key}
                scope="col"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow columns={columns.length} key={i} />
              ))
            : data.map((row, index) => (
                <tr
                  className="transition-colors hover:bg-white/[0.02]"
                  key={String(row[keyField])}
                >
                  {columns.map((col) => (
                    <td
                      className={cn("px-4 py-3 text-white/80", col.className)}
                      key={col.key}
                    >
                      {col.render
                        ? col.render(row, index)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

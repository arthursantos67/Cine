import React, { type ReactNode } from "react";

type AdminEmptyStateProps = {
  action?: ReactNode;
  description?: string;
  title: string;
};

export function AdminEmptyState({
  action,
  description,
  title,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-white/[0.10] py-16 text-center">
      <p className="text-sm font-bold text-white/60">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs text-white/40">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

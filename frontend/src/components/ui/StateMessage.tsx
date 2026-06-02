import type { ReactNode } from "react";

import { cn } from "./classNames";

type StateTone = "empty" | "error" | "loading" | "success";

type StateMessageProps = {
  action?: ReactNode;
  children: ReactNode;
  title: string;
  tone?: StateTone;
};

const toneClasses: Record<StateTone, string> = {
  empty:
    "border-info/30 border-l-info bg-[linear-gradient(90deg,rgb(31_111_235_/_12%),rgb(255_255_255_/_3%))]",
  error:
    "border-error/40 border-l-error bg-[linear-gradient(90deg,rgb(180_35_24_/_16%),rgb(255_255_255_/_3%))]",
  loading:
    "border-info/30 border-l-info bg-[linear-gradient(90deg,rgb(31_111_235_/_12%),rgb(255_255_255_/_3%))]",
  success:
    "border-success/35 border-l-success bg-[linear-gradient(90deg,rgb(21_115_71_/_14%),rgb(255_255_255_/_3%))]",
};

export function StateMessage({
  action,
  children,
  title,
  tone = "empty",
}: StateMessageProps) {
  const role = tone === "error" ? "alert" : "status";

  return (
    <div
      className={cn(
        "state-message grid gap-1.5 rounded-card border border-l-[5px] p-[18px] text-text",
        toneClasses[tone]
      )}
      role={role}
    >
      <strong className="text-base text-text">{title}</strong>
      <p className="m-0 max-w-prose text-sm leading-6 text-muted">{children}</p>
      {action ? (
        <div className="state-message__action mt-1">{action}</div>
      ) : null}
    </div>
  );
}

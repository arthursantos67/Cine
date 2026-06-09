"use client";

import { useI18n } from "@/i18n";

import type { SessionBadge } from "./session-selection";

type SessionBadgeListProps = {
  badges: SessionBadge[];
  className?: string;
};

export function SessionBadgeList({
  badges,
  className,
}: SessionBadgeListProps) {
  const { t } = useI18n();

  if (badges.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={t("session.badgesLabel")}
      className={["session-badges", className].filter(Boolean).join(" ")}
    >
      {badges.map((badge) => (
        <li className="session-badge" key={badge.label}>
          {badge.label}
        </li>
      ))}
    </ul>
  );
}

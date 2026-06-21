"use client";

import { useEffect, useState } from "react";

import { catalogApi } from "@/api/catalog";
import type { CatalogSession } from "@/types/catalog";

import { MoviePreviewPanel } from "./MoviePreviewPanel";

type SessionMoviePreviewProps = {
  sessionId: string;
  showOrderSummary?: boolean;
  summaryActionHref?: string;
  summaryActionLabel?: string;
};

export function SessionMoviePreview({
  sessionId,
  showOrderSummary = false,
  summaryActionHref,
  summaryActionLabel,
}: SessionMoviePreviewProps) {
  const [session, setSession] = useState<CatalogSession | null>(null);

  useEffect(() => {
    catalogApi
      .getSession(sessionId)
      .then(setSession)
      .catch(() => {});
  }, [sessionId]);

  if (!session) return null;

  return (
    <MoviePreviewPanel
      session={session}
      showOrderSummary={showOrderSummary}
      summaryActionHref={summaryActionHref}
      summaryActionLabel={summaryActionLabel}
    />
  );
}

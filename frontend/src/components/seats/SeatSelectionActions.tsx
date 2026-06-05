"use client";

import { useState } from "react";

import { useGuardedAction } from "@/components/auth/useGuardedAction";

export function SeatSelectionActions() {
  const guardAction = useGuardedAction();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function handleReserveAttempt() {
    guardAction(() => {
      setStatusMessage("Reserva autenticada pronta para integração com a API.");
    });
  }

  function handleReleaseAttempt() {
    guardAction(() => {
      setStatusMessage("Liberação autenticada pronta para integração com a API.");
    });
  }

  return (
    <div
      className="page-actions flex flex-wrap items-center gap-2"
      aria-label="Ações de assento"
    >
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-brand bg-brand px-3.5 text-sm font-extrabold leading-none text-white transition hover:bg-brand-strong"
        onClick={handleReserveAttempt}
        type="button"
      >
        Reservar assento
      </button>
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/15 bg-transparent px-3.5 text-sm font-extrabold leading-none text-text transition hover:bg-white/10"
        onClick={handleReleaseAttempt}
        type="button"
      >
        Liberar assento
      </button>
      {statusMessage ? (
        <p
          className="inline-status inline-status-info m-0 inline-flex w-fit rounded-pill border border-info/40 bg-info/15 px-2.5 py-2 text-[13px] font-extrabold leading-none text-[#b8d4ff]"
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StateMessage } from "@/components/ui/StateMessage";
import { useReservation } from "@/contexts/ReservationContext";
import { useReservationCountdown } from "@/hooks/useReservationCountdown";
import { useI18n } from "@/i18n";
import {
  PURCHASE_FLOW_EXPIRED_MESSAGE,
  getPurchaseFlowGuardDecision,
  PURCHASE_FLOW_MISSING_RESERVATION_MESSAGE,
} from "./purchase-flow-guards";

type PurchaseFlowGuardProps = {
  children: ReactNode;
};

export function PurchaseFlowGuard({ children }: PurchaseFlowGuardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const reservation = useReservation();
  const countdown = useReservationCountdown(reservation.reservationExpiresAt);
  const hasReservedSeats = reservation.reservedSeats.length > 0;
  const decision = getPurchaseFlowGuardDecision({
    hasReservedSeats,
    isExpired: countdown?.isExpired ?? false,
    sessionId: reservation.sessionId,
  });

  useEffect(() => {
    if (!decision.shouldResetExpiredReservation) {
      return;
    }

    reservation.expireReservation(
      decision.message === PURCHASE_FLOW_EXPIRED_MESSAGE
        ? t("reservation.expired")
        : decision.message ?? undefined
    );

    if (decision.redirectPath) {
      router.replace(decision.redirectPath);
    }
  }, [
    decision.message,
    decision.redirectPath,
    decision.shouldResetExpiredReservation,
    reservation,
    router,
    t,
  ]);

  if (decision.renderContent) {
    return children;
  }

  const recoveryPath = reservation.expiredSessionId
    ? `/sessions/${encodeURIComponent(reservation.expiredSessionId)}/seats`
    : "/";
  const message =
    reservation.expirationNotice ??
    translateGuardMessage(decision.message, t);
  const tone =
    reservation.expirationNotice ||
    decision.message !== PURCHASE_FLOW_MISSING_RESERVATION_MESSAGE
      ? "error"
      : "empty";

  return (
    <StateMessage
      action={
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-brand bg-brand px-3.5 text-sm font-extrabold leading-none text-white transition hover:bg-brand-strong"
          href={recoveryPath}
        >
          {reservation.expiredSessionId
            ? t("purchaseFlow.chooseSeats")
            : t("purchaseFlow.backToCatalog")}
        </Link>
      }
      tone={tone}
      title={translateGuardTitle(decision.message, decision.title, t)}
    >
      {message}
    </StateMessage>
  );
}

function translateGuardMessage(message: string | null, t: (key: string) => string) {
  if (message === PURCHASE_FLOW_EXPIRED_MESSAGE) {
    return t("reservation.expired");
  }

  if (message === PURCHASE_FLOW_MISSING_RESERVATION_MESSAGE) {
    return t("purchaseFlow.missingMessage");
  }

  return message;
}

function translateGuardTitle(
  message: string | null,
  title: string | null,
  t: (key: string) => string
) {
  if (message === PURCHASE_FLOW_EXPIRED_MESSAGE) {
    return t("purchaseFlow.expiredTitle");
  }

  if (message === PURCHASE_FLOW_MISSING_RESERVATION_MESSAGE) {
    return t("purchaseFlow.missingTitle");
  }

  return title ?? t("purchaseFlow.unavailableTitle");
}

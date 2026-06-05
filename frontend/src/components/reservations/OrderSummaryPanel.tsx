"use client";

import Link from "next/link";

import { cn } from "@/components/ui/classNames";
import { useReservation } from "@/contexts/ReservationContext";
import { useReservationCountdown } from "@/hooks/useReservationCountdown";
import type {
  PaymentMethod,
  ReservedSeat,
  TicketType,
} from "@/types/reservation";
import { formatCurrency } from "@/utils/formatters";

import {
  buildOrderSummaryItems,
  calculateOrderTotal,
  paymentMethodLabels,
} from "./order-summary";

type ReservationOrderSummaryProps = {
  actionHref?: string;
  actionLabel?: string;
};

export type OrderSummaryPanelProps = ReservationOrderSummaryProps & {
  countdownExpired?: boolean;
  countdownLabel?: string | null;
  countdownWarning?: boolean;
  paymentMethod?: PaymentMethod | null;
  reservationExpiresAt?: Date | null;
  reservedSeats: ReservedSeat[];
  ticketTypes: Record<string, TicketType>;
};

export function ReservationOrderSummary({
  actionHref,
  actionLabel = "Continuar",
}: ReservationOrderSummaryProps) {
  const reservation = useReservation();
  const countdown = useReservationCountdown(reservation.reservationExpiresAt);

  return (
    <OrderSummaryPanel
      actionHref={actionHref}
      actionLabel={actionLabel}
      countdownExpired={countdown?.isExpired ?? false}
      countdownLabel={countdown ? `Expira em ${countdown.displayValue}` : null}
      countdownWarning={countdown?.isWarning ?? false}
      paymentMethod={reservation.paymentMethod}
      reservationExpiresAt={reservation.reservationExpiresAt}
      reservedSeats={reservation.reservedSeats}
      ticketTypes={reservation.ticketTypes}
    />
  );
}

export function OrderSummaryPanel({
  actionHref,
  actionLabel = "Continuar",
  countdownExpired = false,
  countdownLabel,
  countdownWarning = false,
  paymentMethod = null,
  reservationExpiresAt = null,
  reservedSeats,
  ticketTypes,
}: OrderSummaryPanelProps) {
  const items = buildOrderSummaryItems(
    reservedSeats,
    ticketTypes
  );
  const total = calculateOrderTotal(items);
  const hasSeats = items.length > 0;
  const paymentLabel = paymentMethod
    ? paymentMethodLabels[paymentMethod]
    : null;

  return (
    <aside
      aria-label="Resumo do pedido"
      className="order-summary grid min-h-[280px] gap-3.5 rounded-card border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_5%),rgb(255_255_255_/_2%))] p-[18px] text-text shadow-[0_18px_54px_rgb(0_0_0_/_18%)] max-lg:min-h-0"
    >
      <div className="order-summary__header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div>
          <h2 className="m-0 text-xl leading-tight">Resumo do pedido</h2>
          <p className="m-0 mt-1 leading-snug text-text/65">
            {hasSeats
              ? `${items.length} assento${items.length === 1 ? "" : "s"} selecionado${items.length === 1 ? "" : "s"}`
              : "Nenhum assento selecionado"}
          </p>
        </div>
        <strong className="order-summary__total whitespace-nowrap text-lg leading-tight text-white">
          {formatCurrency(total)}
        </strong>
      </div>

      {reservationExpiresAt ? (
        <p
          className={cn(
            "order-summary__timer",
            "m-0 rounded-md border px-3 py-2 text-sm font-extrabold",
            countdownWarning || countdownExpired
              ? "border-error/50 bg-error/20 text-[#ffb9b2]"
              : "border-accent/45 bg-accent/15 text-[#ffe49b]",
            countdownWarning ? "order-summary__timer--warning" : undefined,
            countdownExpired ? "order-summary__timer--expired" : undefined
          )}
          role="timer"
        >
          {countdownExpired
            ? "Reserva expirada"
            : countdownLabel
              ? countdownLabel
              : "Reserva temporária ativa"}
        </p>
      ) : null}

      {hasSeats ? (
        <ul className="order-summary__list m-0 grid min-h-12 list-none gap-2 p-0">
          {items.map((item) => (
            <li
              className="order-summary__item grid min-h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2.5"
              key={item.seat.sessionSeatId}
            >
              <div className="grid min-w-0 gap-0.5">
                <strong className="text-[15px] leading-tight">
                  Assento {item.seatLabel}
                </strong>
                <span className="text-sm font-bold text-text/65">
                  {item.ticketTypeLabel}
                </span>
              </div>
              <span className="text-sm font-extrabold text-text/65">
                {formatCurrency(item.unitPrice)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="order-summary__empty m-0 leading-snug text-text/65">
          Escolha os assentos para ver valores e tipos de ingresso.
        </p>
      )}

      <dl className="order-summary__details m-0 grid gap-2 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between gap-3 max-[420px]:grid max-[420px]:items-start max-[420px]:gap-1">
          <dt className="text-sm font-extrabold text-text/65">Subtotal</dt>
          <dd className="m-0 text-right text-[15px] font-extrabold max-[420px]:text-left">
            {formatCurrency(total)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 max-[420px]:grid max-[420px]:items-start max-[420px]:gap-1">
          <dt className="text-sm font-extrabold text-text/65">Pagamento</dt>
          <dd className="m-0 text-right text-[15px] font-extrabold max-[420px]:text-left">
            {paymentLabel ?? "A definir"}
          </dd>
        </div>
      </dl>

      {actionHref && hasSeats ? (
        <Link
          className="order-summary__action inline-flex min-h-10 w-full items-center justify-center rounded-md border border-brand bg-brand px-3.5 text-sm font-extrabold leading-none text-white transition hover:bg-brand-strong"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </aside>
  );
}

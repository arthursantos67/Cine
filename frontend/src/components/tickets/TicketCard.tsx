"use client";

import { useI18n } from "@/i18n";
import type { PaymentMethod, TicketType } from "@/types/reservation";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

import { cn } from "../ui/classNames";
import {
  getPaymentMethodLabel,
  getTicketTypeLabel,
} from "../reservations/order-summary";

export type TicketCardTicket = {
  amount_paid: string;
  movie: {
    title: string;
  };
  payment_method: PaymentMethod;
  room: {
    name: string;
  };
  seat: {
    identifier: string;
  };
  session: {
    start_time: string;
  };
  ticket_code: string;
  ticket_type: TicketType;
};

type TicketCardProps = {
  ticket: TicketCardTicket;
  showVisualCode?: boolean;
};

const barcodeBarClasses = {
  medium: "w-[5px]",
  narrow: "w-[3px]",
  wide: "w-2",
} as const;

export function TicketCard({ showVisualCode = true, ticket }: TicketCardProps) {
  const { locale, t } = useI18n();

  return (
    <article className="ticket-card grid gap-3.5 rounded-card border border-white/10 border-l-[3px] border-l-brand/70 bg-[linear-gradient(90deg,rgb(179_19_34_/_10%),transparent_38%),linear-gradient(180deg,rgb(255_255_255_/_5%),rgb(255_255_255_/_2%))] p-[18px] text-text shadow-[0_18px_54px_rgb(0_0_0_/_18%)]">
      <div className="ticket-card__header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 max-lg:grid-cols-1">
        <div>
          <h3 className="m-0 [overflow-wrap:anywhere] text-[19px] leading-tight text-white">
            {ticket.movie.title}
          </h3>
          <p className="m-0 mt-1 font-bold text-text/65">
            {formatDateTime(ticket.session.start_time, locale)}
          </p>
        </div>
        <span className="max-w-full [overflow-wrap:anywhere] rounded-md border border-dashed border-white/20 bg-black/50 px-2.5 py-2 font-mono text-[13px] font-extrabold text-white">
          {ticket.ticket_code}
        </span>
      </div>

      <dl className="ticket-card__details m-0 grid grid-cols-[repeat(auto-fit,minmax(138px,1fr))] gap-2.5 max-[420px]:grid-cols-1">
        <div className="grid min-h-[70px] gap-1 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <dt className="text-[13px] font-extrabold text-text/65">{t("tickets.session")}</dt>
          <dd className="m-0 [overflow-wrap:anywhere] font-extrabold text-white">
            {formatDateTime(ticket.session.start_time, locale)}
          </dd>
        </div>
        <div className="grid min-h-[70px] gap-1 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <dt className="text-[13px] font-extrabold text-text/65">{t("tickets.room")}</dt>
          <dd className="m-0 [overflow-wrap:anywhere] font-extrabold text-white">
            {ticket.room.name}
          </dd>
        </div>
        <div className="grid min-h-[70px] gap-1 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <dt className="text-[13px] font-extrabold text-text/65">{t("tickets.seat")}</dt>
          <dd className="m-0 [overflow-wrap:anywhere] font-extrabold text-white">
            {ticket.seat.identifier}
          </dd>
        </div>
        <div className="grid min-h-[70px] gap-1 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <dt className="text-[13px] font-extrabold text-text/65">{t("tickets.type")}</dt>
          <dd className="m-0 [overflow-wrap:anywhere] font-extrabold text-white">
            {getTicketTypeLabel(ticket.ticket_type, locale)}
          </dd>
        </div>
        <div className="grid min-h-[70px] gap-1 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <dt className="text-[13px] font-extrabold text-text/65">{t("tickets.amountPaid")}</dt>
          <dd className="m-0 [overflow-wrap:anywhere] font-extrabold text-white">
            {formatCurrency(Number(ticket.amount_paid), locale)}
          </dd>
        </div>
        <div className="grid min-h-[70px] gap-1 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <dt className="text-[13px] font-extrabold text-text/65">{t("checkout.payment")}</dt>
          <dd className="m-0 [overflow-wrap:anywhere] font-extrabold text-white">
            {getPaymentMethodLabel(ticket.payment_method, locale)}
          </dd>
        </div>
        <div className="grid min-h-[70px] gap-1 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <dt className="text-[13px] font-extrabold text-text/65">{t("tickets.code")}</dt>
          <dd className="m-0 [overflow-wrap:anywhere] font-extrabold text-white">
            {ticket.ticket_code}
          </dd>
        </div>
      </dl>

      {showVisualCode ? (
        <div className="ticket-card__visual-code grid grid-cols-[minmax(180px,1fr)_auto] items-center gap-2.5 rounded-md border border-dashed border-white/20 bg-black/50 p-3 max-lg:grid-cols-1">
          <div
            aria-label={t("tickets.visualCodeAlt", { code: ticket.ticket_code })}
            className="ticket-card__barcode flex h-[58px] items-end gap-0.5 overflow-hidden"
            role="img"
          >
            {buildDisplayOnlyBars(ticket.ticket_code).map((bar, index) => (
              <span
                className={cn(
                  "ticket-card__barcode-bar block h-full rounded-[1px] bg-text",
                  `ticket-card__barcode-bar--${bar}`,
                  barcodeBarClasses[bar]
                )}
                key={`${ticket.ticket_code}-${index}`}
              />
            ))}
          </div>
          <p className="m-0 max-w-[220px] text-[13px] font-bold leading-snug text-text/60">
            {t("tickets.visualCodeHelp")}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function buildDisplayOnlyBars(ticketCode: string) {
  const source = ticketCode.trim() || "INGRESSO";
  const bars: Array<"narrow" | "medium" | "wide"> = [];

  for (const character of source) {
    const value = character.charCodeAt(0);

    bars.push(value % 2 === 0 ? "wide" : "narrow");
    bars.push(value % 3 === 0 ? "medium" : "narrow");
  }

  return bars.slice(0, 28).concat(["wide", "narrow", "medium"]);
}

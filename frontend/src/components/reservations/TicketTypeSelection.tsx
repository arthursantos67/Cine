"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/components/ui/classNames";
import { useReservation } from "@/contexts/ReservationContext";
import type { ReservedSeat, TicketType } from "@/types/reservation";
import { formatCurrency } from "@/utils/formatters";

import {
  buildTicketTypeSelectionRows,
  calculateTicketTypeSubtotal,
  ticketTypeOptions,
} from "./ticket-type-selection";

type TicketTypeSelectionFormProps = {
  onTicketTypeChange: (sessionSeatId: string, type: TicketType) => void;
  reservedSeats: ReservedSeat[];
  ticketTypes: Record<string, TicketType>;
};

const checkoutPanelClasses =
  "rounded-card border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_5%),rgb(255_255_255_/_2%))] p-5 text-text shadow-[0_18px_54px_rgb(0_0_0_/_18%)]";

const ticketSectionClasses = "ticket-types__panel grid gap-[18px]";

export function TicketTypeSelection() {
  const reservation = useReservation();

  return (
    <TicketTypeSelectionForm
      onTicketTypeChange={reservation.setTicketType}
      reservedSeats={reservation.reservedSeats}
      ticketTypes={reservation.ticketTypes}
    />
  );
}

export function TicketTypeSelectionForm({
  onTicketTypeChange,
  reservedSeats,
  ticketTypes,
}: TicketTypeSelectionFormProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const rows = useMemo(
    () => buildTicketTypeSelectionRows(reservedSeats, ticketTypes),
    [reservedSeats, ticketTypes]
  );
  const subtotal = calculateTicketTypeSubtotal(rows);

  return (
    <div className={cn("ticket-types grid gap-[18px]", checkoutPanelClasses)}>
      <section
        aria-labelledby="ticket-types-heading"
        className={ticketSectionClasses}
      >
        <div className="ticket-types__heading grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5 max-lg:grid-cols-1">
          <div>
            <h2
              className="m-0 text-[21px] leading-tight text-white"
              id="ticket-types-heading"
            >
              Ingressos por assento
            </h2>
            <p className="m-0 mt-1.5 leading-6 text-text/65">
              Escolha inteira ou meia-entrada para cada lugar reservado antes de
              avançar ao pagamento.
            </p>
          </div>
          <strong className="inline-flex min-h-[38px] items-center whitespace-nowrap rounded-md border border-brand/50 bg-brand/20 px-3 py-1.5 text-xl text-white">
            {formatCurrency(subtotal)}
          </strong>
        </div>

        <div className="ticket-types__list grid gap-3" role="list">
          {rows.map((row) => (
            <fieldset
              className="ticket-types__seat m-0 grid min-w-0 gap-3 rounded-md border border-white/10 border-l-[3px] border-l-brand/70 bg-[linear-gradient(90deg,rgb(179_19_34_/_10%),transparent_42%),rgb(255_255_255_/_4%)] p-3.5"
              key={row.seat.sessionSeatId}
              role="listitem"
            >
              <legend className="mb-2.5 grid gap-0.5 p-0">
                <span className="text-[13px] font-extrabold text-text/65">
                  Assento
                </span>
                <strong className="text-lg leading-tight text-white">
                  {row.seatLabel}
                </strong>
                <small className="text-[13px] font-extrabold text-text/65">
                  Fileira {row.seat.row}, assento {row.seat.number}
                </small>
              </legend>

              <div
                className="ticket-types__options grid grid-cols-2 gap-2.5 max-lg:grid-cols-1"
                role="radiogroup"
              >
                {ticketTypeOptions.map((option) => {
                  const optionPrice =
                    option.value === "meia" ? row.halfPrice : row.fullPrice;

                  return (
                    <label
                      className="ticket-types__option grid min-h-[74px] cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.04] p-3 text-text/80 has-[input:checked]:border-brand/70 has-[input:checked]:bg-brand/20 has-[input:checked]:text-white has-[input:checked]:shadow-[inset_0_1px_0_rgb(255_255_255_/_8%)] focus-within:border-info focus-within:shadow-[0_0_0_3px_rgb(31_111_235_/_18%)]"
                      key={option.value}
                    >
                      <input
                        className="size-[18px] accent-brand"
                        checked={row.selectedTicketType === option.value}
                        name={`ticket-type-${row.seat.sessionSeatId}`}
                        onChange={() =>
                          onTicketTypeChange(
                            row.seat.sessionSeatId,
                            option.value
                          )
                        }
                        type="radio"
                        value={option.value}
                      />
                      <span className="grid min-w-0 gap-1">
                        <strong className="[overflow-wrap:anywhere]">
                          {option.label}
                        </strong>
                        <small className="text-[13px] font-bold leading-snug text-text/60">
                          {option.description}
                        </small>
                      </span>
                      <b className="whitespace-nowrap text-[15px] text-white">
                        {formatCurrency(optionPrice)}
                      </b>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="voucher-heading"
        className={cn(ticketSectionClasses, "border-t border-white/10 pt-[18px]")}
      >
        <div className="ticket-types__heading grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5 max-lg:grid-cols-1">
          <div>
            <h2
              className="m-0 text-[21px] leading-tight text-white"
              id="voucher-heading"
            >
              Cupom
            </h2>
            <p className="m-0 mt-1.5 leading-6 text-text/65" id="voucher-helper">
              O cupom não altera o subtotal nesta versão.
            </p>
          </div>
        </div>

        <label className="ticket-types__voucher grid gap-2">
          <span className="text-[13px] font-extrabold text-text/65">
            Código promocional
          </span>
          <input
            aria-describedby="voucher-helper"
            autoComplete="off"
            className="min-h-[46px] w-full rounded-md border border-white/10 bg-black/35 px-3 py-2.5 text-text placeholder:text-text/45"
            name="voucher"
            onChange={(event) => setVoucherCode(event.target.value)}
            placeholder="Digite o cupom"
            type="text"
            value={voucherCode}
          />
        </label>
      </section>

      <div className="ticket-types__footer grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-t border-white/10 pt-[18px] max-lg:grid-cols-1">
        <div className="grid gap-1">
          <span className="text-[13px] font-extrabold text-text/65">
            Subtotal
          </span>
          <strong className="text-[22px] leading-tight text-white">
            {formatCurrency(subtotal)}
          </strong>
        </div>
        <Link
          className="ticket-types__continue inline-flex min-h-10 items-center justify-center rounded-md border border-brand bg-brand px-3.5 text-sm font-extrabold leading-none text-white transition hover:bg-brand-strong max-lg:w-full"
          href="/checkout"
        >
          Continuar para pagamento
        </Link>
      </div>
    </div>
  );
}

import { DEFAULT_TICKET_TYPE } from "@/contexts/reservation-state";
import type { ReservedSeat, TicketType } from "@/types/reservation";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";

import {
  calculateOrderTotal,
  calculateTicketUnitPrice,
  formatSeatLabel,
  ticketTypeLabels,
  getTicketTypeLabel,
} from "./order-summary";

export type TicketTypeOption = {
  description: string;
  label: string;
  value: TicketType;
};

export type TicketTypeSelectionRow = {
  fullPrice: number;
  halfPrice: number;
  seat: ReservedSeat;
  seatLabel: string;
  selectedTicketType: TicketType;
  unitPrice: number;
};

export const ticketTypeOptions: TicketTypeOption[] = [
  {
    description: "Valor integral da sessão",
    label: ticketTypeLabels.inteira,
    value: "inteira",
  },
  {
    description: "50% do valor integral",
    label: ticketTypeLabels.meia,
    value: "meia",
  },
];

export function getTicketTypeOptions(
  locale: Locale | string = DEFAULT_LOCALE
): TicketTypeOption[] {
  return [
    {
      description: t(locale, "ticketTypes.fullDescription"),
      label: getTicketTypeLabel("inteira", locale),
      value: "inteira",
    },
    {
      description: t(locale, "ticketTypes.halfDescription"),
      label: getTicketTypeLabel("meia", locale),
      value: "meia",
    },
  ];
}

export function buildTicketTypeSelectionRows(
  reservedSeats: ReservedSeat[],
  ticketTypes: Record<string, TicketType>
): TicketTypeSelectionRow[] {
  return reservedSeats.map((seat) => {
    const selectedTicketType =
      ticketTypes[seat.sessionSeatId] ?? DEFAULT_TICKET_TYPE;

    return {
      fullPrice: calculateTicketUnitPrice(seat.basePrice, "inteira"),
      halfPrice: calculateTicketUnitPrice(seat.basePrice, "meia"),
      seat,
      seatLabel: formatSeatLabel(seat),
      selectedTicketType,
      unitPrice: calculateTicketUnitPrice(seat.basePrice, selectedTicketType),
    };
  });
}

export function calculateTicketTypeSubtotal(
  rows: Pick<TicketTypeSelectionRow, "unitPrice">[]
) {
  return calculateOrderTotal(rows);
}

function t(locale: Locale | string, key: string) {
  const resolvedLocale = resolveLocale(locale);
  return messages[resolvedLocale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}

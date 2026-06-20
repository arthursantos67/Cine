import type {
  PaymentMethod,
  ReservedSeat,
  TicketType,
} from "@/types/reservation";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";

export type OrderSummaryItem = {
  seat: ReservedSeat;
  seatLabel: string;
  ticketType: TicketType | null;
  ticketTypeLabel: string;
  unitPrice: number;
};

export const ticketTypeLabels: Record<TicketType, string> = {
  gratuito: "Gratuito",
  inteira: "Inteira",
  meia: "Meia-entrada",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cartao_credito: "Cartão de crédito",
  pix: "PIX",
};

export function getTicketTypeLabel(
  ticketType: TicketType | null | undefined,
  locale: Locale | string = DEFAULT_LOCALE
) {
  if (!ticketType) {
    return t(locale, "domain.ticketType.pending");
  }

  return t(locale, `domain.ticketType.${ticketType}`);
}

export function getPaymentMethodLabel(
  paymentMethod: PaymentMethod,
  locale: Locale | string = DEFAULT_LOCALE
) {
  return t(locale, `domain.payment.${paymentMethod}`);
}

export function formatSeatLabel(seat: Pick<ReservedSeat, "number" | "row">) {
  return `${seat.row}${seat.number}`;
}

export function calculateTicketUnitPrice(
  basePrice: number,
  ticketType?: TicketType | null
) {
  if (ticketType === "meia") {
    return roundCurrency(basePrice * 0.5);
  }

  if (ticketType === "gratuito") {
    return 0;
  }

  return roundCurrency(basePrice);
}

export function buildOrderSummaryItems(
  reservedSeats: ReservedSeat[],
  ticketTypes: Record<string, TicketType>,
  locale: Locale | string = DEFAULT_LOCALE
): OrderSummaryItem[] {
  return reservedSeats.map((seat) => {
    const ticketType = ticketTypes[seat.sessionSeatId] ?? null;

    return {
      seat,
      seatLabel: formatSeatLabel(seat),
      ticketType,
      ticketTypeLabel: getTicketTypeLabel(ticketType, locale),
      unitPrice: calculateTicketUnitPrice(seat.basePrice, ticketType),
    };
  });
}

export function calculateOrderTotal(items: Pick<OrderSummaryItem, "unitPrice">[]) {
  return roundCurrency(
    items.reduce((total, item) => total + item.unitPrice, 0)
  );
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function t(locale: Locale | string, key: string) {
  const resolvedLocale = resolveLocale(locale);
  return messages[resolvedLocale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}

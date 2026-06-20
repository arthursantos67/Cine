import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { ReservedSeat } from "@/types/reservation";
import { formatCurrency } from "@/utils/formatters";

import { TicketTypeSelectionForm } from "./TicketTypeSelection";
import {
  buildTicketTypeSelectionRows,
  calculateTicketTypeSubtotal,
} from "./ticket-type-selection";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const firstSeat: ReservedSeat = {
  basePrice: 42.5,
  expiresAt: new Date("2026-05-22T21:40:00.000Z"),
  isAccessible: false,
  isCompanion: false,
  number: 7,
  row: "B",
  seatId: "seat-1",
  sessionSeatId: "session-seat-1",
};

const secondSeat: ReservedSeat = {
  ...firstSeat,
  number: 8,
  seatId: "seat-2",
  sessionSeatId: "session-seat-2",
};

test("ticket type selection rows list seats and calculate full and half prices", () => {
  const rows = buildTicketTypeSelectionRows(
    [firstSeat, secondSeat],
    {
      "session-seat-1": "inteira",
      "session-seat-2": "meia",
    }
  );

  assert.deepEqual(
    rows.map((row) => ({
      fullPrice: row.fullPrice,
      halfPrice: row.halfPrice,
      seatLabel: row.seatLabel,
      selectedTicketType: row.selectedTicketType,
      unitPrice: row.unitPrice,
    })),
    [
      {
        fullPrice: 42.5,
        halfPrice: 21.25,
        seatLabel: "B7",
        selectedTicketType: "inteira",
        unitPrice: 42.5,
      },
      {
        fullPrice: 42.5,
        halfPrice: 21.25,
        seatLabel: "B8",
        selectedTicketType: "meia",
        unitPrice: 21.25,
      },
    ]
  );
  assert.equal(calculateTicketTypeSubtotal(rows), 63.75);
});

test("ticket type selection defaults missing state to full price", () => {
  const rows = buildTicketTypeSelectionRows([firstSeat], {});

  assert.equal(rows[0].selectedTicketType, "inteira");
  assert.equal(calculateTicketTypeSubtotal(rows), 42.5);
});

test("ticket type selection form renders seats, options, voucher field, and subtotal", () => {
  const html = renderToStaticMarkup(
    createElement(TicketTypeSelectionForm, {
      onTicketTypeChange: () => undefined,
      reservedSeats: [firstSeat, secondSeat],
      ticketTypes: {
        "session-seat-1": "inteira",
        "session-seat-2": "meia",
      },
    })
  );

  assert.match(html, /Ingressos por assento/);
  assert.match(html, /Assento/);
  assert.match(html, /B7/);
  assert.match(html, /Fileira B, assento 7/);
  assert.match(html, /B8/);
  assert.match(html, /<fieldset/);
  assert.match(html, /name="ticket-type-session-seat-1"/);
  assert.match(html, /name="ticket-type-session-seat-2"/);
  assert.match(html, /Inteira/);
  assert.match(html, /Meia-entrada/);
  assert.match(html, /Código promocional/);
  assert.match(html, /O cupom não altera o subtotal nesta versão/);
  assert.match(html, /Continuar para pagamento/);
  assert.match(html, new RegExp(escapeRegExp(formatCurrency(63.75))));
});

test("companion seat row shows gratuito price and hides ticket type radio buttons", () => {
  const companionSeat: ReservedSeat = {
    ...firstSeat,
    isCompanion: true,
    number: 2,
    seatId: "seat-companion",
    sessionSeatId: "session-seat-companion",
  };
  const rows = buildTicketTypeSelectionRows(
    [firstSeat, companionSeat],
    { "session-seat-1": "inteira", "session-seat-companion": "gratuito" }
  );

  assert.equal(rows[0].isCompanion, false);
  assert.equal(rows[0].selectedTicketType, "inteira");
  assert.equal(rows[0].unitPrice, 42.5);
  assert.equal(rows[1].isCompanion, true);
  assert.equal(rows[1].selectedTicketType, "gratuito");
  assert.equal(rows[1].unitPrice, 0);
  assert.equal(calculateTicketTypeSubtotal(rows), 42.5);

  const html = renderToStaticMarkup(
    createElement(TicketTypeSelectionForm, {
      onTicketTypeChange: () => undefined,
      reservedSeats: [firstSeat, companionSeat],
      ticketTypes: { "session-seat-1": "inteira", "session-seat-companion": "gratuito" },
    })
  );

  assert.match(html, /name="ticket-type-session-seat-1"/);
  assert.doesNotMatch(html, /name="ticket-type-session-seat-companion"/);
  assert.match(html, /ticket-types__companion-notice/);
  assert.match(html, /Assento de acompanhante/);
});

test("voucher input is present without validation or discount controls", () => {
  const html = renderToStaticMarkup(
    createElement(TicketTypeSelectionForm, {
      onTicketTypeChange: () => undefined,
      reservedSeats: [firstSeat],
      ticketTypes: {
        "session-seat-1": "inteira",
      },
    })
  );

  assert.match(html, /name="voucher"/);
  assert.match(html, new RegExp(escapeRegExp(formatCurrency(42.5))));
  assert.doesNotMatch(html, /Aplicar cupom|Validar cupom|Desconto/);
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

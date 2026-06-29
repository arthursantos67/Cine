export function toReservationDTO(r) {
  return {
    id: r._id,
    session: r.session,
    seatLabel: r.seatLabel,
    status: r.status,
    ticketType: r.ticketType,
    amountPaid: r.amountPaid,
    paymentMethod: r.paymentMethod,
    ticketCode: r.ticketCode,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
  }
}

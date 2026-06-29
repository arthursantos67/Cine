import { reservationRepository } from '../repositories/reservation.repository.js'
import { sessionRepository } from '../repositories/session.repository.js'
import { AppError } from '../middlewares/error.middleware.js'

const RESERVATION_EXPIRY_MS = 15 * 60 * 1000

function calcAmount(basePrice, ticketType) {
  if (ticketType === 'meia') return basePrice * 0.5
  if (ticketType === 'gratuito') return 0
  return basePrice
}

export const reservationService = {
  async listMine(userId) {
    return reservationRepository.findByUser(userId)
  },

  async listAll() {
    return reservationRepository.findAll()
  },

  async getById(id, userId, role) {
    const reservation = await reservationRepository.findById(id)
    if (!reservation) throw new AppError('Reserva não encontrada', 404)
    if (role !== 'master' && String(reservation.user._id) !== String(userId)) {
      throw new AppError('Sem permissão para acessar esta reserva', 403)
    }
    return reservation
  },

  async create(userId, data) {
    const session = await sessionRepository.findById(data.session)
    if (!session) throw new AppError('Sessão não encontrada', 404)

    if (new Date(session.startTime) < new Date()) {
      throw new AppError('Não é possível reservar assentos para sessões já iniciadas', 422)
    }

    const taken = await reservationRepository.seatTaken(data.session, data.seatLabel)
    if (taken) throw new AppError(`Assento ${data.seatLabel} já está reservado`, 409)

    const ticketType = data.ticketType || 'inteira'
    const amountPaid = calcAmount(session.basePrice, ticketType)
    const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MS)

    return reservationRepository.create({
      user: userId,
      session: data.session,
      seatLabel: data.seatLabel,
      ticketType,
      amountPaid,
      expiresAt,
    })
  },

  async checkout(userId, reservationId, paymentMethod) {
    const reservation = await reservationRepository.findById(reservationId)
    if (!reservation) throw new AppError('Reserva não encontrada', 404)
    if (String(reservation.user._id) !== String(userId)) {
      throw new AppError('Sem permissão', 403)
    }
    if (reservation.status !== 'reserved') {
      throw new AppError('Reserva não está no estado disponível para pagamento', 422)
    }
    if (reservation.expiresAt && reservation.expiresAt < new Date()) {
      throw new AppError('Reserva expirada', 422)
    }

    return reservationRepository.updateById(reservationId, {
      status: 'purchased',
      paymentMethod,
      expiresAt: null,
    })
  },

  async cancel(id, userId, role) {
    const reservation = await reservationRepository.findById(id)
    if (!reservation) throw new AppError('Reserva não encontrada', 404)
    if (role !== 'master' && String(reservation.user._id) !== String(userId)) {
      throw new AppError('Sem permissão', 403)
    }
    if (reservation.status === 'cancelled') throw new AppError('Reserva já cancelada', 422)

    return reservationRepository.updateById(id, { status: 'cancelled' })
  },
}

import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { AppError } from '../middlewares/error.middleware.js'
import { paginate } from '../utils/pagination.js'
import SeatRow from '../models/SeatRow.js'
import Seat from '../models/Seat.js'
import SessionSeat from '../models/SessionSeat.js'
import Ticket from '../models/Ticket.js'
import Session from '../models/Session.js'

const router = Router()

const LOCK_MINUTES = 15

// ── SEAT MAP ──────────────────────────────────────────────────────────────────

router.get('/sessions/:id/seats', async (req, res, next) => {
  try {
    const sessionSeats = await SessionSeat.find({ session: req.params.id })
      .populate({ path: 'seat', populate: { path: 'row', model: 'SeatRow' } })

    const now = new Date()
    const userId = req.user?._id

    const map = sessionSeats.map((ss) => {
      const seat = ss.seat
      const row = seat?.row
      let status = ss.status
      if (status === 'RESERVED' && ss.lock_expires_at && ss.lock_expires_at < now) {
        status = 'AVAILABLE'
      }
      return {
        session_seat_id: String(ss._id),
        seat_id: String(seat._id),
        row: row?.name ?? '',
        number: seat?.number ?? 0,
        status,
        is_accessible: seat?.is_accessible ?? false,
        is_accessible_row: row?.is_accessible_row ?? false,
        companion_seat_id: seat?.companion_seat ? String(seat.companion_seat) : null,
        lock_expires_at: ss.lock_expires_at?.toISOString?.() ?? null,
        reserved_by_current_user: userId && ss.reserved_by
          ? String(ss.reserved_by) === String(userId)
          : false,
      }
    })

    res.json(map)
  } catch (err) { next(err) }
})

// ── RESERVE SEATS ─────────────────────────────────────────────────────────────

router.post('/sessions/:id/reservations', authenticate, async (req, res, next) => {
  try {
    const { seat_ids } = req.body
    if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
      throw new AppError('seat_ids obrigatório', 400, 'VALIDATION_FAILED')
    }

    const session = await Session.findById(req.params.id)
    if (!session) throw new AppError('Sessão não encontrada', 404, 'RESOURCE_NOT_FOUND')
    if (session.startTime < new Date()) throw new AppError('Sessão já iniciada', 422)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)

    const sessionSeats = await SessionSeat.find({
      session: req.params.id,
      seat: { $in: seat_ids },
    }).populate({ path: 'seat', populate: { path: 'row', model: 'SeatRow' } })

    const unavailable = sessionSeats.filter((ss) => {
      if (ss.status === 'PURCHASED') return true
      if (ss.status === 'RESERVED' && ss.lock_expires_at > now && String(ss.reserved_by) !== String(req.user._id)) return true
      return false
    })

    if (unavailable.length > 0) {
      throw new AppError('Um ou mais assentos já estão reservados', 409, 'SEAT_ALREADY_RESERVED')
    }

    await SessionSeat.updateMany(
      { session: req.params.id, seat: { $in: seat_ids } },
      { status: 'RESERVED', reserved_by: req.user._id, lock_expires_at: expiresAt }
    )

    const updated = await SessionSeat.find({
      session: req.params.id,
      seat: { $in: seat_ids },
    }).populate({ path: 'seat', populate: { path: 'row', model: 'SeatRow' } })

    res.json({
      session_id: String(session._id),
      status: 'reserved',
      expires_at: expiresAt.toISOString(),
      seats: updated.map((ss) => ({
        seat_id: String(ss.seat._id),
        row: ss.seat.row?.name ?? '',
        number: ss.seat.number,
        status: ss.status,
      })),
    })
  } catch (err) { next(err) }
})

// ── RELEASE SEATS ─────────────────────────────────────────────────────────────

router.delete('/sessions/:id/reservations', authenticate, async (req, res, next) => {
  try {
    const { session_seat_ids } = req.body
    if (!Array.isArray(session_seat_ids) || session_seat_ids.length === 0) {
      throw new AppError('session_seat_ids obrigatório', 400)
    }

    const session = await Session.findById(req.params.id)
    if (!session) throw new AppError('Sessão não encontrada', 404)

    const sessionSeats = await SessionSeat.find({
      _id: { $in: session_seat_ids },
      session: req.params.id,
      reserved_by: req.user._id,
      status: 'RESERVED',
    }).populate({ path: 'seat', populate: { path: 'row', model: 'SeatRow' } })

    if (sessionSeats.length > 0) {
      await SessionSeat.updateMany(
        { _id: { $in: sessionSeats.map((ss) => ss._id) } },
        { status: 'AVAILABLE', reserved_by: null, lock_expires_at: null }
      )
    }

    res.json({
      session_id: String(session._id),
      status: 'released',
      seats: sessionSeats.map((ss) => ({
        session_seat_id: String(ss._id),
        seat_id: String(ss.seat._id),
        row: ss.seat.row?.name ?? '',
        number: ss.seat.number,
        status: 'AVAILABLE',
        is_accessible: ss.seat.is_accessible ?? false,
      })),
    })
  } catch (err) { next(err) }
})

// ── CHECKOUT ──────────────────────────────────────────────────────────────────

const WEEKEND_DAYS = new Set([0, 5, 6]) // Dom, Sex, Sáb

function getWeekendMultiplier(startTime) {
  if (!startTime) return 1.0
  // Converter UTC para BRT (UTC-3) para verificar o dia da semana correto
  const brtDate = new Date(new Date(startTime).getTime() - 3 * 60 * 60 * 1000)
  return WEEKEND_DAYS.has(brtDate.getUTCDay()) ? 1.24 : 1.0
}

router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const { payment_method } = req.body

    // Aceita tanto o formato novo { seats: [{ session_seat_id, ticket_type }] }
    // quanto o formato legado { session_seat_ids, ticket_types }
    let session_seat_ids, ticket_types
    if (Array.isArray(req.body.seats)) {
      session_seat_ids = req.body.seats.map((s) => s.session_seat_id)
      ticket_types = req.body.seats.map((s) => s.ticket_type)
    } else {
      session_seat_ids = req.body.session_seat_ids
      ticket_types = req.body.ticket_types
    }

    if (!Array.isArray(session_seat_ids) || session_seat_ids.length === 0) {
      throw new AppError('session_seat_ids obrigatório', 400)
    }
    if (!['cartao_credito', 'pix'].includes(payment_method)) {
      throw new AppError('Método de pagamento inválido', 400, 'INVALID_PAYMENT_METHOD')
    }

    const now = new Date()
    const sessionSeats = await SessionSeat.find({
      _id: { $in: session_seat_ids },
      reserved_by: req.user._id,
      status: 'RESERVED',
    })
      .populate({ path: 'seat', populate: { path: 'row', model: 'SeatRow' } })
      .populate({
        path: 'session',
        populate: [
          { path: 'movie', select: 'title posterUrl' },
          { path: 'room', select: 'name basePrice' },
        ],
      })

    if (sessionSeats.length !== session_seat_ids.length) {
      throw new AppError('Um ou mais assentos não estão com reserva ativa', 422)
    }

    const expired = sessionSeats.filter((ss) => ss.lock_expires_at && ss.lock_expires_at < now)
    if (expired.length > 0) {
      throw new AppError('Reserva expirada', 422)
    }

    const tickets = []
    let totalAmount = 0

    for (let i = 0; i < sessionSeats.length; i++) {
      const ss = sessionSeats[i]
      const ticketType = Array.isArray(ticket_types) ? (ticket_types[i] || 'inteira') : 'inteira'
      const rawPrice = ss.session?.basePrice ?? ss.session?.room?.basePrice ?? 0
      const multiplier = getWeekendMultiplier(ss.session?.startTime)
      const basePrice = Math.round(rawPrice * multiplier * 100) / 100
      const amount = ticketType === 'meia' ? basePrice * 0.5 : ticketType === 'gratuito' ? 0 : basePrice

      const ticket = await Ticket.create({
        session_seat: ss._id,
        user: req.user._id,
        ticket_type: ticketType,
        amount_paid: amount,
        payment_method,
      })

      await SessionSeat.findByIdAndUpdate(ss._id, {
        status: 'PURCHASED',
        lock_expires_at: null,
      })

      totalAmount += amount
      tickets.push({ ss, ticket, ticketType, amount })
    }

    res.json({
      status: 'purchased',
      payment_method,
      total_amount: totalAmount.toFixed(2),
      seats: tickets.map(({ ss, ticketType, amount }) => ({
        session_seat_id: String(ss._id),
        seat_id: String(ss.seat._id),
        row: ss.seat.row?.name ?? '',
        number: ss.seat.number,
        status: 'PURCHASED',
        ticket_type: ticketType,
        amount_paid: amount.toFixed(2),
      })),
      tickets: tickets.map(({ ss, ticket, ticketType, amount }) => ({
        ticket_id: String(ticket._id),
        ticket_code: ticket.ticket_code,
        session_seat_id: String(ss._id),
        seat_id: String(ss.seat._id),
        ticket_type: ticketType,
        amount_paid: amount.toFixed(2),
        payment_method,
        movie: {
          id: String(ss.session?.movie?._id ?? ''),
          title: ss.session?.movie?.title ?? '',
        },
        session: {
          id: String(ss.session?._id ?? ''),
          start_time: ss.session?.startTime?.toISOString?.() ?? '',
          end_time: ss.session?.endTime?.toISOString?.() ?? '',
        },
        room: {
          id: String(ss.session?.room?._id ?? ''),
          name: ss.session?.room?.name ?? '',
        },
        seat: {
          id: String(ss.seat._id),
          row: ss.seat.row?.name ?? '',
          number: ss.seat.number,
          identifier: `${ss.seat.row?.name ?? ''}${ss.seat.number}`,
        },
      })),
    })
  } catch (err) { next(err) }
})

// ── SEAT ROWS ─────────────────────────────────────────────────────────────────

router.get('/seat-rows', authenticate, async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.room) filter.room = req.query.room
    const q = SeatRow.find(filter).sort('name')
    const result = await paginate(q, req.query, req)
    res.json({ ...result, results: result.results.map(toSeatRowDTO) })
  } catch (err) { next(err) }
})

router.post('/seat-rows', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const row = await SeatRow.create({
      room: req.body.room,
      name: req.body.name,
      is_accessible_row: req.body.is_accessible_row ?? false,
    })
    res.status(201).json(toSeatRowDTO(row))
  } catch (err) { next(err) }
})

router.patch('/seat-rows/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const row = await SeatRow.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!row) throw new AppError('Fileira não encontrada', 404)
    res.json(toSeatRowDTO(row))
  } catch (err) { next(err) }
})

router.delete('/seat-rows/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    await SeatRow.findByIdAndDelete(req.params.id)
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── SEATS ─────────────────────────────────────────────────────────────────────

router.get('/seats', authenticate, async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.room) {
      const rows = await SeatRow.find({ room: req.query.room }, '_id')
      filter.row = { $in: rows.map((r) => r._id) }
    }
    const q = Seat.find(filter).populate('row').sort({ number: 1, _id: 1 })
    const result = await paginate(q, req.query, req)
    res.json({ ...result, results: result.results.map(toSeatDTO) })
  } catch (err) { next(err) }
})

router.post('/seats', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const seat = await Seat.create({
      row: req.body.row,
      number: req.body.number,
      is_accessible: req.body.is_accessible ?? false,
      companion_seat: req.body.companion_seat ?? null,
    })
    await seat.populate('row')
    res.status(201).json(toSeatDTO(seat))
  } catch (err) { next(err) }
})

router.patch('/seats/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('row')
    if (!seat) throw new AppError('Assento não encontrado', 404)
    res.json(toSeatDTO(seat))
  } catch (err) { next(err) }
})

router.delete('/seats/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    await Seat.findByIdAndDelete(req.params.id)
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── BULK LAYOUT ───────────────────────────────────────────────────────────────

router.post('/bulk-create-layout', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const { room, rows } = req.body
    if (!room || !Array.isArray(rows)) throw new AppError('room e rows obrigatórios', 400)

    const created = []
    for (const rowData of rows) {
      const seatRow = await SeatRow.create({ room, name: rowData.name, is_accessible_row: false })
      const seats = await Seat.insertMany(
        (rowData.seats || []).map((s) => ({ row: seatRow._id, number: s.number, is_accessible: false }))
      )
      created.push({ ...toSeatRowDTO(seatRow), seats: seats.map(toSeatDTO) })
    }

    res.json(created)
  } catch (err) { next(err) }
})

router.post('/accessible-row', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const { room, name, accessible_seat_count } = req.body
    const seatRow = await SeatRow.create({ room, name, is_accessible_row: true })
    const count = parseInt(accessible_seat_count) || 2

    // Create interleaved pairs: accessible(odd number) + companion(even number)
    // e.g. for count=3: seats 1(acc),2(comp), 3(acc),4(comp), 5(acc),6(comp)
    const allSeats = []
    for (let i = 0; i < count; i++) {
      const companion = await Seat.create({ row: seatRow._id, number: 2 * i + 2, is_accessible: false })
      const accessible = await Seat.create({ row: seatRow._id, number: 2 * i + 1, is_accessible: true, companion_seat: companion._id })
      allSeats.push(accessible, companion)
    }
    allSeats.sort((a, b) => a.number - b.number)

    res.json({ ...toSeatRowDTO(seatRow), seats: allSeats.map(toSeatDTO) })
  } catch (err) { next(err) }
})

// ── DTOs ──────────────────────────────────────────────────────────────────────

function toSeatRowDTO(r) {
  return {
    id: String(r._id),
    name: r.name,
    room: String(r.room),
    is_accessible_row: r.is_accessible_row ?? false,
  }
}

function toSeatDTO(s) {
  return {
    id: String(s._id),
    row: String(s.row?._id ?? s.row),
    number: s.number,
    is_accessible: s.is_accessible ?? false,
    companion_seat: s.companion_seat ? String(s.companion_seat) : null,
  }
}

export default router

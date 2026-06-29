import Reservation from '../models/Reservation.js'

export const reservationRepository = {
  findAll: () =>
    Reservation.find()
      .populate('user', 'username email')
      .populate({ path: 'session', populate: [{ path: 'movie', select: 'title' }, { path: 'room', select: 'name' }] })
      .sort('-createdAt'),

  findByUser: (userId) =>
    Reservation.find({ user: userId })
      .populate({ path: 'session', populate: [{ path: 'movie', select: 'title posterUrl' }, { path: 'room', select: 'name' }] })
      .sort('-createdAt'),

  findById: (id) =>
    Reservation.findById(id)
      .populate('user', 'username email')
      .populate({ path: 'session', populate: [{ path: 'movie', select: 'title' }, { path: 'room', select: 'name capacity' }] }),

  create: (data) => Reservation.create(data),

  updateById: (id, data) =>
    Reservation.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  seatTaken: (sessionId, seatLabel) =>
    Reservation.exists({ session: sessionId, seatLabel, status: { $ne: 'cancelled' } }),
}

import { reservationService } from '../services/reservation.service.js'
import { toReservationDTO } from '../dtos/reservation.dto.js'

export const reservationController = {
  async listMine(req, res, next) {
    try {
      const reservations = await reservationService.listMine(req.user._id)
      res.json({ status: 'success', data: { reservations: reservations.map(toReservationDTO) } })
    } catch (err) { next(err) }
  },

  async listAll(req, res, next) {
    try {
      const reservations = await reservationService.listAll()
      res.json({ status: 'success', data: { reservations: reservations.map(toReservationDTO) } })
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const reservation = await reservationService.getById(req.params.id, req.user._id, req.user.role)
      res.json({ status: 'success', data: { reservation: toReservationDTO(reservation) } })
    } catch (err) { next(err) }
  },

  async create(req, res, next) {
    try {
      const reservation = await reservationService.create(req.user._id, req.validatedBody)
      res.status(201).json({ status: 'success', data: { reservation: toReservationDTO(reservation) } })
    } catch (err) { next(err) }
  },

  async checkout(req, res, next) {
    try {
      const { reservationId, paymentMethod } = req.validatedBody
      const reservation = await reservationService.checkout(req.user._id, reservationId, paymentMethod)
      res.json({ status: 'success', data: { reservation: toReservationDTO(reservation) } })
    } catch (err) { next(err) }
  },

  async cancel(req, res, next) {
    try {
      const reservation = await reservationService.cancel(req.params.id, req.user._id, req.user.role)
      res.json({ status: 'success', data: { reservation: toReservationDTO(reservation) } })
    } catch (err) { next(err) }
  },
}

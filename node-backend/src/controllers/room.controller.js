import { roomService } from '../services/room.service.js'

export const roomController = {
  async list(req, res, next) {
    try {
      const rooms = await roomService.list()
      res.json({ status: 'success', data: { rooms } })
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const room = await roomService.getById(req.params.id)
      res.json({ status: 'success', data: { room } })
    } catch (err) { next(err) }
  },

  async create(req, res, next) {
    try {
      const room = await roomService.create(req.validatedBody)
      res.status(201).json({ status: 'success', data: { room } })
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const room = await roomService.update(req.params.id, req.validatedBody)
      res.json({ status: 'success', data: { room } })
    } catch (err) { next(err) }
  },

  async delete(req, res, next) {
    try {
      await roomService.delete(req.params.id)
      res.status(204).send()
    } catch (err) { next(err) }
  },
}

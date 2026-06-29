import { sessionService } from '../services/session.service.js'

export const sessionController = {
  async list(req, res, next) {
    try {
      const filter = {}
      if (req.query.movie) filter.movie = req.query.movie
      const sessions = await sessionService.list(filter)
      res.json({ status: 'success', data: { sessions } })
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const session = await sessionService.getById(req.params.id)
      res.json({ status: 'success', data: { session } })
    } catch (err) { next(err) }
  },

  async create(req, res, next) {
    try {
      const result = await sessionService.create(req.validatedBody)
      if (Array.isArray(result)) {
        res.status(201).json({ status: 'success', data: { sessions: result, count: result.length } })
      } else {
        res.status(201).json({ status: 'success', data: { session: result } })
      }
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const session = await sessionService.update(req.params.id, req.validatedBody)
      res.json({ status: 'success', data: { session } })
    } catch (err) { next(err) }
  },

  async delete(req, res, next) {
    try {
      await sessionService.delete(req.params.id)
      res.status(204).send()
    } catch (err) { next(err) }
  },
}

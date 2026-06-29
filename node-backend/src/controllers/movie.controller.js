import { movieService } from '../services/movie.service.js'

export const movieController = {
  async list(req, res, next) {
    try {
      const filter = {}
      if (req.query.status) filter.status = req.query.status
      const movies = await movieService.list(filter)
      res.json({ status: 'success', data: { movies } })
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const movie = await movieService.getById(req.params.id)
      res.json({ status: 'success', data: { movie } })
    } catch (err) { next(err) }
  },

  async create(req, res, next) {
    try {
      const movie = await movieService.create(req.validatedBody)
      res.status(201).json({ status: 'success', data: { movie } })
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const movie = await movieService.update(req.params.id, req.validatedBody)
      res.json({ status: 'success', data: { movie } })
    } catch (err) { next(err) }
  },

  async delete(req, res, next) {
    try {
      await movieService.delete(req.params.id)
      res.status(204).send()
    } catch (err) { next(err) }
  },
}

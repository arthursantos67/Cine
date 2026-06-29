import { genreService } from '../services/genre.service.js'

export const genreController = {
  async list(req, res, next) {
    try {
      const genres = await genreService.list()
      res.json({ status: 'success', data: { genres } })
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const genre = await genreService.getById(req.params.id)
      res.json({ status: 'success', data: { genre } })
    } catch (err) { next(err) }
  },

  async create(req, res, next) {
    try {
      const genre = await genreService.create(req.validatedBody)
      res.status(201).json({ status: 'success', data: { genre } })
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const genre = await genreService.update(req.params.id, req.validatedBody)
      res.json({ status: 'success', data: { genre } })
    } catch (err) { next(err) }
  },

  async delete(req, res, next) {
    try {
      await genreService.delete(req.params.id)
      res.status(204).send()
    } catch (err) { next(err) }
  },
}

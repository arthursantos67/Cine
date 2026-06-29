import { movieRepository } from '../repositories/movie.repository.js'
import { AppError } from '../middlewares/error.middleware.js'

export const movieService = {
  async list(filter = {}) {
    return movieRepository.findAll(filter)
  },

  async getById(id) {
    const movie = await movieRepository.findById(id)
    if (!movie) throw new AppError('Filme não encontrado', 404)
    return movie
  },

  async create(data) {
    return movieRepository.create(data)
  },

  async update(id, data) {
    const movie = await movieRepository.updateById(id, data)
    if (!movie) throw new AppError('Filme não encontrado', 404)
    return movie
  },

  async delete(id) {
    const movie = await movieRepository.deleteById(id)
    if (!movie) throw new AppError('Filme não encontrado', 404)
  },
}

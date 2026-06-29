import { movieService } from '../services/movie.service.js'
import { sessionService } from '../services/session.service.js'

export const viewController = {
  async listMovies(req, res, next) {
    try {
      const movies = await movieService.list({ status: 'em_cartaz' })
      res.render('movies', { title: 'CinePrime — Em Cartaz', movies })
    } catch (err) {
      next(err)
    }
  },

  async movieDetail(req, res, next) {
    try {
      const movie = await movieService.getById(req.params.id)
      const sessions = await sessionService.list({ movie: req.params.id })
      res.render('movie-detail', { title: `${movie.title} — CinePrime`, movie, sessions })
    } catch (err) {
      next(err)
    }
  },
}

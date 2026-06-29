import { Router } from 'express'
import { authenticate, authenticateOptional } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { AppError } from '../middlewares/error.middleware.js'
import { paginate } from '../utils/pagination.js'
import { translateToAllLocales } from '../services/translation.service.js'
import Movie from '../models/Movie.js'
import Genre from '../models/Genre.js'
import Room from '../models/Room.js'
import Session from '../models/Session.js'
import SeatRow from '../models/SeatRow.js'
import Seat from '../models/Seat.js'
import Review from '../models/Review.js'
import ReviewVote from '../models/ReviewVote.js'
import MovieInterest from '../models/MovieInterest.js'

const DEFAULT_LOCALE = 'pt-BR'

const router = Router()

// ── Precificação dinâmica por dia da semana ────────────────────────────────────

const WEEKEND_DAYS = new Set([0, 5, 6]) // Dom, Sex, Sáb

function getWeekendMultiplier(startTime) {
  if (!startTime) return 1.0
  // Converter UTC para BRT (UTC-3) para checar o dia local correto
  const brtDate = new Date(new Date(startTime).getTime() - 3 * 60 * 60 * 1000)
  return WEEKEND_DAYS.has(brtDate.getUTCDay()) ? 1.24 : 1.0
}

// ── Helpers de conversão ─────────────────────────────────────────────────────

function applyMovieTranslation(m, locale) {
  if (!locale || locale === 'pt-BR' || !m.translations) return {}
  const t = m.translations[locale] ?? {}
  const result = {}
  if (t.title) result.title = t.title
  if (t.synopsis) result.synopsis = t.synopsis
  return result
}

function applyGenreTranslation(g, locale) {
  if (!locale || locale === 'pt-BR' || !g.translations) return {}
  const t = g.translations[locale] ?? {}
  return t.name ? { name: t.name } : {}
}

function applyRoomTranslation(r, locale) {
  if (!locale || locale === 'pt-BR' || !r.translations) return {}
  const t = r.translations[locale] ?? {}
  const result = {}
  if (t.display_name) result.display_name = t.display_name
  if (t.description) result.description = t.description
  return result
}

function toMovieDTO(m, locale, showTranslations = false) {
  const mt = applyMovieTranslation(m, locale)
  return {
    id: String(m._id),
    title: mt.title ?? m.title,
    synopsis: mt.synopsis ?? m.synopsis ?? '',
    genres: (m.genres || []).map((g) => {
      const gt = applyGenreTranslation(g, locale)
      return {
        id: String(g._id ?? g),
        name: gt.name ?? g.name ?? '',
        ...(showTranslations && { translations: g.translations ?? {} }),
      }
    }),
    duration_minutes: m.durationMin,
    release_date: m.releaseDate ? new Date(m.releaseDate).toISOString().split('T')[0] : null,
    poster_url: m.posterUrl,
    spotlight_url: m.spotlightUrl ?? null,
    status: m.status,
    age_rating: m.ageRating ?? null,
    director: m.director ?? null,
    is_featured: m.isFeatured,
    ...(showTranslations && { translations: m.translations ?? {} }),
    created_at: m.createdAt?.toISOString?.() ?? m.createdAt,
    updated_at: m.updatedAt?.toISOString?.() ?? m.updatedAt,
  }
}

function toGenreDTO(g, locale, showTranslations = false) {
  const gt = applyGenreTranslation(g, locale)
  return {
    id: String(g._id),
    name: gt.name ?? g.name,
    ...(showTranslations && { translations: g.translations ?? {} }),
    created_at: g.createdAt?.toISOString?.() ?? g.createdAt,
    updated_at: g.updatedAt?.toISOString?.() ?? g.updatedAt,
  }
}

function toRoomDTO(r, locale, showTranslations = false) {
  const rt = applyRoomTranslation(r, locale)
  return {
    id: String(r._id),
    name: r.name,
    capacity: r.capacity,
    experience_type: r.experienceType ?? null,
    display_name: rt.display_name ?? r.displayName ?? null,
    description: rt.description ?? r.description ?? null,
    base_price: r.basePrice != null ? Number(r.basePrice).toFixed(2) : null,
    ...(showTranslations && { translations: r.translations ?? {} }),
    accessible_row_index: r.accessibleRowIndex ?? 0,
    max_center_seats_per_row: r.maxCenterSeatsPerRow ?? null,
    created_at: r.createdAt?.toISOString?.() ?? r.createdAt,
    updated_at: r.updatedAt?.toISOString?.() ?? r.updatedAt,
  }
}

function toSessionDTO(s, locale, layoutHints = {}) {
  const movie = s.movie
  const room = s.room
  const mt = movie ? applyMovieTranslation(movie, locale) : {}
  const rt = room ? applyRoomTranslation(room, locale) : {}
  return {
    id: String(s._id),
    movie: movie
      ? {
          id: String(movie._id),
          title: mt.title ?? movie.title,
          synopsis: mt.synopsis ?? movie.synopsis ?? '',
          genres: (movie.genres || []).map((g) => {
            const gt = applyGenreTranslation(g, locale)
            return { id: String(g._id ?? g), name: gt.name ?? g.name ?? '' }
          }),
          duration_minutes: movie.durationMin,
          release_date: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : null,
          poster_url: movie.posterUrl,
          spotlight_url: movie.spotlightUrl ?? null,
          status: movie.status,
          age_rating: movie.ageRating ?? null,
          director: movie.director ?? null,
          is_featured: movie.isFeatured,
        }
      : null,
    room: room
      ? {
          id: String(room._id),
          name: room.name,
          capacity: room.capacity,
          experience_type: room.experienceType ?? null,
          display_name: rt.display_name ?? room.displayName ?? null,
          description: rt.description ?? room.description ?? null,
          accessible_row_index: layoutHints.accessibleRowIndex ?? room.accessibleRowIndex ?? 0,
          max_center_seats_per_row: layoutHints.maxCenterSeatsPerRow !== undefined
            ? layoutHints.maxCenterSeatsPerRow
            : room.maxCenterSeatsPerRow ?? null,
        }
      : null,
    start_time: s.startTime?.toISOString?.() ?? s.startTime,
    end_time: s.endTime?.toISOString?.() ?? s.endTime,
    base_price: (() => {
      const raw = s.basePrice != null ? Number(s.basePrice) : 0
      const multiplier = getWeekendMultiplier(s.startTime)
      return (Math.round(raw * multiplier * 100) / 100).toFixed(2)
    })(),
    audio_format: s.audioFormat ?? null,
    projection_format: s.projectionFormat ?? null,
    session_type: s.sessionType ?? 'regular',
    created_at: s.createdAt?.toISOString?.() ?? s.createdAt,
    updated_at: s.updatedAt?.toISOString?.() ?? s.updatedAt,
  }
}

// Computa accessible_row_index e max_center_seats_per_row automaticamente quando
// não estão configurados na sala, usando a ordem de criação das fileiras e a
// distribuição de assentos por fileira.
async function computeRoomLayoutHints(room) {
  const hints = {}

  // ── Accessible row index ──────────────────────────────────────────────────
  // Se o admin não configurou (valor 0 = padrão), inferir da ordem de criação
  // das SeatRows. A fileira PCD é inserida pelo admin na ordem física da sala.
  if ((room.accessibleRowIndex ?? 0) === 0) {
    const seatRows = await SeatRow.find({ room: room._id }).sort({ createdAt: 1 }).lean()
    const accessibleIdx = seatRows.findIndex((r) => r.is_accessible_row)
    if (accessibleIdx > 0) {
      // Conta apenas fileiras regulares antes da fileira acessível
      const regularsBefore = seatRows.slice(0, accessibleIdx).filter((r) => !r.is_accessible_row).length
      hints.accessibleRowIndex = regularsBefore
    }
  }

  // ── Max center seats per row ──────────────────────────────────────────────
  // Se não configurado, usar a moda das contagens de assentos por fileira.
  // Fileiras com mais assentos que a moda são as "fileiras com namoradeiras".
  if (room.maxCenterSeatsPerRow == null) {
    const regularRows = await SeatRow.find({ room: room._id, is_accessible_row: false }).lean()
    if (regularRows.length > 0) {
      const rowIds = regularRows.map((r) => r._id)
      const counts = await Seat.aggregate([
        { $match: { row: { $in: rowIds } } },
        { $group: { _id: '$row', count: { $sum: 1 } } },
      ])

      if (counts.length > 0) {
        const freq = new Map()
        for (const { count } of counts) freq.set(count, (freq.get(count) ?? 0) + 1)
        const maxFreq = Math.max(...freq.values())
        const modes = [...freq.entries()].filter(([, f]) => f === maxFreq).map(([c]) => c)
        const smallestMode = Math.min(...modes)
        const hasWiderRows = counts.some(({ count }) => count > smallestMode)
        if (hasWiderRows) hints.maxCenterSeatsPerRow = smallestMode
      }
    }
  }

  return hints
}

// ── MOVIES ───────────────────────────────────────────────────────────────────

router.get('/movies', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.is_featured !== undefined) filter.isFeatured = req.query.is_featured === 'true'
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' }

    const q = Movie.find(filter).populate('genres', 'name translations').sort('-createdAt')
    const result = await paginate(q, req.query, req)
    res.json({ ...result, results: result.results.map((m) => toMovieDTO(m, req.locale, req.query.include_translations === 'true')) })
  } catch (err) { next(err) }
})

router.get('/movies/:id', async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id).populate('genres', 'name translations')
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')
    const [stats] = await Review.aggregate([
      { $match: { movie: movie._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    res.json({
      ...toMovieDTO(movie, req.locale, req.query.include_translations === 'true'),
      average_rating: stats?.avg ?? null,
      review_count: stats?.count ?? 0,
    })
  } catch (err) { next(err) }
})

router.post('/movies', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const data = movieFromPayload(req.body)
    const movie = await Movie.create(data)
    await movie.populate('genres', 'name translations')
    res.status(201).json(toMovieDTO(movie, req.locale, req.query.include_translations === 'true'))
  } catch (err) { next(err) }
})

router.patch('/movies/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const data = movieFromPayload(req.body)
    const movie = await Movie.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate('genres', 'name translations')
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')
    res.json(toMovieDTO(movie, req.locale, req.query.include_translations === 'true'))
  } catch (err) { next(err) }
})

router.delete('/movies/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id)
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')
    res.status(204).send()
  } catch (err) { next(err) }
})

function movieFromPayload(body) {
  const data = {}
  if (body.title !== undefined) data.title = body.title
  if (body.synopsis !== undefined) data.synopsis = body.synopsis
  if (body.genres !== undefined) data.genres = body.genres
  if (body.duration_minutes !== undefined) data.durationMin = body.duration_minutes
  if (body.release_date !== undefined) data.releaseDate = body.release_date
  if (body.poster_url !== undefined) data.posterUrl = body.poster_url
  if (body.spotlight_url !== undefined) data.spotlightUrl = body.spotlight_url
  if (body.status !== undefined) data.status = body.status
  if (body.age_rating !== undefined) data.ageRating = body.age_rating
  if (body.director !== undefined) data.director = body.director
  if (body.is_featured !== undefined) data.isFeatured = body.is_featured
  if (body.translations !== undefined) data.translations = body.translations
  return data
}

// ── INTEREST ─────────────────────────────────────────────────────────────────

router.get('/movies/:id/interest/', authenticateOptional, async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')
    if (movie.status !== 'em_breve') throw new AppError('Interesse disponível apenas para filmes em breve', 422)

    const count = await MovieInterest.countDocuments({ movie: movie._id })
    const user_interested = req.user
      ? !!(await MovieInterest.exists({ movie: movie._id, user: req.user._id }))
      : null

    res.json({ count, user_interested })
  } catch (err) { next(err) }
})

router.post('/movies/:id/interest/', authenticate, async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')
    if (movie.status !== 'em_breve') throw new AppError('Interesse disponível apenas para filmes em breve', 422)

    await MovieInterest.updateOne(
      { movie: movie._id, user: req.user._id },
      { movie: movie._id, user: req.user._id },
      { upsert: true }
    )

    const count = await MovieInterest.countDocuments({ movie: movie._id })
    res.json({ count, user_interested: true })
  } catch (err) { next(err) }
})

router.delete('/movies/:id/interest/', authenticate, async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')

    await MovieInterest.deleteOne({ movie: movie._id, user: req.user._id })
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── REVIEWS ──────────────────────────────────────────────────────────────────

function toReviewDTO(review, userVote = null) {
  return {
    id: String(review._id),
    user: {
      id: String(review.user._id ?? review.user),
      username: review.user.username ?? '',
      email: review.user.email ?? '',
    },
    rating: String(review.rating),
    comment: review.comment ?? '',
    like_count: review.likeCount ?? 0,
    dislike_count: review.dislikeCount ?? 0,
    user_vote: userVote,
    created_at: review.createdAt?.toISOString?.() ?? review.createdAt,
    updated_at: review.updatedAt?.toISOString?.() ?? review.updatedAt,
  }
}

router.get('/movies/:id/reviews/', authenticateOptional, async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')

    const filter = { movie: req.params.id }
    if (req.query.rating) {
      const r = Number(req.query.rating)
      filter.rating = r === 0.5 ? 0.5 : { $gte: r, $lt: r + 1 }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = 20
    const skip = (page - 1) * pageSize

    const [count, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter).populate('user', 'username email').sort('-createdAt').skip(skip).limit(pageSize),
    ])

    let votesMap = {}
    let myReview = null

    if (req.user) {
      const reviewIds = reviews.map((r) => r._id)
      const votes = await ReviewVote.find({ user: req.user._id, review: { $in: reviewIds } })
      votesMap = Object.fromEntries(votes.map((v) => [String(v.review), v.vote]))

      const ownReview = await Review.findOne({ movie: req.params.id, user: req.user._id }).populate('user', 'username email')
      if (ownReview) {
        const ownVote = (await ReviewVote.findOne({ review: ownReview._id, user: req.user._id }))?.vote ?? null
        myReview = toReviewDTO(ownReview, ownVote)
      }
    }

    const totalPages = Math.ceil(count / pageSize)

    res.json({
      count,
      next: page < totalPages ? String(page + 1) : null,
      previous: page > 1 ? String(page - 1) : null,
      results: reviews.map((r) => toReviewDTO(r, votesMap[String(r._id)] ?? null)),
      ...(req.user != null && { my_review: myReview }),
    })
  } catch (err) { next(err) }
})

router.post('/movies/:id/reviews/', authenticate, async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) throw new AppError('Filme não encontrado', 404, 'RESOURCE_NOT_FOUND')
    if (movie.status === 'em_breve') throw new AppError('Não é possível avaliar um filme que ainda não foi lançado', 422)

    const rating = Number(req.body.rating)
    if (!rating || rating < 0.5 || rating > 5) throw new AppError('Avaliação deve ser entre 0.5 e 5', 422)
    const normalizedRating = Math.round(rating * 2) / 2

    const review = await Review.findOneAndUpdate(
      { movie: req.params.id, user: req.user._id },
      { rating: normalizedRating, comment: req.body.comment ?? '' },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'username email')

    res.status(201).json(toReviewDTO(review))
  } catch (err) { next(err) }
})

router.patch('/movies/:id/reviews/:reviewId/', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId).populate('user', 'username email')
    if (!review) throw new AppError('Avaliação não encontrada', 404)
    if (String(review.user._id) !== String(req.user._id) && !['staff', 'master'].includes(req.user.role)) {
      throw new AppError('Não autorizado', 403)
    }

    const update = {}
    if (req.body.rating !== undefined) update.rating = Math.round(Number(req.body.rating) * 2) / 2
    if (req.body.comment !== undefined) update.comment = req.body.comment

    const updated = await Review.findByIdAndUpdate(req.params.reviewId, update, { new: true, runValidators: true })
      .populate('user', 'username email')

    const vote = await ReviewVote.findOne({ review: updated._id, user: req.user._id })
    res.json(toReviewDTO(updated, vote?.vote ?? null))
  } catch (err) { next(err) }
})

router.delete('/movies/:id/reviews/:reviewId/', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId)
    if (!review) throw new AppError('Avaliação não encontrada', 404)
    if (String(review.user) !== String(req.user._id) && !['staff', 'master'].includes(req.user.role)) {
      throw new AppError('Não autorizado', 403)
    }

    await review.deleteOne()
    await ReviewVote.deleteMany({ review: review._id })

    res.status(204).send()
  } catch (err) { next(err) }
})

router.post('/movies/:id/reviews/:reviewId/vote/', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId)
    if (!review) throw new AppError('Avaliação não encontrada', 404)

    const { vote } = req.body
    if (!['like', 'dislike'].includes(vote)) throw new AppError('Voto inválido: use "like" ou "dislike"', 422)

    const existing = await ReviewVote.findOne({ review: review._id, user: req.user._id })

    if (existing) {
      const oldVote = existing.vote
      if (oldVote !== vote) {
        existing.vote = vote
        await existing.save()
        await Review.findByIdAndUpdate(review._id, {
          $inc: {
            [oldVote === 'like' ? 'likeCount' : 'dislikeCount']: -1,
            [vote === 'like' ? 'likeCount' : 'dislikeCount']: 1,
          },
        })
      }
    } else {
      await ReviewVote.create({ review: review._id, user: req.user._id, vote })
      await Review.findByIdAndUpdate(review._id, {
        $inc: { [vote === 'like' ? 'likeCount' : 'dislikeCount']: 1 },
      })
    }

    res.json({ vote })
  } catch (err) { next(err) }
})

router.delete('/movies/:id/reviews/:reviewId/vote/', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId)
    if (!review) throw new AppError('Avaliação não encontrada', 404)

    const existing = await ReviewVote.findOneAndDelete({ review: review._id, user: req.user._id })
    if (existing) {
      await Review.findByIdAndUpdate(review._id, {
        $inc: { [existing.vote === 'like' ? 'likeCount' : 'dislikeCount']: -1 },
      })
    }

    res.status(204).send()
  } catch (err) { next(err) }
})

// ── GENRES ───────────────────────────────────────────────────────────────────

router.get('/genres', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' }
    const q = Genre.find(filter).sort('name')
    const result = await paginate(q, req.query, req)
    res.json({ ...result, results: result.results.map((g) => toGenreDTO(g, req.locale, req.query.include_translations === 'true')) })
  } catch (err) { next(err) }
})

router.post('/genres', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const genreData = { name: req.body.name }
    if (req.body.translations) genreData.translations = req.body.translations

    const sourceLanguage = req.body.source_language
    if (sourceLanguage && req.body.name) {
      const translated = await translateToAllLocales(req.body.name, sourceLanguage)
      if (Object.keys(translated).length > 1) {
        genreData.name = translated[DEFAULT_LOCALE] ?? req.body.name
        genreData.translations = Object.fromEntries(
          Object.entries(translated)
            .filter(([loc]) => loc !== DEFAULT_LOCALE)
            .map(([loc, text]) => [loc, { name: text }])
        )
      }
    }

    const genre = await Genre.create(genreData)
    res.status(201).json(toGenreDTO(genre, req.locale, req.query.include_translations === 'true'))
  } catch (err) { next(err) }
})

router.patch('/genres/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const update = {}
    if (req.body.name !== undefined) update.name = req.body.name
    if (req.body.translations !== undefined) update.translations = req.body.translations

    const sourceLanguage = req.body.source_language
    if (sourceLanguage && req.body.name) {
      const translated = await translateToAllLocales(req.body.name, sourceLanguage)
      if (Object.keys(translated).length > 1) {
        update.name = translated[DEFAULT_LOCALE] ?? req.body.name
        update.translations = Object.fromEntries(
          Object.entries(translated)
            .filter(([loc]) => loc !== DEFAULT_LOCALE)
            .map(([loc, text]) => [loc, { name: text }])
        )
      }
    }

    const genre = await Genre.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!genre) throw new AppError('Gênero não encontrado', 404, 'RESOURCE_NOT_FOUND')
    res.json(toGenreDTO(genre, req.locale, req.query.include_translations === 'true'))
  } catch (err) { next(err) }
})

router.delete('/genres/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const genre = await Genre.findByIdAndDelete(req.params.id)
    if (!genre) throw new AppError('Gênero não encontrado', 404, 'RESOURCE_NOT_FOUND')
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── ROOMS ─────────────────────────────────────────────────────────────────────

async function applyRoomDisplayNameTranslation(data, sourceLanguage) {
  const translated = await translateToAllLocales(data.displayName, sourceLanguage)
  if (Object.keys(translated).length <= 1) return

  if (sourceLanguage !== DEFAULT_LOCALE && translated[DEFAULT_LOCALE]) {
    data.displayName = translated[DEFAULT_LOCALE]
  }

  const existingTranslations = data.translations ? { ...data.translations } : {}
  for (const [loc, text] of Object.entries(translated)) {
    if (loc === DEFAULT_LOCALE) continue
    existingTranslations[loc] = { ...(existingTranslations[loc] ?? {}), display_name: text }
  }
  data.translations = existingTranslations
}

router.get('/rooms', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' }
    const q = Room.find(filter).sort('name')
    const result = await paginate(q, req.query, req)
    res.json({ ...result, results: result.results.map((r) => toRoomDTO(r, req.locale, req.query.include_translations === 'true')) })
  } catch (err) { next(err) }
})

router.get('/rooms/:id', async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) throw new AppError('Sala não encontrada', 404, 'RESOURCE_NOT_FOUND')
    res.json(toRoomDTO(room, req.locale, req.query.include_translations === 'true'))
  } catch (err) { next(err) }
})

router.post('/rooms', authenticate, authorize('master'), async (req, res, next) => {
  try {
    const data = roomFromPayload(req.body)
    const sourceLanguage = req.body.source_language
    if (sourceLanguage && data.displayName) {
      await applyRoomDisplayNameTranslation(data, sourceLanguage)
    }
    const room = await Room.create(data)
    res.status(201).json(toRoomDTO(room, req.locale, req.query.include_translations === 'true'))
  } catch (err) { next(err) }
})

router.patch('/rooms/:id', authenticate, authorize('master'), async (req, res, next) => {
  try {
    const data = roomFromPayload(req.body)
    const sourceLanguage = req.body.source_language
    if (sourceLanguage && data.displayName) {
      await applyRoomDisplayNameTranslation(data, sourceLanguage)
    }
    const room = await Room.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    if (!room) throw new AppError('Sala não encontrada', 404, 'RESOURCE_NOT_FOUND')
    res.json(toRoomDTO(room, req.locale, req.query.include_translations === 'true'))
  } catch (err) { next(err) }
})

router.delete('/rooms/:id', authenticate, authorize('master'), async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id)
    if (!room) throw new AppError('Sala não encontrada', 404, 'RESOURCE_NOT_FOUND')
    res.status(204).send()
  } catch (err) { next(err) }
})

function roomFromPayload(body) {
  const data = {}
  if (body.name !== undefined) data.name = body.name
  if (body.capacity !== undefined) data.capacity = body.capacity
  if (body.experience_type !== undefined) data.experienceType = body.experience_type
  if (body.display_name !== undefined) data.displayName = body.display_name
  if (body.description !== undefined) data.description = body.description
  if (body.base_price !== undefined) data.basePrice = parseFloat(body.base_price)
  if (body.translations !== undefined) data.translations = body.translations
  if (body.accessible_row_index !== undefined) data.accessibleRowIndex = body.accessible_row_index
  if (body.max_center_seats_per_row !== undefined) data.maxCenterSeatsPerRow = body.max_center_seats_per_row
  return data
}

// ── ROOM TYPE PRICING (stub) ──────────────────────────────────────────────────

router.get('/room-type-pricing', authenticate, async (req, res, next) => {
  try {
    const types = ['standard', 'vip', 'premium', 'imax']
    const rooms = await Room.find()
    const pricingMap = {}
    for (const room of rooms) {
      if (room.experienceType && !pricingMap[room.experienceType]) {
        pricingMap[room.experienceType] = room.basePrice
      }
    }
    const result = types.map((type, idx) => ({
      id: idx + 1,
      experience_type: type,
      base_price: Number(pricingMap[type] ?? 0).toFixed(2),
      updated_at: new Date().toISOString(),
    }))
    res.json(result)
  } catch (err) { next(err) }
})

router.patch('/room-type-pricing/:id', authenticate, authorize('master'), async (req, res, next) => {
  try {
    const types = ['standard', 'vip', 'premium', 'imax']
    const idx = parseInt(req.params.id) - 1
    const experienceType = types[idx]
    if (!experienceType) throw new AppError('Tipo não encontrado', 404)
    if (req.body.base_price) {
      await Room.updateMany({ experienceType }, { basePrice: parseFloat(req.body.base_price) })
    }
    res.json({
      id: idx + 1,
      experience_type: experienceType,
      base_price: req.body.base_price,
      updated_at: new Date().toISOString(),
    })
  } catch (err) { next(err) }
})

// ── SESSIONS ─────────────────────────────────────────────────────────────────

router.get('/sessions', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.movie) filter.movie = req.query.movie
    if (req.query.room) filter.room = req.query.room
    if (req.query.experience_type) {
      const matchingRooms = await Room.find({ experienceType: req.query.experience_type }, '_id')
      filter.room = { $in: matchingRooms.map((r) => r._id) }
    }
    if (req.query.date) {
      // Sessions are stored in UTC. America/Fortaleza is UTC-3 (no DST), so BRT midnight = UTC 03:00.
      // Using UTC-day boundaries would misassign sessions at 21:00–23:59 BRT (00:00–02:59 UTC next day).
      const [y, m, d] = req.query.date.split('-').map(Number)
      const dayStart = new Date(Date.UTC(y, m - 1, d, 3, 0, 0))
      const dayEnd   = new Date(Date.UTC(y, m - 1, d + 1, 3, 0, 0))
      filter.startTime = { $gte: dayStart, $lt: dayEnd }
    }
    if (req.query.start_from) filter.startTime = { ...filter.startTime, $gte: new Date(req.query.start_from) }
    if (req.query.start_to) filter.startTime = { ...filter.startTime, $lte: new Date(req.query.start_to) }

    const q = Session.find(filter)
      .populate({ path: 'movie', populate: { path: 'genres', select: 'name translations' } })
      .populate('room')
      .sort('startTime')

    const result = await paginate(q, req.query, req)
    res.json({ ...result, results: result.results.map((s) => toSessionDTO(s, req.locale)) })
  } catch (err) { next(err) }
})

router.get('/sessions/:id', async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({ path: 'movie', populate: { path: 'genres', select: 'name translations' } })
      .populate('room')
    if (!session) throw new AppError('Sessão não encontrada', 404, 'RESOURCE_NOT_FOUND')
    const layoutHints = session.room ? await computeRoomLayoutHints(session.room) : {}
    res.json(toSessionDTO(session, req.locale, layoutHints))
  } catch (err) { next(err) }
})

router.post('/sessions', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const data = sessionFromPayload(req.body)
    const room = await Room.findById(data.room)
    if (!room) throw new AppError('Sala não encontrada', 404)
    if (!data.basePrice) data.basePrice = room.basePrice

    const baseStart = new Date(data.startTime)
    const baseEnd = new Date(data.endTime)
    if (baseEnd <= baseStart) throw new AppError('end_time deve ser posterior a start_time', 422)

    const duration = baseEnd.getTime() - baseStart.getTime()
    const startHours = baseStart.getUTCHours()
    const startMinutes = baseStart.getUTCMinutes()

    const rawExtraDates = Array.isArray(req.body.extra_dates)
      ? req.body.extra_dates.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
      : []

    const allSlots = [
      { startTime: baseStart, endTime: baseEnd },
      ...rawExtraDates.map((dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const s = new Date(Date.UTC(y, m - 1, d, startHours, startMinutes, 0))
        return { startTime: s, endTime: new Date(s.getTime() + duration) }
      }),
    ]

    for (const { startTime, endTime } of allSlots) {
      const overlap = await Session.findOne({
        room: data.room,
        $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
      })
      if (overlap) {
        const dateStr = startTime.toISOString().slice(0, 10)
        throw new AppError(`Já existe uma sessão nesta sala no horário do dia ${dateStr}`, 422)
      }
    }

    if (allSlots.length === 1) {
      const session = await Session.create(data)
      await session.populate([{ path: 'movie', populate: { path: 'genres', select: 'name translations' } }, { path: 'room' }])
      await generateSessionSeats(session)
      return res.status(201).json(toSessionDTO(session, req.locale))
    }

    const created = await Promise.all(
      allSlots.map(({ startTime, endTime }) => Session.create({ ...data, startTime, endTime }))
    )
    for (const s of created) {
      await s.populate([{ path: 'movie', populate: { path: 'genres', select: 'name translations' } }, { path: 'room' }])
      await generateSessionSeats(s)
    }

    res.status(201).json({ sessions: created.map((s) => toSessionDTO(s, req.locale)), count: created.length })
  } catch (err) { next(err) }
})

router.patch('/sessions/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const data = sessionFromPayload(req.body)
    const existing = await Session.findById(req.params.id)
    if (!existing) throw new AppError('Sessão não encontrada', 404)

    const start = data.startTime ? new Date(data.startTime) : existing.startTime
    const end = data.endTime ? new Date(data.endTime) : existing.endTime
    if (end <= start) throw new AppError('end_time deve ser posterior a start_time', 422)

    const roomId = data.room || existing.room
    const overlap = await Session.findOne({
      _id: { $ne: req.params.id },
      room: roomId,
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    })
    if (overlap) throw new AppError('Já existe uma sessão nesta sala neste horário', 422)

    const session = await Session.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate([{ path: 'movie', populate: { path: 'genres', select: 'name translations' } }, { path: 'room' }])
    res.json(toSessionDTO(session, req.locale))
  } catch (err) { next(err) }
})

router.delete('/sessions/:id', authenticate, authorize('staff', 'master'), async (req, res, next) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id)
    if (!session) throw new AppError('Sessão não encontrada', 404)
    res.status(204).send()
  } catch (err) { next(err) }
})

function sessionFromPayload(body) {
  const data = {}
  if (body.movie !== undefined) data.movie = body.movie
  if (body.room !== undefined) data.room = body.room
  if (body.start_time !== undefined) data.startTime = body.start_time
  if (body.end_time !== undefined) data.endTime = body.end_time
  if (body.base_price !== undefined) data.basePrice = parseFloat(body.base_price)
  if (body.audio_format !== undefined) data.audioFormat = body.audio_format
  if (body.projection_format !== undefined) data.projectionFormat = body.projection_format
  if (body.session_type !== undefined) data.sessionType = body.session_type
  return data
}

async function generateSessionSeats(session) {
  try {
    const { default: SeatRow } = await import('../models/SeatRow.js')
    const { default: Seat } = await import('../models/Seat.js')
    const { default: SessionSeat } = await import('../models/SessionSeat.js')

    const rows = await SeatRow.find({ room: session.room })
    if (rows.length === 0) return

    const seats = await Seat.find({ row: { $in: rows.map((r) => r._id) } })
    if (seats.length === 0) return

    const sessionSeats = seats.map((seat) => ({ session: session._id, seat: seat._id }))
    await SessionSeat.insertMany(sessionSeats, { ordered: false }).catch(() => {})
  } catch {
    // Non-fatal: seats may not exist for room yet
  }
}

export default router

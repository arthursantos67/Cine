import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import catalogRoutes from './catalog.routes.js'
import reservationRoutes from './reservation.routes.js'
import reservationsRoutes from './reservations.routes.js'
import internalRoutes from './internal.routes.js'
import genreRoutes from './genre.routes.js'
import movieRoutes from './movie.routes.js'
import roomRoutes from './room.routes.js'
import sessionRoutes from './session.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)

// Rotas no formato que o frontend espera
router.use('/catalog', catalogRoutes)
router.use('/reservation', reservationRoutes)

// CRUD de Reservas (modelo canônico do planejamento)
router.use('/reservations', reservationsRoutes)

// Comunicação interna servidor-a-servidor (Next.js → backend)
router.use('/internal', internalRoutes)

// Rotas legadas (mantidas para compatibilidade)
router.use('/genres', genreRoutes)
router.use('/movies', movieRoutes)
router.use('/rooms', roomRoutes)
router.use('/sessions', sessionRoutes)

export default router

import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import catalogRoutes from './catalog.routes.js'
import reservationRoutes from './reservation.routes.js'
import reservationsRoutes from './reservations.routes.js'
import internalRoutes from './internal.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/catalog', catalogRoutes)
router.use('/reservation', reservationRoutes)
router.use('/reservations', reservationsRoutes)
router.use('/internal', internalRoutes)

export default router

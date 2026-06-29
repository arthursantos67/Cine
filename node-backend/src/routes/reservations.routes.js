import { Router } from 'express'
import { reservationController } from '../controllers/reservation.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { createReservationSchema, checkoutSchema } from '../validators/reservation.validator.js'

const router = Router()

router.use(authenticate)

router.get('/me', reservationController.listMine)
router.post('/', validate(createReservationSchema), reservationController.create)
router.post('/checkout', validate(checkoutSchema), reservationController.checkout)
router.get('/:id', reservationController.getById)
router.delete('/:id', reservationController.cancel)

router.get('/', authorize('master'), reservationController.listAll)

export default router

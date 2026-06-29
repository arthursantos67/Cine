import { Router } from 'express'
import { movieController } from '../controllers/movie.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { createMovieSchema, updateMovieSchema } from '../validators/movie.validator.js'

const router = Router()

router.get('/', movieController.list)
router.get('/:id', movieController.getById)
router.post('/', authenticate, authorize('staff', 'master'), validate(createMovieSchema), movieController.create)
router.put('/:id', authenticate, authorize('staff', 'master'), validate(updateMovieSchema), movieController.update)
router.delete('/:id', authenticate, authorize('staff', 'master'), movieController.delete)

export default router

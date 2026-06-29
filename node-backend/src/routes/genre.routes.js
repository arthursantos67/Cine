import { Router } from 'express'
import { genreController } from '../controllers/genre.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { createGenreSchema, updateGenreSchema } from '../validators/genre.validator.js'

const router = Router()

router.get('/', genreController.list)
router.get('/:id', genreController.getById)
router.post('/', authenticate, authorize('staff', 'master'), validate(createGenreSchema), genreController.create)
router.put('/:id', authenticate, authorize('staff', 'master'), validate(updateGenreSchema), genreController.update)
router.delete('/:id', authenticate, authorize('staff', 'master'), genreController.delete)

export default router

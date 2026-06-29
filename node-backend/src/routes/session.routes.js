import { Router } from 'express'
import { sessionController } from '../controllers/session.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { createSessionSchema, updateSessionSchema } from '../validators/session.validator.js'

const router = Router()

router.get('/', sessionController.list)
router.get('/:id', sessionController.getById)
router.post('/', authenticate, authorize('staff', 'master'), validate(createSessionSchema), sessionController.create)
router.put('/:id', authenticate, authorize('staff', 'master'), validate(updateSessionSchema), sessionController.update)
router.delete('/:id', authenticate, authorize('staff', 'master'), sessionController.delete)

export default router

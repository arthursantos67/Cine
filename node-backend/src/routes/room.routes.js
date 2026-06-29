import { Router } from 'express'
import { roomController } from '../controllers/room.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { createRoomSchema, updateRoomSchema } from '../validators/room.validator.js'

const router = Router()

router.get('/', roomController.list)
router.get('/:id', roomController.getById)
router.post('/', authenticate, authorize('master'), validate(createRoomSchema), roomController.create)
router.put('/:id', authenticate, authorize('master'), validate(updateRoomSchema), roomController.update)
router.delete('/:id', authenticate, authorize('master'), roomController.delete)

export default router

import { Router } from 'express'
import { userController } from '../controllers/user.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { updateMeSchema } from '../validators/user.validator.js'

const router = Router()

router.use(authenticate)

router.get('/me', userController.getMe)
router.put('/me', validate(updateMeSchema), userController.updateMe)
router.delete('/me', userController.deleteMe)
router.get('/me/tickets', userController.listMyTickets)

router.get('/config/tmdb-token', authorize('staff', 'master'), userController.getTmdbTokenStatus)
router.put('/config/tmdb-token', authorize('master'), userController.setTmdbToken)

router.get('/', authorize('staff', 'master'), userController.listAll)
router.post('/:id/admin', authorize('master'), userController.grantAdmin)
router.delete('/:id/admin', authorize('master'), userController.revokeAdmin)
router.get('/:id/admin/logs', authorize('master'), userController.getAdminLogs)
router.post('/:id/primary-master', authorize('master'), userController.transferPrimaryMaster)
router.delete('/:id', authorize('master'), userController.deleteById)

export default router

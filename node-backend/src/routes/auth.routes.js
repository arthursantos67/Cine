import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authController } from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.middleware.js'
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'THROTTLED', message: 'Too many login attempts', status: 429, details: {} } },
})

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', loginLimiter, validate(loginSchema), authController.login)
// Frontend chama /token/refresh/ (Django SimpleJWT convention)
router.post('/token/refresh', validate(refreshSchema), authController.refresh)
// Alias legado
router.post('/refresh', validate(refreshSchema), authController.refresh)

export default router

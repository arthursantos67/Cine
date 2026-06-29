import { authService } from '../services/auth.service.js'
import { toUserDTO } from '../dtos/user.dto.js'

export const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.validatedBody)
      res.status(201).json(toUserDTO(user))
    } catch (err) {
      next(err)
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.validatedBody
      const { accessToken, refreshToken } = await authService.login(email, password)
      res.json({ access: accessToken, refresh: refreshToken })
    } catch (err) {
      next(err)
    }
  },

  async refresh(req, res, next) {
    try {
      const token = req.validatedBody.refresh || req.validatedBody.refreshToken
      const { accessToken } = await authService.refresh(token)
      res.json({ access: accessToken })
    } catch (err) {
      next(err)
    }
  },
}

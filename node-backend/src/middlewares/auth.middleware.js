import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/user.repository.js'
import { AppError } from './error.middleware.js'

export async function authenticateOptional(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      req.user = null
      return next()
    }
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userRepository.findById(payload.id)
    req.user = user?.isActive ? user : null
  } catch {
    req.user = null
  }
  next()
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Token de autenticação ausente', 401)
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const user = await userRepository.findById(payload.id)
    if (!user || !user.isActive) throw new AppError('Usuário não encontrado ou inativo', 401)

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/user.repository.js'
import { AppError } from '../middlewares/error.middleware.js'

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })
}

function signRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })
}

export const authService = {
  async register(data) {
    const emailExists = await userRepository.existsByEmail(data.email)
    if (emailExists) throw new AppError('Email já cadastrado', 409)

    const usernameExists = await userRepository.existsByUsername(data.username)
    if (usernameExists) throw new AppError('Username já em uso', 409)

    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Primeiro usuário do banco vira master automaticamente
    const isFirstUser = (await userRepository.countAll()) === 0
    const role = isFirstUser ? 'master' : 'user'

    const user = await userRepository.create({ ...data, password: hashedPassword, role, isPrimaryMaster: isFirstUser })
    return user
  },

  async login(email, password) {
    const user = await userRepository.findByEmail(email)
    if (!user || !user.isActive) throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS')

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS')

    const accessToken = signAccessToken(user._id)
    const refreshToken = signRefreshToken(user._id)
    return { accessToken, refreshToken, user }
  },

  async refresh(token) {
    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch {
      throw new AppError('Refresh token inválido ou expirado', 401)
    }

    const user = await userRepository.findById(payload.id)
    if (!user || !user.isActive) throw new AppError('Usuário não encontrado', 401)

    const accessToken = signAccessToken(user._id)
    return { accessToken }
  },
}

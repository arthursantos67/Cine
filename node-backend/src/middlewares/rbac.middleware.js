import { AppError } from './error.middleware.js'

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Não autenticado', 401))
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Sem permissão para acessar este recurso', 403))
    }
    next()
  }
}

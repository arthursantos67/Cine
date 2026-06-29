import { AppError } from './error.middleware.js'

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return next(
        Object.assign(new AppError('Dados de entrada inválidos', 400), { errors })
      )
    }
    req.validatedBody = result.data
    next()
  }
}

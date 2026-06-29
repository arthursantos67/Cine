export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

function httpCodeToErrorCode(status) {
  if (status === 400) return 'VALIDATION_FAILED'
  if (status === 401) return 'NOT_AUTHENTICATED'
  if (status === 403) return 'PERMISSION_DENIED'
  if (status === 404) return 'RESOURCE_NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 422) return 'UNPROCESSABLE'
  if (status === 429) return 'THROTTLED'
  return 'INTERNAL_SERVER_ERROR'
}

export function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Erro interno do servidor'
  let code = err.code || httpCodeToErrorCode(statusCode)
  let details = {}

  if (err.name === 'ValidationError') {
    statusCode = 400
    code = 'VALIDATION_FAILED'
    message = 'Dados inválidos'
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    )
  }

  if (err.name === 'CastError') {
    statusCode = 400
    code = 'VALIDATION_FAILED'
    message = `ID inválido: ${err.value}`
  }

  if (err.code === 11000) {
    statusCode = 409
    code = 'CONFLICT'
    const field = Object.keys(err.keyValue)[0]
    message = `Valor duplicado para o campo: ${field}`
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 'NOT_AUTHENTICATED'
    message = 'Token inválido'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    code = 'NOT_AUTHENTICATED'
    message = 'Token expirado'
  }

  if (err.errors && Array.isArray(err.errors)) {
    details = { fields: err.errors }
  }

  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    console.error(err)
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      status: statusCode,
      details,
    },
  })
}

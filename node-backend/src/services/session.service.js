import { sessionRepository } from '../repositories/session.repository.js'
import { roomRepository } from '../repositories/room.repository.js'
import { movieRepository } from '../repositories/movie.repository.js'
import { AppError } from '../middlewares/error.middleware.js'

export const sessionService = {
  async list(filter = {}) {
    return sessionRepository.findAll(filter)
  },

  async getById(id) {
    const session = await sessionRepository.findById(id)
    if (!session) throw new AppError('Sessão não encontrada', 404)
    return session
  },

  async create(data) {
    const room = await roomRepository.findById(data.room)
    if (!room) throw new AppError('Sala não encontrada', 404)

    const movie = await movieRepository.findById(data.movie)
    if (!movie) throw new AppError('Filme não encontrado', 404)

    const start = new Date(data.startTime)
    const end = new Date(data.endTime)
    if (end <= start) throw new AppError('endTime deve ser posterior a startTime', 422)

    const repeatDays = data.repeatDays ?? 0
    const MS_PER_DAY = 86_400_000

    const sessionDates = Array.from({ length: repeatDays + 1 }, (_, i) => ({
      startTime: new Date(start.getTime() + i * MS_PER_DAY),
      endTime: new Date(end.getTime() + i * MS_PER_DAY),
    }))

    for (const { startTime, endTime } of sessionDates) {
      const overlap = await sessionRepository.findOverlapping(data.room, startTime, endTime)
      if (overlap) {
        const dateStr = startTime.toISOString().slice(0, 10)
        throw new AppError(`Já existe uma sessão nesta sala no horário do dia ${dateStr}`, 422)
      }
    }

    const { repeatDays: _ignored, ...sessionBase } = data

    if (sessionDates.length === 1) {
      return sessionRepository.create(sessionBase)
    }

    const created = await Promise.all(
      sessionDates.map(({ startTime, endTime }) =>
        sessionRepository.create({ ...sessionBase, startTime, endTime })
      )
    )
    return created
  },

  async update(id, data) {
    const existing = await sessionRepository.findById(id)
    if (!existing) throw new AppError('Sessão não encontrada', 404)

    const start = data.startTime ? new Date(data.startTime) : existing.startTime
    const end = data.endTime ? new Date(data.endTime) : existing.endTime
    if (end <= start) throw new AppError('endTime deve ser posterior a startTime', 422)

    const roomId = data.room || existing.room._id
    const overlap = await sessionRepository.findOverlapping(roomId, start, end, id)
    if (overlap) throw new AppError('Já existe uma sessão nesta sala neste horário', 422)

    const session = await sessionRepository.updateById(id, data)
    return session
  },

  async delete(id) {
    const session = await sessionRepository.deleteById(id)
    if (!session) throw new AppError('Sessão não encontrada', 404)
  },
}

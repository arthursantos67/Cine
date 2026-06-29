import { roomRepository } from '../repositories/room.repository.js'
import { AppError } from '../middlewares/error.middleware.js'

export const roomService = {
  async list() {
    return roomRepository.findAll()
  },

  async getById(id) {
    const room = await roomRepository.findById(id)
    if (!room) throw new AppError('Sala não encontrada', 404)
    return room
  },

  async create(data) {
    return roomRepository.create(data)
  },

  async update(id, data) {
    const room = await roomRepository.updateById(id, data)
    if (!room) throw new AppError('Sala não encontrada', 404)
    return room
  },

  async delete(id) {
    const room = await roomRepository.deleteById(id)
    if (!room) throw new AppError('Sala não encontrada', 404)
  },
}

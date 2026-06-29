import Room from '../models/Room.js'

export const roomRepository = {
  findAll: () => Room.find().sort('name'),
  findById: (id) => Room.findById(id),
  create: (data) => Room.create(data),
  updateById: (id, data) => Room.findByIdAndUpdate(id, data, { new: true, runValidators: true }),
  deleteById: (id) => Room.findByIdAndDelete(id),
}

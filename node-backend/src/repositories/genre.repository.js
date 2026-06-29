import Genre from '../models/Genre.js'

export const genreRepository = {
  findAll: () => Genre.find().sort('name'),
  findById: (id) => Genre.findById(id),
  create: (data) => Genre.create(data),
  updateById: (id, data) => Genre.findByIdAndUpdate(id, data, { new: true, runValidators: true }),
  deleteById: (id) => Genre.findByIdAndDelete(id),
}

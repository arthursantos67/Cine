import Movie from '../models/Movie.js'

export const movieRepository = {
  findAll: (filter = {}) => Movie.find(filter).populate('genres', 'name').sort('-createdAt'),
  findById: (id) => Movie.findById(id).populate('genres', 'name'),
  create: (data) => Movie.create(data),
  updateById: (id, data) =>
    Movie.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('genres', 'name'),
  deleteById: (id) => Movie.findByIdAndDelete(id),
}

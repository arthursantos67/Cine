import User from '../models/User.js'

export const userRepository = {
  findByEmail: (email) => User.findOne({ email }).select('+password'),
  findById: (id) => User.findById(id),
  findAll: () => User.find(),
  create: (data) => User.create(data),
  updateById: (id, data) => User.findByIdAndUpdate(id, data, { new: true, runValidators: true }),
  deleteById: (id) => User.findByIdAndDelete(id),
  existsByEmail: (email) => User.exists({ email }),
  existsByUsername: (username) => User.exists({ username }),
  countAll: () => User.countDocuments(),
}

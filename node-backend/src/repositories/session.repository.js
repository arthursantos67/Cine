import Session from '../models/Session.js'

export const sessionRepository = {
  findAll: (filter = {}) =>
    Session.find(filter)
      .populate('movie', 'title posterUrl durationMin')
      .populate('room', 'name experienceType')
      .sort('startTime'),
  findById: (id) =>
    Session.findById(id)
      .populate('movie', 'title posterUrl durationMin synopsis')
      .populate('room', 'name experienceType capacity'),
  create: (data) => Session.create(data),
  updateById: (id, data) =>
    Session.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('movie', 'title')
      .populate('room', 'name'),
  deleteById: (id) => Session.findByIdAndDelete(id),
  findOverlapping: (roomId, startTime, endTime, excludeId = null) => {
    const query = {
      room: roomId,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    }
    if (excludeId) query._id = { $ne: excludeId }
    return Session.findOne(query)
  },
}

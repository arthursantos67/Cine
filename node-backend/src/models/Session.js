import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    basePrice: { type: Number, min: 0.01 },
    audioFormat: { type: String, enum: ['original', 'legendado', 'dublado'] },
    projectionFormat: { type: String, enum: ['2d', '3d', 'imax'] },
    sessionType: { type: String, enum: ['regular', 'preview', 'special_event'], default: 'regular' },
  },
  { timestamps: true }
)

sessionSchema.pre('validate', function (next) {
  if (this.endTime && this.startTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'endTime deve ser posterior a startTime')
  }
  next()
})

export default mongoose.model('Session', sessionSchema)

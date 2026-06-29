import mongoose from 'mongoose'

const sessionSeatSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
    status: { type: String, enum: ['AVAILABLE', 'RESERVED', 'PURCHASED'], default: 'AVAILABLE' },
    reserved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lock_expires_at: { type: Date, default: null },
  },
  { timestamps: true }
)

sessionSeatSchema.index({ session: 1, seat: 1 }, { unique: true })

export default mongoose.model('SessionSeat', sessionSeatSchema)

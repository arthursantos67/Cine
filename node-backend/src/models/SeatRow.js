import mongoose from 'mongoose'

const seatRowSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    name: { type: String, required: true },
    is_accessible_row: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('SeatRow', seatRowSchema)

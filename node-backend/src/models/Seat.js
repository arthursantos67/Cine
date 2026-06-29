import mongoose from 'mongoose'

const seatSchema = new mongoose.Schema(
  {
    row: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatRow', required: true },
    number: { type: Number, required: true },
    is_accessible: { type: Boolean, default: false },
    companion_seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', default: null },
  },
  { timestamps: true }
)

seatSchema.index({ row: 1, number: 1 }, { unique: true })

export default mongoose.model('Seat', seatSchema)

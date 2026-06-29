import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    seatLabel: { type: String, required: true },
    status: {
      type: String,
      enum: ['reserved', 'purchased', 'cancelled'],
      default: 'reserved',
    },
    ticketType: {
      type: String,
      enum: ['inteira', 'meia', 'gratuito'],
      default: 'inteira',
    },
    amountPaid: { type: Number },
    paymentMethod: { type: String, enum: ['cartao_credito', 'pix'] },
    ticketCode: { type: String, unique: true, default: () => randomUUID() },
    expiresAt: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model('Reservation', reservationSchema)

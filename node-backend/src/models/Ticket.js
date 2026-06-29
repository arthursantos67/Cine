import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

const ticketSchema = new mongoose.Schema(
  {
    session_seat: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionSeat', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticket_type: { type: String, enum: ['inteira', 'meia', 'gratuito'], default: 'inteira' },
    amount_paid: { type: Number, required: true },
    payment_method: { type: String, enum: ['cartao_credito', 'pix'], required: true },
    ticket_code: { type: String, unique: true, default: () => randomUUID() },
  },
  { timestamps: true }
)

export default mongoose.model('Ticket', ticketSchema)

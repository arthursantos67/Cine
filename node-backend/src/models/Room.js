import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    experienceType: {
      type: String,
      enum: ['standard', 'vip', 'premium', 'imax'],
      default: 'standard',
    },
    basePrice: { type: Number, default: 0, min: 0 },
    displayName: { type: String, default: null },
    description: { type: String, default: null },
    translations: { type: mongoose.Schema.Types.Mixed, default: {} },
    accessibleRowIndex: { type: Number, default: 0 },
    maxCenterSeatsPerRow: { type: Number, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('Room', roomSchema)

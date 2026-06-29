import mongoose from 'mongoose'

const adminLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorUsername: { type: String, required: true },
    targetId: { type: String, required: true },
    targetUsername: { type: String, required: true },
    action: { type: String, enum: ['granted', 'revoked', 'deleted'], required: true },
    role: { type: String, enum: ['staff', 'master', null], default: null },
  },
  { timestamps: true }
)

adminLogSchema.index({ targetId: 1, createdAt: -1 })
adminLogSchema.index({ actorId: 1, createdAt: -1 })

export default mongoose.model('AdminLog', adminLogSchema)

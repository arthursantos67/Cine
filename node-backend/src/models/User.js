import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'staff', 'master'], default: 'user' },
    isPrimaryMaster: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)

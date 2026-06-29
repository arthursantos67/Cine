import mongoose from 'mongoose'

const genreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export default mongoose.model('Genre', genreSchema)

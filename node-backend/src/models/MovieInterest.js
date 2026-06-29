import mongoose from 'mongoose'

const movieInterestSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

movieInterestSchema.index({ movie: 1, user: 1 }, { unique: true })

export default mongoose.model('MovieInterest', movieInterestSchema)

import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 0.5, max: 5 },
    comment: { type: String, default: '' },
    likeCount: { type: Number, default: 0, min: 0 },
    dislikeCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

reviewSchema.index({ movie: 1, user: 1 }, { unique: true })
reviewSchema.index({ movie: 1, createdAt: -1 })

export default mongoose.model('Review', reviewSchema)

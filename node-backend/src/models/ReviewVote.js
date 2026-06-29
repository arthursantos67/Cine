import mongoose from 'mongoose'

const reviewVoteSchema = new mongoose.Schema(
  {
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vote: { type: String, enum: ['like', 'dislike'], required: true },
  },
  { timestamps: true }
)

reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true })

export default mongoose.model('ReviewVote', reviewVoteSchema)

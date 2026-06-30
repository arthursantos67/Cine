import mongoose from 'mongoose'

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    synopsis: { type: String, required: true },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    durationMin: { type: Number, required: true, min: 1 },
    releaseDate: { type: Date, required: true },
    posterUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['em_cartaz', 'pre_venda', 'em_breve'],
      default: 'em_cartaz',
    },
    ageRating: { type: String, enum: ['L', '10', '12', '14', '16', '18'] },
    director: { type: String },
    cast: { type: [String], default: [] },
    spotlightUrl: { type: String, default: null },
    isFeatured: { type: Boolean, default: false },
    translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export default mongoose.model('Movie', movieSchema)

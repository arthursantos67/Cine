import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'
import { cleanupOrphanedContent } from './src/scripts/cleanupOrphanedContent.js'

const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables')
  process.exit(1)
}

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
  })
  .then(async () => {
    console.log('Connected to MongoDB')
    const removed = await cleanupOrphanedContent()
    if (removed.reviews || removed.votes || removed.interests) {
      console.log(
        `Cleanup: removidos ${removed.reviews} avaliações, ${removed.votes} votos e ${removed.interests} interesses órfãos (de contas excluídas)`
      )
    }
    app.listen(PORT, () => {
      console.log(`CinePrime API running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

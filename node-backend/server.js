import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'

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
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`CinePrime API running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

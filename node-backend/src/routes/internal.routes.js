import { Router } from 'express'
import Config from '../models/Config.js'

const router = Router()

function requireInternalKey(req, res, next) {
  const key = process.env.INTERNAL_API_KEY
  if (!key) {
    return res.status(503).json({ error: 'INTERNAL_API_KEY not configured on server' })
  }
  if (req.headers['x-internal-key'] !== key) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.get('/tmdb-token/', requireInternalKey, async (req, res, next) => {
  try {
    const config = await Config.findOne({ key: 'tmdb_token' })
    res.json({ value: config?.value ?? null })
  } catch (err) {
    next(err)
  }
})

export default router

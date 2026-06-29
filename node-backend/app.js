import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import apiRoutes from './src/routes/index.js'
import viewRoutes from './src/routes/view.routes.js'
import { errorMiddleware } from './src/middlewares/error.middleware.js'
import { localeMiddleware } from './src/middlewares/locale.middleware.js'
import { swaggerSpec } from './src/swagger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim())
app.use(cors({ origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins }))
app.use(express.json())
app.use(morgan('dev'))
app.use(localeMiddleware)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'src/templates'))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'CinePrime API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
  })
)

app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.json(swaggerSpec)
})

app.use('/api/v1', apiRoutes)
app.use('/', viewRoutes)

app.use(errorMiddleware)

export default app

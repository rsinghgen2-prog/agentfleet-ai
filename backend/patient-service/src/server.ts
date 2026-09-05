import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'dotenv/config'
import patientRoutes from './routes/patientRoutes.js'
import { pool } from './config/database.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const port = Number(process.env.PORT || 3010)

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return callback(null, true)
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    return callback(null, false)
  },
  credentials: true,
}))
app.use(express.json({ limit: '8mb' }))
app.get('/health', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ status: 'healthy', service: 'patient-service', timestamp: new Date().toISOString() }) } catch { res.status(503).json({ status: 'unhealthy', service: 'patient-service' }) } })
app.use('/api/v1/patients', patientRoutes)
app.use(errorHandler)

app.listen(port, () => console.log(`Patient service listening on ${port}`))
export default app
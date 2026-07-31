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

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '8mb' }))
app.get('/health', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ status: 'healthy', service: 'patient-service', timestamp: new Date().toISOString() }) } catch { res.status(503).json({ status: 'unhealthy', service: 'patient-service' }) } })
app.use('/api/v1/patients', patientRoutes)
app.use(errorHandler)

app.listen(port, () => console.log(`Patient service listening on ${port}`))
export default app
import express from 'express'
import { z } from 'zod'
import { PatientController } from '../controllers/patientController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { tenantMiddleware } from '../middleware/tenantMiddleware.js'
import type { TenantRequest } from '../types.js'
import { pool } from '../config/database.js'
import { quoteIdentifier } from '../utils/sql.js'
import { SupportController } from '../controllers/supportController.js'

const router = express.Router()
const featureTableInitializers = new Map<string, Promise<void>>()
const inventoryCreateInput = z.object({ name: z.string().trim().min(1).max(255), category: z.string().trim().min(1).max(100), quantity: z.coerce.number().int().min(0).default(0), reorderLevel: z.coerce.number().int().min(0).default(0), unit: z.string().trim().min(1).max(50).default('units') })
const inventoryPatchInput = z.object({ name: z.string().trim().min(1).max(255).optional(), category: z.string().trim().min(1).max(100).optional(), quantity: z.coerce.number().int().min(0).optional(), reorderLevel: z.coerce.number().int().min(0).optional(), reorder_level: z.coerce.number().int().min(0).optional(), unit: z.string().trim().min(1).max(50).optional() })

function ensureFeatureTables(s: string) {
  const existing = featureTableInitializers.get(s)
  if (existing) return existing
  const initializer = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.hospital_directory (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, relationship VARCHAR(20) NOT NULL DEFAULT 'partner' CHECK (relationship IN ('own', 'partner')), specialty VARCHAR(160) NOT NULL DEFAULT 'General care', address TEXT NOT NULL DEFAULT '', city VARCHAR(100) NOT NULL DEFAULT '', contact_name VARCHAR(160), contact_phone VARCHAR(50), owner_user_id UUID REFERENCES ${s}.users(id), is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.client_notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), recipient_user_id UUID NOT NULL REFERENCES ${s}.users(id), notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('message', 'email', 'call')), title VARCHAR(200) NOT NULL, body TEXT NOT NULL, customer_name VARCHAR(160), customer_id UUID REFERENCES ${s}.patients(id), is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`DROP TRIGGER IF EXISTS hospital_directory_updated_at ON ${s}.hospital_directory`)
    await pool.query(`CREATE TRIGGER hospital_directory_updated_at BEFORE UPDATE ON ${s}.hospital_directory FOR EACH ROW EXECUTE FUNCTION ${s}.set_updated_at()`)
  })()
  featureTableInitializers.set(s, initializer)
  initializer.catch(() => featureTableInitializers.delete(s))
  return initializer
}

// All routes require authentication and tenant context
router.use(authMiddleware)
router.use(tenantMiddleware)

// Get dashboard data (patients, appointments, stats)
router.get('/dashboard', PatientController.getDashboardData)

// Create new booking (patient + appointment)
router.post('/bookings', PatientController.createBooking)

// Dentist notes
router.get('/notes', PatientController.getDentistNotes)
router.post('/notes', PatientController.createDentistNote)
router.patch('/notes/:id', PatientController.updateDentistNote)
router.put('/notes/:id', PatientController.updateDentistNote)
router.delete('/notes/:id', PatientController.deleteDentistNote)

// Tenant-scoped hospital support chat
router.get('/support/chat', SupportController.getChat)
router.post('/support/conversations', SupportController.createConversation)
router.get('/support/conversations', SupportController.listConversations)
router.get('/support/conversations/:id', SupportController.getConversation)
router.post('/support/conversations/:id/messages', SupportController.sendMessage)

// Patient routes
router.get('/patients', PatientController.getPatients)
router.get('/patients/:id/profile', PatientController.getPatientProfile)
router.post('/patients/:id/prescriptions', PatientController.createPrescription)
router.post('/patients/:id/reports', PatientController.createReport)
router.get('/patients/:id/reports/:reportId/download', PatientController.downloadReport)
router.post('/patients/:id/lab-orders', PatientController.createLabOrder)
router.get('/patients/:id/lab-orders/:orderId/download', PatientController.downloadLabOrder)
router.get('/patients/:id', PatientController.getPatientById)
router.post('/patients', PatientController.createPatient)
router.patch('/patients/:id', PatientController.updatePatient)
router.put('/patients/:id', PatientController.updatePatient)
router.delete('/patients/:id', PatientController.deletePatient)

// Appointment routes
router.get('/appointments', PatientController.getAppointments)
router.get('/appointments/today', PatientController.getTodaysAppointments)
router.get('/appointments/calendar', PatientController.getCalendarAppointments)
router.get('/appointments/:id', PatientController.getAppointmentById)
router.post('/appointments', PatientController.createAppointment)
router.patch('/appointments/:id', PatientController.updateAppointment)
router.put('/appointments/:id', PatientController.updateAppointment)
router.delete('/appointments/:id', PatientController.deleteAppointment)

// Statistics
router.get('/stats/summary', PatientController.getStatsSummary)
router.get('/stats/visits', PatientController.getVisitsStats)

router.get('/settings', async (req: TenantRequest, res, next) => {
  try { const s = quoteIdentifier(req.tenant!.schemaName); const result = await pool.query(`SELECT * FROM ${s}.clinic_settings WHERE id = TRUE`); return res.json({ success: true, data: result.rows[0] || null }) } catch (error) { next(error) }
})

router.put('/settings', async (req: TenantRequest, res, next) => {
  try {
    const s = quoteIdentifier(req.tenant!.schemaName)
    const { clinicName, clinicEmail, phone, address, branding, workingHours, appointmentSettings, notifications, timezone } = req.body
    if (typeof clinicName !== 'string' || !clinicName.trim()) return res.status(400).json({ success: false, message: 'clinicName is required' })
    const result = await pool.query(`INSERT INTO ${s}.clinic_settings (id, clinic_name, clinic_email, phone, address, branding, working_hours, appointment_settings, notifications, timezone, updated_by) VALUES (TRUE,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET clinic_name=EXCLUDED.clinic_name, clinic_email=EXCLUDED.clinic_email, phone=EXCLUDED.phone, address=EXCLUDED.address, branding=EXCLUDED.branding, working_hours=EXCLUDED.working_hours, appointment_settings=EXCLUDED.appointment_settings, notifications=EXCLUDED.notifications, timezone=EXCLUDED.timezone, updated_by=EXCLUDED.updated_by, updated_at=NOW() RETURNING *`, [clinicName.trim(), clinicEmail || null, phone || null, address || {}, branding || {}, workingHours || {}, appointmentSettings || {}, notifications || {}, timezone || 'Asia/Kolkata', req.user?.userId || null])
    return res.json({ success: true, data: result.rows[0] })
  } catch (error) { next(error) }
})

router.get('/hospitals', async (req: TenantRequest, res, next) => {
  try {
    const s = quoteIdentifier(req.tenant!.schemaName); const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    await ensureFeatureTables(s)
    const result = await pool.query(`SELECT id, name, relationship, specialty, address, city, contact_name, contact_phone, is_active FROM ${s}.hospital_directory WHERE is_active AND (owner_user_id IS NULL OR owner_user_id = $1) AND (name ILIKE $2 OR relationship ILIKE $2 OR specialty ILIKE $2 OR city ILIKE $2) ORDER BY relationship, name`, [req.user?.userId || null, `%${search}%`])
    return res.json({ success: true, data: result.rows })
  } catch (error) { next(error) }
})

router.get('/notifications', async (req: TenantRequest, res, next) => {
  try {
    const s = quoteIdentifier(req.tenant!.schemaName); const unreadOnly = req.query.unreadOnly === 'true'
    await ensureFeatureTables(s)
    const result = await pool.query(`SELECT id, notification_type AS kind, title, body, customer_name, is_read, created_at FROM ${s}.client_notifications WHERE recipient_user_id = $1 AND ${unreadOnly ? 'NOT is_read AND' : ''} TRUE ORDER BY created_at DESC LIMIT 50`, [req.user?.userId ?? null])
    return res.json({ success: true, data: result.rows })
  } catch (error) { next(error) }
})

router.patch('/notifications/:id/read', async (req: TenantRequest, res, next) => {
  try { const parsedId = z.string().uuid().safeParse(req.params.id); if (!parsedId.success) return res.status(400).json({ success: false, message: 'Invalid notification id' }); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s); const result = await pool.query(`UPDATE ${s}.client_notifications SET is_read = TRUE WHERE id = $1 AND recipient_user_id = $2 RETURNING id`, [parsedId.data, req.user?.userId ?? null]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Notification not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { next(error) }
})

router.get('/inventory', async (req: TenantRequest, res, next) => {
  try { const s = quoteIdentifier(req.tenant!.schemaName); const search = typeof req.query.search === 'string' ? req.query.search : ''; const result = await pool.query(`SELECT *, (quantity <= reorder_level) AS low_stock FROM ${s}.inventory_items WHERE is_active AND (name ILIKE $1 OR category ILIKE $1) ORDER BY category, name`, [`%${search}%`]); return res.json({ success: true, data: result.rows }) } catch (error) { next(error) }
})

router.get('/inventory/history', async (req: TenantRequest, res, next) => {
  try { const s = quoteIdentifier(req.tenant!.schemaName); const search = typeof req.query.search === 'string' ? req.query.search : ''; const result = await pool.query(`SELECT *, (quantity <= reorder_level) AS low_stock FROM ${s}.inventory_items WHERE NOT is_active AND (name ILIKE $1 OR category ILIKE $1) ORDER BY updated_at DESC, category, name`, [`%${search}%`]); return res.json({ success: true, data: result.rows }) } catch (error) { next(error) }
})

router.post('/inventory', async (req: TenantRequest, res, next) => {
  try { const input = inventoryCreateInput.parse(req.body); const s = quoteIdentifier(req.tenant!.schemaName); const result = await pool.query(`INSERT INTO ${s}.inventory_items (name,category,quantity,reorder_level,unit) VALUES ($1,$2,$3,$4,$5) RETURNING *, (quantity <= reorder_level) AS low_stock`, [input.name, input.category, input.quantity, input.reorderLevel, input.unit]); return res.status(201).json({ success: true, data: result.rows[0] }) } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

router.patch('/inventory/:id', async (req: TenantRequest, res, next) => {
  try { const parsedId = z.string().uuid().safeParse(req.params.id); if (!parsedId.success) return res.status(400).json({ success: false, message: 'Invalid inventory item id' }); const parsed = inventoryPatchInput.parse(req.body); const names: Record<string, string> = { name: 'name', category: 'category', quantity: 'quantity', reorderLevel: 'reorder_level', reorder_level: 'reorder_level', unit: 'unit' }; const normalized = Object.entries(parsed).reduce<Record<string, unknown>>((result, [key, value]) => { result[names[key]] = value; return result }, {}); const fields = Object.entries(normalized); if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' }); const s = quoteIdentifier(req.tenant!.schemaName); const assignments = fields.map(([key], index) => `${key} = $${index + 1}`); const result = await pool.query(`UPDATE ${s}.inventory_items SET ${assignments.join(', ')}, updated_at=NOW() WHERE id=$${fields.length + 1} AND is_active RETURNING *, (quantity <= reorder_level) AS low_stock`, [...fields.map(([, value]) => value), parsedId.data]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Inventory item not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

router.delete('/inventory/:id', async (req: TenantRequest, res, next) => {
  try { const parsedId = z.string().uuid().safeParse(req.params.id); if (!parsedId.success) return res.status(400).json({ success: false, message: 'Invalid inventory item id' }); const s = quoteIdentifier(req.tenant!.schemaName); const result = await pool.query(`UPDATE ${s}.inventory_items SET is_active=FALSE, updated_at=NOW() WHERE id=$1 RETURNING id`, [parsedId.data]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Inventory item not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { next(error) }
})

export default router

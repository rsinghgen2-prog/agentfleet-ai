import express from 'express'
import { PatientController } from '../controllers/patientController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { tenantMiddleware } from '../middleware/tenantMiddleware.js'
import type { TenantRequest } from '../types.js'
import { pool } from '../config/database.js'
import { quoteIdentifier } from '../utils/sql.js'

const router = express.Router()

// All routes require authentication and tenant context
router.use(authMiddleware)
router.use(tenantMiddleware)

// Get dashboard data (patients, appointments, stats)
router.get('/dashboard', PatientController.getDashboardData)

// Create new booking (patient + appointment)
router.post('/bookings', PatientController.createBooking)

// Patient routes
router.get('/patients', PatientController.getPatients)
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

router.get('/inventory', async (req: TenantRequest, res, next) => {
  try { const s = quoteIdentifier(req.tenant!.schemaName); const search = typeof req.query.search === 'string' ? req.query.search : ''; const result = await pool.query(`SELECT *, (quantity <= reorder_level) AS low_stock FROM ${s}.inventory_items WHERE is_active AND (name ILIKE $1 OR category ILIKE $1) ORDER BY category, name`, [`%${search}%`]); return res.json({ success: true, data: result.rows }) } catch (error) { next(error) }
})

router.post('/inventory', async (req: TenantRequest, res, next) => {
  try { const s = quoteIdentifier(req.tenant!.schemaName); const { name, category, quantity = 0, reorderLevel = 0, unit = 'units' } = req.body; if (!name || !category) return res.status(400).json({ success: false, message: 'name and category are required' }); const result = await pool.query(`INSERT INTO ${s}.inventory_items (name,category,quantity,reorder_level,unit) VALUES ($1,$2,$3,$4,$5) RETURNING *, (quantity <= reorder_level) AS low_stock`, [name, category, quantity, reorderLevel, unit]); return res.status(201).json({ success: true, data: result.rows[0] }) } catch (error) { next(error) }
})

router.patch('/inventory/:id', async (req: TenantRequest, res, next) => {
  try { const s = quoteIdentifier(req.tenant!.schemaName); const allowed = ['name', 'category', 'quantity', 'reorder_level', 'unit']; const fields = Object.entries(req.body).filter(([key]) => allowed.includes(key)); if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' }); const assignments = fields.map(([key], index) => `${key} = $${index + 1}`); const result = await pool.query(`UPDATE ${s}.inventory_items SET ${assignments.join(', ')}, updated_at=NOW() WHERE id=$${fields.length + 1} AND is_active RETURNING *, (quantity <= reorder_level) AS low_stock`, [...fields.map(([, value]) => value), req.params.id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Inventory item not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { next(error) }
})

router.delete('/inventory/:id', async (req: TenantRequest, res, next) => {
  try { const s = quoteIdentifier(req.tenant!.schemaName); const result = await pool.query(`UPDATE ${s}.inventory_items SET is_active=FALSE, updated_at=NOW() WHERE id=$1 RETURNING id`, [req.params.id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Inventory item not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { next(error) }
})

export default router

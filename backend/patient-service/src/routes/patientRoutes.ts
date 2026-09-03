import express from 'express'
import { z } from 'zod'
import { PatientController } from '../controllers/patientController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { tenantMiddleware } from '../middleware/tenantMiddleware.js'
import type { TenantRequest } from '../types.js'
import { pool, withTransaction } from '../config/database.js'
import { quoteIdentifier } from '../utils/sql.js'
import { SupportController } from '../controllers/supportController.js'

const router = express.Router()
const featureTableInitializers = new Map<string, Promise<void>>()
const inventoryCreateInput = z.object({ name: z.string().trim().min(1).max(255), category: z.string().trim().min(1).max(100), quantity: z.coerce.number().int().min(0).default(0), reorderLevel: z.coerce.number().int().min(0).default(0), unit: z.string().trim().min(1).max(50).default('units') })
const inventoryPatchInput = z.object({ name: z.string().trim().min(1).max(255).optional(), category: z.string().trim().min(1).max(100).optional(), quantity: z.coerce.number().int().min(0).optional(), reorderLevel: z.coerce.number().int().min(0).optional(), reorder_level: z.coerce.number().int().min(0).optional(), unit: z.string().trim().min(1).max(50).optional() })
const inventoryVendorInput = z.object({ name: z.string().trim().min(1).max(255), contactName: z.string().trim().max(160).optional().nullable(), email: z.string().trim().email().max(255).optional().nullable(), phone: z.string().trim().max(50).optional().nullable(), address: z.string().trim().max(1000).optional().default(''), notes: z.string().trim().max(2000).optional().default('') })
const inventoryVendorPatchInput = inventoryVendorInput.partial()
const inventoryOrderItemInput = z.object({ inventoryItemId: z.string().uuid().optional().nullable(), itemName: z.string().trim().min(1).max(255), quantity: z.coerce.number().int().positive(), unit: z.string().trim().min(1).max(50).default('units'), unitPrice: z.coerce.number().finite().min(0).default(0) })
const inventoryOrderStatus = z.enum(['draft', 'placed', 'confirmed', 'partially_received', 'received', 'cancelled'])
const inventoryPaymentStatus = z.enum(['pending', 'paid', 'failed', 'refunded'])
const inventoryPaymentMethod = z.enum(['cash', 'cheque', 'online', 'bank_transfer'])
const inventoryOrderInput = z.object({ vendorId: z.string().uuid().optional().nullable(), orderNumber: z.string().trim().max(80).optional(), patientId: z.string().uuid().optional().nullable(), items: z.array(inventoryOrderItemInput).default([]), taxAmount: z.coerce.number().finite().min(0).default(0), notes: z.string().trim().max(4000).optional().default(''), expectedDeliveryDate: z.string().date().optional().nullable(), status: inventoryOrderStatus.default('draft'), paymentStatus: inventoryPaymentStatus.default('pending'), paymentMethod: inventoryPaymentMethod.optional().nullable() })
const inventoryOrderUpdateInput = inventoryOrderInput.partial()
const inventoryOrderEventInput = z.object({ eventType: z.string().trim().min(1).max(80), status: inventoryOrderStatus.optional(), description: z.string().trim().max(2000).optional().default(''), location: z.string().trim().max(255).optional().default(''), occurredAt: z.string().datetime().optional() })
const inventoryCommunicationInput = z.object({ channel: z.enum(['email', 'sms']), recipientType: z.enum(['vendor', 'patient', 'client']).default('vendor'), recipient: z.string().trim().max(255).optional(), subject: z.string().trim().max(255).optional().default('Inventory purchase order'), body: z.string().trim().min(1).max(10000), copyToPatient: z.boolean().optional().default(false), patientId: z.string().uuid().optional().nullable() })
const paymentStatus = z.enum(['pending', 'paid', 'failed', 'refunded'])
const paymentMethod = z.enum(['cash', 'cheque', 'online', 'bank_transfer', 'card', 'upi'])
const paymentCreateInput = z.object({ customerId: z.string().uuid(), paymentNumber: z.string().trim().max(80).optional(), amount: z.coerce.number().finite().min(0), currency: z.string().trim().length(3).optional().default('INR'), status: paymentStatus.default('pending'), method: paymentMethod.optional().nullable(), description: z.string().trim().max(4000).optional().default('') })
const paymentUpdateInput = z.object({ amount: z.coerce.number().finite().min(0).optional(), currency: z.string().trim().length(3).optional(), status: paymentStatus.optional(), method: paymentMethod.optional().nullable(), description: z.string().trim().max(4000).optional() })

// Client admins own the clinic's financials; only they may see reports/summaries.
const ADMIN_ROLES = new Set(['admin', 'super_admin', 'owner', 'client_admin'])
function isClientAdmin(req: TenantRequest) { return req.user?.isSuperAdmin === true || ADMIN_ROLES.has(req.user?.role || '') }

function ensureFeatureTables(s: string) {
  const existing = featureTableInitializers.get(s)
  if (existing) return existing
  const initializer = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.hospital_directory (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, relationship VARCHAR(20) NOT NULL DEFAULT 'partner' CHECK (relationship IN ('own', 'partner')), specialty VARCHAR(160) NOT NULL DEFAULT 'General care', address TEXT NOT NULL DEFAULT '', city VARCHAR(100) NOT NULL DEFAULT '', contact_name VARCHAR(160), contact_phone VARCHAR(50), owner_user_id UUID REFERENCES ${s}.users(id), is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.client_notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), recipient_user_id UUID NOT NULL REFERENCES ${s}.users(id), notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('message', 'email', 'call')), title VARCHAR(200) NOT NULL, body TEXT NOT NULL, customer_name VARCHAR(160), customer_id UUID REFERENCES ${s}.patients(id), is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.inventory_vendors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, contact_name VARCHAR(160), email VARCHAR(255), phone VARCHAR(50), address TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.inventory_orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id UUID REFERENCES ${s}.inventory_vendors(id) ON DELETE SET NULL, order_number VARCHAR(80) NOT NULL UNIQUE, patient_id UUID REFERENCES ${s}.patients(id) ON DELETE SET NULL, status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'placed', 'confirmed', 'partially_received', 'received', 'cancelled')), payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')), payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'cheque', 'online', 'bank_transfer')), subtotal NUMERIC(12,2) NOT NULL DEFAULT 0, tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0, total_amount NUMERIC(12,2) NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', expected_delivery_date DATE, placed_at TIMESTAMPTZ, created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.inventory_order_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES ${s}.inventory_orders(id) ON DELETE CASCADE, inventory_item_id UUID REFERENCES ${s}.inventory_items(id) ON DELETE SET NULL, item_name VARCHAR(255) NOT NULL, quantity INTEGER NOT NULL CHECK (quantity > 0), unit VARCHAR(50) NOT NULL DEFAULT 'units', unit_price NUMERIC(12,2) NOT NULL DEFAULT 0, total_price NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.inventory_order_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES ${s}.inventory_orders(id) ON DELETE CASCADE, event_type VARCHAR(80) NOT NULL, status VARCHAR(30), description TEXT NOT NULL DEFAULT '', location VARCHAR(255) NOT NULL DEFAULT '', occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.inventory_communications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES ${s}.inventory_orders(id) ON DELETE CASCADE, channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms')), recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('vendor', 'patient', 'client')), recipient VARCHAR(255) NOT NULL, subject VARCHAR(255) NOT NULL DEFAULT '', body TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'queued', sent_at TIMESTAMPTZ, created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id UUID NOT NULL REFERENCES ${s}.patients(id) ON DELETE CASCADE, payment_number VARCHAR(80) NOT NULL UNIQUE, amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0), currency VARCHAR(3) NOT NULL DEFAULT 'INR', status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')), method VARCHAR(20) CHECK (method IN ('cash', 'cheque', 'online', 'bank_transfer', 'card', 'upi')), description TEXT NOT NULL DEFAULT '', paid_at TIMESTAMPTZ, created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_customer ON ${s}.payments (customer_id, created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON ${s}.payments (status, created_at DESC)`)
    await pool.query(`DROP TRIGGER IF EXISTS hospital_directory_updated_at ON ${s}.hospital_directory`)
    await pool.query(`CREATE TRIGGER hospital_directory_updated_at BEFORE UPDATE ON ${s}.hospital_directory FOR EACH ROW EXECUTE FUNCTION ${s}.set_updated_at()`)
    await pool.query(`DROP TRIGGER IF EXISTS payments_updated_at ON ${s}.payments`)
    await pool.query(`CREATE TRIGGER payments_updated_at BEFORE UPDATE ON ${s}.payments FOR EACH ROW EXECUTE FUNCTION ${s}.set_updated_at()`)
  })()
  featureTableInitializers.set(s, initializer)
  initializer.catch(() => featureTableInitializers.delete(s))
  return initializer
}

function inventoryOrderSelect(s: string, filter = 'TRUE') {
  return `SELECT o.*, v.name AS vendor_name, v.email AS vendor_email, v.phone AS vendor_phone,
    COALESCE((SELECT json_agg(i ORDER BY i.created_at) FROM ${s}.inventory_order_items i WHERE i.order_id = o.id), '[]'::json) AS items,
    COALESCE((SELECT json_agg(e ORDER BY e.occurred_at DESC) FROM ${s}.inventory_order_events e WHERE e.order_id = o.id), '[]'::json) AS events,
    COALESCE((SELECT json_agg(c ORDER BY c.created_at DESC) FROM ${s}.inventory_communications c WHERE c.order_id = o.id), '[]'::json) AS communications
    FROM ${s}.inventory_orders o LEFT JOIN ${s}.inventory_vendors v ON v.id = o.vendor_id WHERE ${filter}`
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
router.patch('/patients/:id/prescriptions/:prescriptionId', PatientController.updatePrescription)
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

router.get('/inventory/vendors', async (req: TenantRequest, res, next) => {
  try {
    const s = quoteIdentifier(req.tenant!.schemaName); const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    await ensureFeatureTables(s)
    const result = await pool.query(`SELECT * FROM ${s}.inventory_vendors WHERE is_active AND (name ILIKE $1 OR COALESCE(contact_name, '') ILIKE $1 OR COALESCE(email, '') ILIKE $1 OR COALESCE(phone, '') ILIKE $1) ORDER BY name`, [`%${search}%`])
    return res.json({ success: true, data: result.rows })
  } catch (error) { next(error) }
})

router.post('/inventory/vendors', async (req: TenantRequest, res, next) => {
  try {
    const input = inventoryVendorInput.parse(req.body); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const result = await pool.query(`INSERT INTO ${s}.inventory_vendors (name, contact_name, email, phone, address, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [input.name, input.contactName || null, input.email || null, input.phone || null, input.address, input.notes])
    return res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

router.patch('/inventory/vendors/:id', async (req: TenantRequest, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid vendor id' })
    const input = inventoryVendorPatchInput.parse(req.body); const names: Record<string, string> = { name: 'name', contactName: 'contact_name', email: 'email', phone: 'phone', address: 'address', notes: 'notes' }
    const fields = Object.entries(input).filter(([key]) => names[key]) as Array<[string, unknown]>
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' })
    const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s); const assignments = fields.map(([key], index) => `${names[key]} = $${index + 1}`)
    const result = await pool.query(`UPDATE ${s}.inventory_vendors SET ${assignments.join(', ')}, updated_at=NOW() WHERE id=$${fields.length + 1} AND is_active RETURNING *`, [...fields.map(([, value]) => value ?? null), id.data])
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Vendor not found' }); return res.json({ success: true, data: result.rows[0] })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})
router.put('/inventory/vendors/:id', async (req: TenantRequest, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid vendor id' })
    const input = inventoryVendorPatchInput.parse(req.body); const names: Record<string, string> = { name: 'name', contactName: 'contact_name', email: 'email', phone: 'phone', address: 'address', notes: 'notes' }
    const fields = Object.entries(input).filter(([key]) => names[key]) as Array<[string, unknown]>
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' })
    const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s); const assignments = fields.map(([key], index) => `${names[key]} = $${index + 1}`)
    const result = await pool.query(`UPDATE ${s}.inventory_vendors SET ${assignments.join(', ')}, updated_at=NOW() WHERE id=$${fields.length + 1} AND is_active RETURNING *`, [...fields.map(([, value]) => value ?? null), id.data])
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Vendor not found' }); return res.json({ success: true, data: result.rows[0] })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

async function listInventoryOrders(req: TenantRequest, res: express.Response, next: express.NextFunction, historical = false) {
  try {
    const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s); const params: unknown[] = []; const filters = [historical || req.query.history === 'true' ? `o.status <> 'draft'` : 'TRUE']
    if (typeof req.query.status === 'string') { const parsed = inventoryOrderStatus.safeParse(req.query.status); if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid order status' }); params.push(parsed.data); filters.push(`o.status = $${params.length}`) }
    if (typeof req.query.search === 'string' && req.query.search.trim()) { params.push(`%${req.query.search.trim()}%`); filters.push(`(o.order_number ILIKE $${params.length} OR COALESCE(v.name, '') ILIKE $${params.length})`) }
    const result = await pool.query(`${inventoryOrderSelect(s, filters.join(' AND '))} ORDER BY o.created_at DESC`, params)
    return res.json({ success: true, data: result.rows })
  } catch (error) { next(error) }
}

router.get('/inventory/orders/history', (req, res, next) => listInventoryOrders(req as TenantRequest, res, next, true))
router.get('/inventory/orders', (req, res, next) => listInventoryOrders(req as TenantRequest, res, next))

router.post('/inventory/orders', async (req: TenantRequest, res, next) => {
  try {
    const input = inventoryOrderInput.parse(req.body); if (input.status !== 'draft' && !input.items.length) return res.status(400).json({ success: false, message: 'A placed order must contain at least one item' })
    const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s); const orderNumber = input.orderNumber || `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`; const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0); const total = subtotal + input.taxAmount
    const id = await withTransaction(async (client) => {
      const order = await client.query(`INSERT INTO ${s}.inventory_orders (vendor_id, order_number, patient_id, status, payment_status, payment_method, subtotal, tax_amount, total_amount, notes, expected_delivery_date, placed_at, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CASE WHEN $4 <> 'draft' THEN NOW() ELSE NULL END,$12) RETURNING id`, [input.vendorId || null, orderNumber, input.patientId || null, input.status, input.paymentStatus, input.paymentMethod || null, subtotal, input.taxAmount, total, input.notes, input.expectedDeliveryDate || null, req.user?.userId || null])
      const orderId = order.rows[0].id as string
      for (const item of input.items) await client.query(`INSERT INTO ${s}.inventory_order_items (order_id, inventory_item_id, item_name, quantity, unit, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [orderId, item.inventoryItemId || null, item.itemName, item.quantity, item.unit, item.unitPrice, item.quantity * item.unitPrice])
      if (input.status !== 'draft') await client.query(`INSERT INTO ${s}.inventory_order_events (order_id, event_type, status, description, created_by) VALUES ($1,'order_placed',$2,$3,$4)`, [orderId, input.status, 'Order placed for vendor processing.', req.user?.userId || null])
      return orderId
    })
    const result = await pool.query(`${inventoryOrderSelect(s, 'o.id = $1')}`, [id]); return res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

router.get('/inventory/orders/:id', async (req: TenantRequest, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid order id' }); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const result = await pool.query(inventoryOrderSelect(s, 'o.id = $1'), [id.data]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Inventory order not found' }); return res.json({ success: true, data: result.rows[0] })
  } catch (error) { next(error) }
})

async function updateInventoryOrderRoute(req: TenantRequest, res: express.Response, next: express.NextFunction, forced?: Record<string, unknown>) {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid order id' }); const input = inventoryOrderUpdateInput.parse({ ...req.body, ...forced }); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const current = await pool.query(`SELECT status, payment_status, payment_method, subtotal, tax_amount, COALESCE((SELECT COUNT(*) FROM ${s}.inventory_order_items i WHERE i.order_id = o.id), 0)::int AS item_count FROM ${s}.inventory_orders o WHERE o.id=$1`, [id.data]); if (!current.rowCount) return res.status(404).json({ success: false, message: 'Inventory order not found' })
    if (input.status === 'draft' && current.rows[0].status !== 'draft') return res.status(400).json({ success: false, message: 'Placed orders cannot be returned to draft; use reorder instead' })
    const resultingStatus = input.status ?? current.rows[0].status
    const resultingItemCount = input.items ? input.items.length : current.rows[0].item_count
    if (resultingStatus !== 'draft' && resultingItemCount === 0) return res.status(400).json({ success: false, message: 'A placed order must contain at least one item' })
    const fields: Array<[string, unknown]> = []; const add = (name: string, value: unknown) => { if (value !== undefined) fields.push([name, value]) }
    add('vendor_id', input.vendorId === undefined ? undefined : input.vendorId || null); add('patient_id', input.patientId === undefined ? undefined : input.patientId || null); add('status', input.status); add('payment_status', input.paymentStatus); add('payment_method', input.paymentMethod === undefined ? undefined : input.paymentMethod || null); add('tax_amount', input.taxAmount); add('notes', input.notes); add('expected_delivery_date', input.expectedDeliveryDate === undefined ? undefined : input.expectedDeliveryDate || null)
    if (input.items) { const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0); add('subtotal', subtotal); add('total_amount', subtotal + (input.taxAmount ?? Number(current.rows[0].tax_amount))) } else if (input.taxAmount !== undefined) add('total_amount', Number(current.rows[0].subtotal) + input.taxAmount)
    if (!fields.length && !input.items) return res.status(400).json({ success: false, message: 'No fields to update' })
    await withTransaction(async (client) => {
      if (fields.length) { const assignments = fields.map(([name], index) => `${name}=$${index + 1}`); if (input.status === 'placed') assignments.push(`placed_at=COALESCE(placed_at,NOW())`); await client.query(`UPDATE ${s}.inventory_orders SET ${assignments.join(', ')}, updated_at=NOW() WHERE id=$${fields.length + 1}`, [...fields.map(([, value]) => value), id.data]) }
      if (input.items) { await client.query(`DELETE FROM ${s}.inventory_order_items WHERE order_id=$1`, [id.data]); for (const item of input.items) await client.query(`INSERT INTO ${s}.inventory_order_items (order_id, inventory_item_id, item_name, quantity, unit, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id.data, item.inventoryItemId || null, item.itemName, item.quantity, item.unit, item.unitPrice, item.quantity * item.unitPrice]) }
      if (input.status && input.status !== current.rows[0].status) await client.query(`INSERT INTO ${s}.inventory_order_events (order_id, event_type, status, description, created_by) VALUES ($1,'status_updated',$2,$3,$4)`, [id.data, input.status, `Order status changed to ${input.status}.`, req.user?.userId || null])
      if ((input.paymentStatus && input.paymentStatus !== current.rows[0].payment_status) || (input.paymentMethod !== undefined && input.paymentMethod !== current.rows[0].payment_method)) {
        const paymentDescription = `Payment updated to ${input.paymentStatus ?? current.rows[0].payment_status}${input.paymentMethod || current.rows[0].payment_method ? ` via ${input.paymentMethod || current.rows[0].payment_method}` : ''}.`
        await client.query(`INSERT INTO ${s}.inventory_order_events (order_id, event_type, status, description, created_by) VALUES ($1,'payment_updated',$2,$3,$4)`, [id.data, input.paymentStatus ?? current.rows[0].payment_status, paymentDescription, req.user?.userId || null])
      }
    })
    const result = await pool.query(inventoryOrderSelect(s, 'o.id = $1'), [id.data]); return res.json({ success: true, data: result.rows[0] })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
}

router.post('/inventory/orders/:id/place', (req, res, next) => updateInventoryOrderRoute(req as TenantRequest, res, next, { status: 'placed' }))
router.patch('/inventory/orders/:id/status', (req, res, next) => updateInventoryOrderRoute(req as TenantRequest, res, next, { status: req.body.status }))
router.patch('/inventory/orders/:id/payment', (req, res, next) => updateInventoryOrderRoute(req as TenantRequest, res, next, { paymentStatus: req.body.paymentStatus, paymentMethod: req.body.paymentMethod }))
router.patch('/inventory/orders/:id', (req, res, next) => updateInventoryOrderRoute(req as TenantRequest, res, next))
router.put('/inventory/orders/:id', (req, res, next) => updateInventoryOrderRoute(req as TenantRequest, res, next))

router.post('/inventory/orders/:id/events', async (req: TenantRequest, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid order id' }); const input = inventoryOrderEventInput.parse(req.body); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const result = await withTransaction(async (client) => {
      const inserted = await client.query(`INSERT INTO ${s}.inventory_order_events (order_id, event_type, status, description, location, occurred_at, created_by) SELECT $1,$2,$3,$4,$5,COALESCE($6,NOW()),$7 WHERE EXISTS (SELECT 1 FROM ${s}.inventory_orders WHERE id=$1) RETURNING *`, [id.data, input.eventType, input.status || null, input.description, input.location, input.occurredAt || null, req.user?.userId || null])
      if (!inserted.rowCount) return null
      if (input.status) await client.query(`UPDATE ${s}.inventory_orders SET status=$1, updated_at=NOW() WHERE id=$2`, [input.status, id.data])
      return inserted.rows[0]
    })
    if (!result) return res.status(404).json({ success: false, message: 'Inventory order not found' }); return res.status(201).json({ success: true, data: result })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

router.post('/inventory/orders/:id/communications', async (req: TenantRequest, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid order id' }); const input = inventoryCommunicationInput.parse(req.body); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const source = await pool.query(`SELECT COALESCE($2, o.patient_id) AS patient_id, v.email AS vendor_email, v.phone AS vendor_phone, p.email AS patient_email, p.phone AS patient_phone FROM ${s}.inventory_orders o LEFT JOIN ${s}.inventory_vendors v ON v.id=o.vendor_id LEFT JOIN ${s}.patients p ON p.id=COALESCE($2, o.patient_id) WHERE o.id=$1`, [id.data, input.patientId || null]); if (!source.rowCount) return res.status(404).json({ success: false, message: 'Inventory order not found' }); const row = source.rows[0]
    const patientId = input.patientId || row.patient_id; const vendorRecipient = input.recipient || (input.channel === 'email' ? row.vendor_email : row.vendor_phone); const patientRecipient = input.channel === 'email' ? row.patient_email : row.patient_phone; const recipients: Array<{ type: string; value: string }> = []
    if (input.recipientType === 'vendor') { if (!vendorRecipient) return res.status(400).json({ success: false, message: 'Vendor contact is required' }); recipients.push({ type: 'vendor', value: vendorRecipient }) } else { if (!input.recipient && !patientRecipient) return res.status(400).json({ success: false, message: 'Recipient is required' }); recipients.push({ type: input.recipientType, value: input.recipient || patientRecipient! }) }
    if (input.copyToPatient) { if (!patientId || !patientRecipient) return res.status(400).json({ success: false, message: 'Patient contact is required for a copy' }); recipients.push({ type: 'patient', value: patientRecipient }) }
    const records = await withTransaction(async (client) => { const inserted: unknown[] = []; for (const recipient of recipients) { const result = await client.query(`INSERT INTO ${s}.inventory_communications (order_id, channel, recipient_type, recipient, subject, body, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,'queued',$7) RETURNING *`, [id.data, input.channel, recipient.type, recipient.value, input.subject, input.body, req.user?.userId || null]); inserted.push(result.rows[0]) } return inserted })
    return res.status(201).json({ success: true, data: records })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

router.post('/inventory/orders/:id/reorder', async (req: TenantRequest, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid order id' }); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const source = await pool.query(`SELECT * FROM ${s}.inventory_orders WHERE id=$1 AND status <> 'draft'`, [id.data]); if (!source.rowCount) return res.status(404).json({ success: false, message: 'Historical inventory order not found' }); const items = await pool.query(`SELECT inventory_item_id, item_name, quantity, unit, unit_price FROM ${s}.inventory_order_items WHERE order_id=$1 ORDER BY created_at`, [id.data]); const order = source.rows[0]; const orderNumber = `PO-REORDER-${String(Date.now()).slice(-10)}`
    const newId = await withTransaction(async (client) => { const created = await client.query(`INSERT INTO ${s}.inventory_orders (vendor_id, order_number, patient_id, status, payment_status, subtotal, tax_amount, total_amount, notes, expected_delivery_date, created_by) VALUES ($1,$2,$3,'draft','pending',$4,$5,$6,$7,$8,$9) RETURNING id`, [order.vendor_id, orderNumber, order.patient_id, order.subtotal, order.tax_amount, order.total_amount, `Reordered from ${order.order_number}. ${order.notes || ''}`.trim(), order.expected_delivery_date, req.user?.userId || null]); for (const item of items.rows) await client.query(`INSERT INTO ${s}.inventory_order_items (order_id, inventory_item_id, item_name, quantity, unit, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [created.rows[0].id, item.inventory_item_id, item.item_name, item.quantity, item.unit, item.unit_price, Number(item.quantity) * Number(item.unit_price)]); return created.rows[0].id as string })
    const result = await pool.query(inventoryOrderSelect(s, 'o.id=$1'), [newId]); return res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) { next(error) }
})

// ---- Payments (customer billing ledger) ----
function paymentSelect(s: string, filter = 'TRUE') {
  return `SELECT pay.*, p.first_name, p.last_name, p.email, p.phone
    FROM ${s}.payments pay JOIN ${s}.patients p ON p.id = pay.customer_id WHERE ${filter}`
}

// List payments. Optional customerId, status, and free-text search on payment number / customer.
router.get('/payments', async (req: TenantRequest, res, next) => {
  try {
    const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s); const params: unknown[] = []; const filters = ['TRUE']
    if (typeof req.query.customerId === 'string') { const parsed = z.string().uuid().safeParse(req.query.customerId); if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid customer id' }); params.push(parsed.data); filters.push(`pay.customer_id = $${params.length}`) }
    if (typeof req.query.status === 'string') { const parsed = paymentStatus.safeParse(req.query.status); if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid payment status' }); params.push(parsed.data); filters.push(`pay.status = $${params.length}`) }
    if (typeof req.query.search === 'string' && req.query.search.trim()) { params.push(`%${req.query.search.trim()}%`); filters.push(`(pay.payment_number ILIKE $${params.length} OR (p.first_name || ' ' || p.last_name) ILIKE $${params.length})`) }
    const result = await pool.query(`${paymentSelect(s, filters.join(' AND '))} ORDER BY pay.created_at DESC`, params)
    return res.json({ success: true, data: result.rows })
  } catch (error) { next(error) }
})

// Create a payment for a customer (patient). payment_number is generated when omitted.
router.post('/payments', async (req: TenantRequest, res, next) => {
  try {
    const input = paymentCreateInput.parse(req.body); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const paymentNumber = input.paymentNumber || `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`
    const inserted = await pool.query(`INSERT INTO ${s}.payments (customer_id, payment_number, amount, currency, status, method, description, paid_at, created_by) SELECT $1,$2,$3,$4,$5,$6,$7,CASE WHEN $5 = 'paid' THEN NOW() ELSE NULL END,$8 WHERE EXISTS (SELECT 1 FROM ${s}.patients WHERE id = $1) RETURNING id`, [input.customerId, paymentNumber, input.amount, input.currency, input.status, input.method || null, input.description, req.user?.userId || null])
    if (!inserted.rowCount) return res.status(404).json({ success: false, message: 'Customer not found' })
    const result = await pool.query(paymentSelect(s, 'pay.id = $1'), [inserted.rows[0].id]); return res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

// Update a payment (status/method/amount/description). Sets paid_at when status becomes paid.
router.patch('/payments/:id', async (req: TenantRequest, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); if (!id.success) return res.status(400).json({ success: false, message: 'Invalid payment id' }); const input = paymentUpdateInput.parse(req.body); const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const fields: Array<[string, unknown]> = []; const add = (name: string, value: unknown) => { if (value !== undefined) fields.push([name, value]) }
    add('amount', input.amount); add('currency', input.currency); add('status', input.status); add('method', input.method === undefined ? undefined : input.method || null); add('description', input.description)
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' })
    const assignments = fields.map(([name], index) => `${name}=$${index + 1}`); if (input.status === 'paid') assignments.push(`paid_at=COALESCE(paid_at,NOW())`)
    const updated = await pool.query(`UPDATE ${s}.payments SET ${assignments.join(', ')}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING id`, [...fields.map(([, value]) => value), id.data])
    if (!updated.rowCount) return res.status(404).json({ success: false, message: 'Payment not found' })
    const result = await pool.query(paymentSelect(s, 'pay.id = $1'), [id.data]); return res.json({ success: true, data: result.rows[0] })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); next(error) }
})

// Admin-only financial summary: totals by status plus overall collected/outstanding.
router.get('/payments/summary', async (req: TenantRequest, res, next) => {
  try {
    if (!isClientAdmin(req)) return res.status(403).json({ success: false, message: 'Only client admins can view payment reports' })
    const s = quoteIdentifier(req.tenant!.schemaName); await ensureFeatureTables(s)
    const result = await pool.query(`SELECT
      COUNT(*)::int AS total_payments,
      COALESCE(SUM(amount), 0)::numeric AS total_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::numeric AS collected_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::numeric AS pending_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0)::numeric AS refunded_amount,
      COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
      COUNT(DISTINCT customer_id)::int AS customers_count
      FROM ${s}.payments`)
    return res.json({ success: true, data: result.rows[0] })
  } catch (error) { next(error) }
})

export default router

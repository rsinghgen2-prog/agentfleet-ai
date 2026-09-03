import { z } from 'zod'
import { pool, withTransaction } from '../config/database.js'
import type { TenantRequest } from '../types.js'
import { parsePositiveInt, quoteIdentifier } from '../utils/sql.js'
import { defaultDentistNoteExpiration } from '../utils/notes.js'

const patientInput = z.object({
  firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100),
  dateOfBirth: z.string().date().optional().nullable(), gender: z.string().trim().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(), phone: z.string().trim().max(50).optional().nullable(),
  addressLine1: z.string().trim().max(255).optional().nullable(), city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(), postalCode: z.string().trim().max(20).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
})

const appointmentInput = z.object({
  patientId: z.string().uuid(), appointmentDate: z.string().date(),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  duration: z.number().int().min(5).max(480).default(30), appointmentType: z.string().trim().min(1).max(100),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  reason: z.string().trim().max(2000).optional().nullable(), notes: z.string().trim().max(5000).optional().nullable(),
  followUpRequired: z.boolean().default(false), followUpDate: z.string().date().optional().nullable(),
})

const bookingInput = appointmentInput.omit({ patientId: true }).extend({
  firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(50), email: z.string().email(),
  dateOfBirth: z.string().date().optional().nullable(), gender: z.string().max(30).optional().nullable(),
})
const noteInput = z.object({ title: z.string().trim().min(1).max(160).default('Clinical note'), content: z.string().trim().min(1).max(10000), expiresAt: z.string().trim().optional().nullable().refine((value) => !value || !Number.isNaN(Date.parse(value)), 'expiresAt must be a valid date') })

const MAX_REPORT_ATTACHMENT_BYTES = 5 * 1024 * 1024
const base64Attachment = z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, 'attachmentData must be base64').refine((value) => value.length % 4 === 0, 'attachmentData must be valid base64').refine((value) => Buffer.byteLength(value, 'base64') <= MAX_REPORT_ATTACHMENT_BYTES, 'attachmentData is too large')
const mimeType = z.string().trim().regex(/^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/, 'attachmentMimeType must be a valid MIME type')
const prescriptionInput = z.object({
  medicationName: z.string().trim().min(1).max(255).optional(), medication: z.string().trim().min(1).max(255).optional(), name: z.string().trim().min(1).max(255).optional(),
  dosage: z.string().trim().max(100).optional().nullable(), frequency: z.string().trim().max(100).optional().nullable(), duration: z.string().trim().max(100).optional().nullable(),
  instructions: z.string().trim().max(5000).optional().nullable(), prescribedBy: z.string().trim().max(255).optional().nullable(), startDate: z.string().date().optional().nullable(), endDate: z.string().date().optional().nullable(),
}).superRefine((value, context) => { if (!value.medicationName && !value.medication && !value.name) context.addIssue({ code: 'custom', path: ['medicationName'], message: 'medicationName is required' }) })
const reportInput = z.object({
  title: z.string().trim().min(1).max(255).default('Medical report'), reportType: z.string().trim().max(100).optional().nullable(), description: z.string().trim().max(5000).optional().nullable(), reportDate: z.string().date().optional().nullable(),
  attachmentName: z.string().trim().min(1).max(255).optional().nullable(), attachmentMimeType: mimeType.max(150).optional().nullable(), attachmentData: base64Attachment.optional().nullable(),
}).superRefine((value, context) => { if (value.attachmentData && !value.attachmentName) context.addIssue({ code: 'custom', path: ['attachmentName'], message: 'attachmentName is required with attachmentData' }); if (value.attachmentData && !value.attachmentMimeType) context.addIssue({ code: 'custom', path: ['attachmentMimeType'], message: 'attachmentMimeType is required with attachmentData' }) })
const labOrderInput = z.object({
  orderNumber: z.string().trim().min(1).max(64).optional(), testName: z.string().trim().min(1).max(255).optional(), test: z.string().trim().min(1).max(255).optional(), tests: z.string().trim().min(1).max(255).optional(), teethCreationService: z.string().trim().max(255).optional().default(''), labName: z.string().trim().min(1).max(255).default('Laboratory'),
  labEmail: z.string().email().optional().nullable(), labPhone: z.string().trim().max(50).optional().nullable(), priority: z.enum(['routine', 'urgent', 'stat']).default('routine'), instructions: z.string().trim().max(5000).optional().nullable(),
  copyToPatient: z.boolean().default(true), copyToClinic: z.boolean().default(false), sendClinicCopy: z.boolean().default(false), clinicEmail: z.string().email().optional().nullable(), clinicPhone: z.string().trim().max(50).optional().nullable(),
  clinicCopies: z.array(z.object({ email: z.string().email().optional().nullable(), phone: z.string().trim().max(50).optional().nullable() })).max(4).default([]),
  attachmentName: z.string().trim().min(1).max(255).optional().nullable(), attachmentMimeType: mimeType.max(150).optional().nullable(), attachmentSize: z.number().int().min(0).max(MAX_REPORT_ATTACHMENT_BYTES).optional().nullable(), attachmentData: base64Attachment.optional().nullable(),
}).superRefine((value, context) => { if (!value.testName && !value.test && !value.tests) context.addIssue({ code: 'custom', path: ['testName'], message: 'testName is required' }); if (!value.labEmail && !value.labPhone) context.addIssue({ code: 'custom', path: ['labEmail'], message: 'labEmail or labPhone is required' }) })

function schema(req: TenantRequest) { if (!req.tenant) throw new Error('Tenant context is missing'); return quoteIdentifier(req.tenant.schemaName) }
function actor(req: TenantRequest) { return req.user?.userId || null }
function param(req: TenantRequest, name: string) { return String(req.params[name]) }
function uuidParam(req: TenantRequest, name: string) { return z.string().uuid().parse(req.params[name]) }
function sendError(res: any, error: unknown, message: string) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); const status = (error as { status?: number }).status || 500; if (status === 500) console.error(error); return res.status(status).json({ success: false, message: status === 409 ? (error as Error).message : message }) }
function normalizeEmail(value: string | null | undefined) { return value?.trim().toLowerCase() || null }
function normalizePhone(value: string | null | undefined) { const digits = value?.replace(/\D/g, '') || ''; return digits || null }
async function findDuplicatePatient(s: string, email: string | null, phone: string | null, excludeId?: string) {
  const conditions: string[] = []
  const values: unknown[] = []
  let emailCondition: string | undefined
  if (email) { values.push(email); emailCondition = `LOWER(email) = $${values.length}`; conditions.push(emailCondition) }
  let phoneCondition: string | undefined
  if (phone) { values.push(phone); phoneCondition = `regexp_replace(phone, '\\D', '', 'g') = $${values.length}`; conditions.push(phoneCondition) }
  if (!conditions.length) return null
  if (excludeId) { values.push(excludeId); conditions.push(`id <> $${values.length}`) }
  const result = await pool.query(`SELECT id, email, phone, CASE WHEN ${emailCondition || 'FALSE'} THEN 'email' ELSE 'mobile' END AS duplicate_field FROM ${s}.patients WHERE is_active AND (${conditions.join(' OR ')}) LIMIT 1`, values)
  return result.rows[0] || null
}
function duplicatePatientError(duplicate: { duplicate_field: string }) { return httpError(`A patient with this ${duplicate.duplicate_field === 'email' ? 'email address' : 'mobile number'} already exists`, 409) }
async function audit(s: string, req: TenantRequest, action: string, entity: string, id: string, values: unknown, db: any = pool) { await db.query(`INSERT INTO ${s}.audit_logs (user_id, action, entity_type, entity_id, new_values) VALUES ($1,$2,$3,$4,$5)`, [actor(req), action, entity, id, values]) }
async function ensureDentistNotesTable(s: string) { await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.dentist_notes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(160) NOT NULL, content TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'), is_active BOOLEAN NOT NULL DEFAULT TRUE, created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`); await pool.query(`ALTER TABLE ${s}.dentist_notes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`); await pool.query(`ALTER TABLE ${s}.dentist_notes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`); await pool.query(`UPDATE ${s}.dentist_notes SET expires_at = created_at + INTERVAL '1 month' WHERE expires_at IS NULL`); await pool.query(`UPDATE ${s}.dentist_notes SET is_active = FALSE WHERE is_active AND expires_at <= NOW()`) }

const profileTableInitializers = new Map<string, Promise<void>>()
function ensurePatientProfileTables(s: string) {
  const existing = profileTableInitializers.get(s)
  if (existing) return existing
  const initializer = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.prescriptions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES ${s}.patients(id) ON DELETE CASCADE, medication_name VARCHAR(255) NOT NULL, dosage VARCHAR(100), frequency VARCHAR(100), duration VARCHAR(100), instructions TEXT, prescribed_by VARCHAR(255), start_date DATE, end_date DATE, created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.patient_reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES ${s}.patients(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, report_type VARCHAR(100), description TEXT, report_date DATE, attachment_name VARCHAR(255), attachment_mime_type VARCHAR(150), attachment_size INTEGER, attachment_data BYTEA, created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.lab_orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES ${s}.patients(id) ON DELETE CASCADE, test_name VARCHAR(255) NOT NULL, lab_name VARCHAR(255) NOT NULL, lab_email VARCHAR(255), lab_phone VARCHAR(50), priority VARCHAR(30) NOT NULL DEFAULT 'routine', instructions TEXT, status VARCHAR(30) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'cancelled')), created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK (lab_email IS NOT NULL OR lab_phone IS NOT NULL))`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(64)`)
    await pool.query(`UPDATE ${s}.lab_orders SET order_number = 'LEGACY-' || LEFT(id::text, 8) WHERE order_number IS NULL`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ALTER COLUMN order_number SET NOT NULL`)
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS lab_orders_order_number_unique ON ${s}.lab_orders (order_number)`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS teeth_creation_service TEXT`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255)`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(150)`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS attachment_size INTEGER`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS attachment_data BYTEA`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS copy_to_patient BOOLEAN NOT NULL DEFAULT TRUE`)
    await pool.query(`ALTER TABLE ${s}.lab_orders ADD COLUMN IF NOT EXISTS copy_to_clinic BOOLEAN NOT NULL DEFAULT FALSE`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.lab_order_dispatches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lab_order_id UUID NOT NULL REFERENCES ${s}.lab_orders(id) ON DELETE CASCADE, recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('lab', 'patient', 'clinic')), channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms')), recipient VARCHAR(255) NOT NULL, recipient_name VARCHAR(255), status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed')), attachment_name VARCHAR(255), attachment_mime_type VARCHAR(150), attachment_size INTEGER, created_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON ${s}.prescriptions (patient_id, created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_patient_reports_patient ON ${s}.patient_reports (patient_id, created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON ${s}.lab_orders (patient_id, created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_lab_order_dispatches_order ON ${s}.lab_order_dispatches (lab_order_id, created_at DESC)`)
  })()
  profileTableInitializers.set(s, initializer)
  initializer.catch(() => profileTableInitializers.delete(s))
  return initializer
}

function httpError(message: string, status: number) { const error = new Error(message) as Error & { status?: number }; error.status = status; return error }

export class PatientController {
  static async getDashboardData(req: TenantRequest, res: any) {
    try {
      const s = schema(req)
      const [appointments, calendar, stats, followUps] = await Promise.all([
        pool.query(`SELECT a.*, p.first_name, p.last_name, p.phone, p.email, p.gender, p.date_of_birth FROM ${s}.appointments a JOIN ${s}.patients p ON p.id = a.patient_id WHERE a.appointment_date = CURRENT_DATE AND a.status <> 'cancelled' ORDER BY a.appointment_time`),
        pool.query(`SELECT appointment_date, COUNT(*)::int AS count FROM ${s}.appointments WHERE appointment_date >= DATE_TRUNC('month', CURRENT_DATE)::date AND appointment_date < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date AND status <> 'cancelled' GROUP BY appointment_date ORDER BY appointment_date`),
        pool.query(`SELECT (SELECT COUNT(DISTINCT patient_id) FROM ${s}.appointments WHERE appointment_date = CURRENT_DATE AND status <> 'cancelled')::int AS today_visits, (SELECT COUNT(*) FROM ${s}.patients WHERE created_at::date = CURRENT_DATE AND is_active)::int AS new_patients_today, (SELECT COUNT(*) FROM ${s}.appointments WHERE appointment_date = CURRENT_DATE AND status <> 'cancelled')::int AS total_appointments_today, (SELECT COUNT(*) FROM ${s}.patients WHERE is_active)::int AS total_patients`),
        pool.query(`SELECT a.id, a.appointment_date, a.appointment_time, a.reason, a.follow_up_date, p.first_name, p.last_name FROM ${s}.appointments a JOIN ${s}.patients p ON p.id = a.patient_id WHERE a.follow_up_required AND a.follow_up_date >= CURRENT_DATE ORDER BY a.follow_up_date, a.appointment_time LIMIT 10`),
      ])
      return res.json({ success: true, data: { todaysAppointments: appointments.rows, calendarData: calendar.rows, upcomingFollowUps: followUps.rows, stats: stats.rows[0], currentDate: { month: new Date().getMonth() + 1, year: new Date().getFullYear(), today: new Date().toISOString().slice(0, 10) } } })
    } catch (error) { return sendError(res, error, 'Failed to fetch dashboard data') }
  }

  static async getPatients(req: TenantRequest, res: any) {
    try {
      const s = schema(req); const limit = parsePositiveInt(req.query.limit, 25, 100); const offset = parsePositiveInt(req.query.offset, 0, 100000); const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''; const values: unknown[] = []; const where = search ? `AND (p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR p.phone ILIKE $1 OR p.email ILIKE $1)` : ''; if (search) values.push(`%${search}%`); values.push(limit, offset)
      const [rows, count] = await Promise.all([pool.query(`SELECT p.*, (SELECT MAX(a.appointment_date) FROM ${s}.appointments a WHERE a.patient_id = p.id AND a.status = 'completed') AS last_visit, (SELECT MIN(a.appointment_date) FROM ${s}.appointments a WHERE a.patient_id = p.id AND a.appointment_date >= CURRENT_DATE AND a.status NOT IN ('cancelled', 'completed')) AS next_appointment FROM ${s}.patients p WHERE p.is_active ${where} ORDER BY p.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values), pool.query(`SELECT COUNT(*)::int AS total FROM ${s}.patients p WHERE p.is_active ${where}`, search ? [values[0]] : [])])
      return res.json({ success: true, data: rows.rows, meta: { total: count.rows[0].total, limit, offset } })
    } catch (error) { return sendError(res, error, 'Failed to fetch patients') }
  }

  static async getPatientById(req: TenantRequest, res: any) { try { const id = param(req, 'id'); const s = schema(req); const result = await pool.query(`SELECT * FROM ${s}.patients WHERE id = $1 AND is_active`, [id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' }); const appointments = await pool.query(`SELECT * FROM ${s}.appointments WHERE patient_id = $1 ORDER BY appointment_date DESC, appointment_time DESC`, [id]); return res.json({ success: true, data: { ...result.rows[0], appointments: appointments.rows } }) } catch (error) { return sendError(res, error, 'Failed to fetch patient') } }

  static async createPatient(req: TenantRequest, res: any) { try { const input = patientInput.parse(req.body); const s = schema(req); const email = normalizeEmail(input.email); const phone = normalizePhone(input.phone); const duplicate = await findDuplicatePatient(s, email, phone); if (duplicate) throw duplicatePatientError(duplicate); const result = await pool.query(`INSERT INTO ${s}.patients (first_name,last_name,date_of_birth,gender,email,phone,address_line1,city,state,postal_code,notes,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [input.firstName, input.lastName, input.dateOfBirth || null, input.gender || null, email, input.phone || null, input.addressLine1 || null, input.city || null, input.state || null, input.postalCode || null, input.notes || null, actor(req)]); await audit(s, req, 'create', 'patient', result.rows[0].id, result.rows[0]); return res.status(201).json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to create patient') } }

  static async updatePatient(req: TenantRequest, res: any) { try { const input = patientInput.partial().parse(req.body); const id = uuidParam(req, 'id'); const s = schema(req); if (input.email !== undefined || input.phone !== undefined) { const current = await pool.query(`SELECT email, phone FROM ${s}.patients WHERE id = $1 AND is_active`, [id]); if (!current.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' }); const duplicate = await findDuplicatePatient(s, input.email === undefined ? normalizeEmail(current.rows[0].email) : normalizeEmail(input.email), input.phone === undefined ? normalizePhone(current.rows[0].phone) : normalizePhone(input.phone), id); if (duplicate) throw duplicatePatientError(duplicate) } const normalizedInput = { ...input, ...(input.email !== undefined ? { email: normalizeEmail(input.email) } : {}) }; const names: Record<string, string> = { firstName: 'first_name', lastName: 'last_name', dateOfBirth: 'date_of_birth', addressLine1: 'address_line1', postalCode: 'postal_code' }; const fields = Object.entries(normalizedInput); if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' }); const assignments = fields.map(([key], index) => `${names[key] || key} = $${index + 1}`); const result = await pool.query(`UPDATE ${s}.patients SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${fields.length + 1} AND is_active RETURNING *`, [...fields.map(([, value]) => value), id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' }); await audit(s, req, 'update', 'patient', id, result.rows[0]); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to update patient') } }

  static async deletePatient(req: TenantRequest, res: any) { try { const id = param(req, 'id'); const s = schema(req); const result = await pool.query(`UPDATE ${s}.patients SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND is_active RETURNING id`, [id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' }); await audit(s, req, 'archive', 'patient', id, result.rows[0]); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to archive patient') } }

  static async getAppointments(req: TenantRequest, res: any) { try { const s = schema(req); const from = typeof req.query.from === 'string' ? req.query.from : new Date().toISOString().slice(0, 10); const to = typeof req.query.to === 'string' ? req.query.to : from; const values: unknown[] = [from, to]; const status = typeof req.query.status === 'string' ? req.query.status : ''; const statusClause = status ? 'AND a.status = $3' : ''; if (status) values.push(status); const result = await pool.query(`SELECT a.*, p.first_name, p.last_name, p.phone, p.email FROM ${s}.appointments a JOIN ${s}.patients p ON p.id = a.patient_id WHERE a.appointment_date BETWEEN $1 AND $2 ${statusClause} ORDER BY a.appointment_date, a.appointment_time`, values); return res.json({ success: true, data: result.rows }) } catch (error) { return sendError(res, error, 'Failed to fetch appointments') } }
  static async getTodaysAppointments(req: TenantRequest, res: any) { req.query.from = new Date().toISOString().slice(0, 10); req.query.to = req.query.from; return PatientController.getAppointments(req, res) }
  static async getCalendarAppointments(req: TenantRequest, res: any) { return PatientController.getAppointments(req, res) }
  static async getAppointmentById(req: TenantRequest, res: any) { try { const id = param(req, 'id'); const s = schema(req); const result = await pool.query(`SELECT a.*, p.first_name, p.last_name, p.phone, p.email FROM ${s}.appointments a JOIN ${s}.patients p ON p.id = a.patient_id WHERE a.id = $1`, [id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Appointment not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to fetch appointment') } }

  static async createAppointment(req: TenantRequest, res: any) { try { const input = appointmentInput.parse(req.body); const s = schema(req); const conflict = await pool.query(`SELECT id FROM ${s}.appointments WHERE appointment_date = $1 AND appointment_time = $2 AND status NOT IN ('cancelled','completed') LIMIT 1`, [input.appointmentDate, input.appointmentTime]); if (conflict.rowCount) return res.status(409).json({ success: false, message: 'Appointment slot is already booked' }); const result = await pool.query(`INSERT INTO ${s}.appointments (patient_id,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [input.patientId, input.appointmentDate, input.appointmentTime, input.duration, input.appointmentType, input.status, input.reason || null, input.notes || null, input.followUpRequired, input.followUpDate || null, actor(req)]); return res.status(201).json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to create appointment') } }
  static async updateAppointment(req: TenantRequest, res: any) { try { const input = appointmentInput.partial().parse(req.body); const id = uuidParam(req, 'id'); const s = schema(req); const names: Record<string, string> = { patientId: 'patient_id', appointmentDate: 'appointment_date', appointmentTime: 'appointment_time', appointmentType: 'appointment_type', followUpRequired: 'follow_up_required', followUpDate: 'follow_up_date' }; const fields = Object.entries(input); if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' }); if (input.appointmentDate || input.appointmentTime) { const current = await pool.query(`SELECT appointment_date, appointment_time FROM ${s}.appointments WHERE id = $1`, [id]); if (!current.rowCount) return res.status(404).json({ success: false, message: 'Appointment not found' }); const appointmentDate = input.appointmentDate || current.rows[0].appointment_date; const appointmentTime = input.appointmentTime || current.rows[0].appointment_time; const conflict = await pool.query(`SELECT id FROM ${s}.appointments WHERE id <> $1 AND appointment_date = $2 AND appointment_time = $3 AND status NOT IN ('cancelled','completed') LIMIT 1`, [id, appointmentDate, appointmentTime]); if (conflict.rowCount) return res.status(409).json({ success: false, message: 'Appointment slot is already booked' }) } const assignments = fields.map(([key], index) => `${names[key] || key} = $${index + 1}`); const result = await pool.query(`UPDATE ${s}.appointments SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`, [...fields.map(([, value]) => value), id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Appointment not found' }); await audit(s, req, 'update', 'appointment', id, result.rows[0]); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to update appointment') } }
  static async deleteAppointment(req: TenantRequest, res: any) { try { const result = await pool.query(`UPDATE ${schema(req)}.appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status <> 'cancelled' RETURNING id`, [req.params.id]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Appointment not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to cancel appointment') } }
  static async getStatsSummary(req: TenantRequest, res: any) { try { const s = schema(req); const result = await pool.query(`SELECT (SELECT COUNT(*)::int FROM ${s}.patients WHERE is_active) AS total_patients, (SELECT COUNT(*)::int FROM ${s}.appointments WHERE appointment_date = CURRENT_DATE AND status <> 'cancelled') AS appointments_today, (SELECT COUNT(*)::int FROM ${s}.appointments WHERE status = 'completed' AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)) AS completed_this_month`); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to fetch statistics') } }
  static async getVisitsStats(req: TenantRequest, res: any) { try { const result = await pool.query(`SELECT appointment_date, COUNT(*)::int AS visits FROM ${schema(req)}.appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days' AND status <> 'cancelled' GROUP BY appointment_date ORDER BY appointment_date`); return res.json({ success: true, data: result.rows }) } catch (error) { return sendError(res, error, 'Failed to fetch visit statistics') } }

  static async createBooking(req: TenantRequest, res: any) { try { const input = bookingInput.parse(req.body); const s = schema(req); const email = normalizeEmail(input.email)!; const phone = normalizePhone(input.phone)!; const result = await withTransaction(async (client) => { const existing = await client.query(`SELECT id FROM ${s}.patients WHERE is_active AND (LOWER(email) = $1 OR regexp_replace(phone, '\\D', '', 'g') = $2) ORDER BY created_at DESC LIMIT 1`, [email, phone]); const patient = existing.rows[0] || (await client.query(`INSERT INTO ${s}.patients (first_name,last_name,email,phone,date_of_birth,gender,notes,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [input.firstName, input.lastName, email, input.phone.trim(), input.dateOfBirth || null, input.gender || null, input.notes || null, actor(req)])).rows[0]; const conflict = await client.query(`SELECT id FROM ${s}.appointments WHERE appointment_date = $1 AND appointment_time = $2 AND status NOT IN ('cancelled','completed') LIMIT 1`, [input.appointmentDate, input.appointmentTime]); if (conflict.rowCount) { const error = new Error('Appointment slot is already booked') as Error & { status?: number }; error.status = 409; throw error } const appointment = await client.query(`INSERT INTO ${s}.appointments (patient_id,appointment_date,appointment_time,duration,appointment_type,status,reason,notes,follow_up_required,follow_up_date,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, [patient.id, input.appointmentDate, input.appointmentTime, input.duration, input.appointmentType, input.status, input.reason || null, input.notes || null, input.followUpRequired, input.followUpDate || null, actor(req)]); return { patientId: patient.id, appointmentId: appointment.rows[0].id, appointmentDate: input.appointmentDate, appointmentTime: input.appointmentTime } }); return res.status(201).json({ success: true, data: result }) } catch (error) { return sendError(res, error, 'Failed to create booking') } }
  static async getDentistNotes(req: TenantRequest, res: any) { try { const s = schema(req); await ensureDentistNotesTable(s); const result = await pool.query(`SELECT id, title, content, expires_at, is_active, created_by, created_at, updated_at FROM ${s}.dentist_notes WHERE is_active ORDER BY updated_at DESC, created_at DESC`); return res.json({ success: true, data: result.rows }) } catch (error) { return sendError(res, error, 'Failed to fetch dentist notes') } }
  static async createDentistNote(req: TenantRequest, res: any) { try { const input = noteInput.parse(req.body); const s = schema(req); const expiration = input.expiresAt || defaultDentistNoteExpiration().toISOString(); await ensureDentistNotesTable(s); const result = await pool.query(`INSERT INTO ${s}.dentist_notes (title, content, expires_at, is_active, created_by) VALUES ($1,$2,$3::timestamptz,TRUE,$4) RETURNING id, title, content, expires_at, is_active, created_by, created_at, updated_at`, [input.title, input.content, expiration, actor(req)]); await audit(s, req, 'create', 'dentist_note', result.rows[0].id, result.rows[0]); return res.status(201).json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to create dentist note') } }
  static async updateDentistNote(req: TenantRequest, res: any) { try { const input = noteInput.parse(req.body); const s = schema(req); const expiration = input.expiresAt || defaultDentistNoteExpiration().toISOString(); await ensureDentistNotesTable(s); const result = await pool.query(`UPDATE ${s}.dentist_notes SET title = $1, content = $2, expires_at = $3::timestamptz, is_active = TRUE, updated_at = NOW() WHERE id = $4 RETURNING id, title, content, expires_at, is_active, created_by, created_at, updated_at`, [input.title, input.content, expiration, param(req, 'id')]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Dentist note not found' }); await audit(s, req, 'update', 'dentist_note', result.rows[0].id, result.rows[0]); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to update dentist note') } }
  static async deleteDentistNote(req: TenantRequest, res: any) { try { const s = schema(req); await ensureDentistNotesTable(s); const result = await pool.query(`UPDATE ${s}.dentist_notes SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND is_active RETURNING id, is_active`, [param(req, 'id')]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Dentist note not found' }); await audit(s, req, 'archive', 'dentist_note', result.rows[0].id, result.rows[0]); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to archive dentist note') } }

  static async getPatientProfile(req: TenantRequest, res: any) {
    try {
      const id = uuidParam(req, 'id'); const s = schema(req); await ensurePatientProfileTables(s)
      const patient = await pool.query(`SELECT * FROM ${s}.patients WHERE id = $1 AND is_active`, [id])
      if (!patient.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' })
      const [appointments, prescriptions, reports, labOrders, dispatchHistory] = await Promise.all([
        pool.query(`SELECT * FROM ${s}.appointments WHERE patient_id = $1 ORDER BY appointment_date DESC, appointment_time DESC`, [id]),
        pool.query(`SELECT id, patient_id, medication_name, dosage, frequency, duration, instructions, prescribed_by, start_date, end_date, created_by, created_at, updated_at FROM ${s}.prescriptions WHERE patient_id = $1 ORDER BY created_at DESC`, [id]),
        pool.query(`SELECT id, patient_id, title, report_type, description, report_date, attachment_name, attachment_mime_type, attachment_size, created_by, created_at, updated_at FROM ${s}.patient_reports WHERE patient_id = $1 ORDER BY COALESCE(report_date, created_at::date) DESC, created_at DESC`, [id]),
        pool.query(`SELECT id, patient_id, order_number, test_name, teeth_creation_service, lab_name, lab_email, lab_phone, priority, instructions, attachment_name, attachment_mime_type, attachment_size, copy_to_patient, copy_to_clinic, status, created_by, created_at, updated_at FROM ${s}.lab_orders WHERE patient_id = $1 ORDER BY created_at DESC`, [id]),
        pool.query(`SELECT d.* FROM ${s}.lab_order_dispatches d JOIN ${s}.lab_orders o ON o.id = d.lab_order_id WHERE o.patient_id = $1 ORDER BY d.created_at DESC`, [id]),
      ])
      return res.json({ success: true, data: { patient: patient.rows[0], appointments: appointments.rows, prescriptions: prescriptions.rows, reports: reports.rows, labOrders: labOrders.rows, dispatchHistory: dispatchHistory.rows } })
    } catch (error) { return sendError(res, error, 'Failed to fetch patient profile') }
  }

  static async createPrescription(req: TenantRequest, res: any) {
    try {
      const input = prescriptionInput.parse(req.body); const id = uuidParam(req, 'id'); const s = schema(req); await ensurePatientProfileTables(s)
      const medicationName = input.medicationName || input.medication || input.name
      const result = await pool.query(`INSERT INTO ${s}.prescriptions (patient_id, medication_name, dosage, frequency, duration, instructions, prescribed_by, start_date, end_date, created_by) SELECT id, $2, $3, $4, $5, $6, $7, $8, $9, $10 FROM ${s}.patients WHERE id = $1 AND is_active RETURNING id, patient_id, medication_name, dosage, frequency, duration, instructions, prescribed_by, start_date, end_date, created_by, created_at, updated_at`, [id, medicationName, input.dosage || null, input.frequency || null, input.duration || null, input.instructions || null, input.prescribedBy || null, input.startDate || null, input.endDate || null, actor(req)])
      if (!result.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' })
      await audit(s, req, 'create', 'prescription', result.rows[0].id, result.rows[0]); return res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error) { return sendError(res, error, 'Failed to create prescription') }
  }

  static async updatePrescription(req: TenantRequest, res: any) {
    try {
      const input = prescriptionInput.partial().parse(req.body); const patientId = uuidParam(req, 'id'); const prescriptionId = uuidParam(req, 'prescriptionId'); const s = schema(req); await ensurePatientProfileTables(s)
      const medicationName = input.medicationName || input.medication || input.name
      const fields: Array<[string, unknown]> = []
      if (medicationName !== undefined) fields.push(['medication_name', medicationName])
      for (const [key, column] of [['dosage', 'dosage'], ['frequency', 'frequency'], ['duration', 'duration'], ['instructions', 'instructions'], ['prescribedBy', 'prescribed_by'], ['startDate', 'start_date'], ['endDate', 'end_date']] as const) if (input[key] !== undefined) fields.push([column, input[key] || null])
      if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' })
      const assignments = fields.map(([column], index) => `${column} = $${index + 1}`)
      const result = await pool.query(`UPDATE ${s}.prescriptions SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${fields.length + 1} AND patient_id = $${fields.length + 2} AND EXISTS (SELECT 1 FROM ${s}.patients WHERE id = $${fields.length + 2} AND is_active) RETURNING id, patient_id, medication_name, dosage, frequency, duration, instructions, prescribed_by, start_date, end_date, created_by, created_at, updated_at`, [...fields.map(([, value]) => value), prescriptionId, patientId])
      if (!result.rowCount) return res.status(404).json({ success: false, message: 'Prescription not found' })
      await audit(s, req, 'update', 'prescription', prescriptionId, result.rows[0]); return res.json({ success: true, data: result.rows[0] })
    } catch (error) { return sendError(res, error, 'Failed to update prescription') }
  }

  static async createReport(req: TenantRequest, res: any) {
    try {
      const input = reportInput.parse(req.body); const id = uuidParam(req, 'id'); const s = schema(req); await ensurePatientProfileTables(s)
      const attachment = input.attachmentData ? Buffer.from(input.attachmentData, 'base64') : null
      const result = await pool.query(`INSERT INTO ${s}.patient_reports (patient_id, title, report_type, description, report_date, attachment_name, attachment_mime_type, attachment_size, attachment_data, created_by) SELECT id, $2, $3, $4, $5, $6, $7, $8, $9, $10 FROM ${s}.patients WHERE id = $1 AND is_active RETURNING id, patient_id, title, report_type, description, report_date, attachment_name, attachment_mime_type, attachment_size, created_by, created_at, updated_at`, [id, input.title, input.reportType || null, input.description || null, input.reportDate || null, input.attachmentName || null, input.attachmentMimeType || null, attachment?.length || null, attachment, actor(req)])
      if (!result.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' })
      await audit(s, req, 'create', 'patient_report', result.rows[0].id, result.rows[0]); return res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error) { return sendError(res, error, 'Failed to create patient report') }
  }

  static async downloadReport(req: TenantRequest, res: any) {
    try {
      const patientId = uuidParam(req, 'id'); const reportId = uuidParam(req, 'reportId'); const s = schema(req); await ensurePatientProfileTables(s)
      const result = await pool.query(`SELECT attachment_name, attachment_mime_type, attachment_data FROM ${s}.patient_reports WHERE id = $1 AND patient_id = $2`, [reportId, patientId])
      if (!result.rowCount) return res.status(404).json({ success: false, message: 'Report not found' })
      const report = result.rows[0]; if (!report.attachment_data) return res.status(404).json({ success: false, message: 'Report has no attachment' })
      const filename = String(report.attachment_name || 'report').replace(/[^a-zA-Z0-9._-]/g, '_')
      res.setHeader('Content-Type', report.attachment_mime_type || 'application/octet-stream'); res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); return res.send(report.attachment_data)
    } catch (error) { return sendError(res, error, 'Failed to download report') }
  }

  static async createLabOrder(req: TenantRequest, res: any) {
    try {
      const input = labOrderInput.parse(req.body); const patientId = uuidParam(req, 'id'); const s = schema(req); await ensurePatientProfileTables(s)
      const result = await withTransaction(async (client) => {
        const patientResult = await client.query(`SELECT id, first_name, last_name, email, phone FROM ${s}.patients WHERE id = $1 AND is_active FOR UPDATE`, [patientId])
        if (!patientResult.rowCount) throw httpError('Patient not found', 404)
        const patient = patientResult.rows[0]; const testName = input.testName || input.test || input.tests; const orderNumber = input.orderNumber || `LAB-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`
        const attachment = input.attachmentData ? Buffer.from(input.attachmentData, 'base64') : null
        const orderResult = await client.query(`INSERT INTO ${s}.lab_orders (patient_id, order_number, test_name, teeth_creation_service, lab_name, lab_email, lab_phone, priority, instructions, attachment_name, attachment_mime_type, attachment_size, attachment_data, copy_to_patient, copy_to_clinic, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'queued',$16) RETURNING id, patient_id, order_number, test_name, teeth_creation_service, lab_name, lab_email, lab_phone, priority, instructions, attachment_name, attachment_mime_type, attachment_size, copy_to_patient, copy_to_clinic, status, created_by, created_at, updated_at`, [patientId, orderNumber, testName, input.teethCreationService || null, input.labName, input.labEmail || null, input.labPhone || null, input.priority, input.instructions || null, input.attachmentName || null, input.attachmentMimeType || null, input.attachmentSize || attachment?.length || null, attachment, input.copyToPatient, input.copyToClinic || input.sendClinicCopy, actor(req)])
        const order = orderResult.rows[0]
        await audit(s, req, 'create', 'lab_order', order.id, order, client)
        const contacts: Array<{ type: 'lab' | 'patient' | 'clinic'; name: string; email?: string | null; phone?: string | null }> = [
          { type: 'lab', name: input.labName, email: input.labEmail, phone: input.labPhone },
          ...(input.copyToPatient ? [{ type: 'patient' as const, name: `${patient.first_name} ${patient.last_name}`.trim(), email: patient.email, phone: patient.phone }] : []),
        ]
        const clinicContacts = [{ email: input.clinicEmail, phone: input.clinicPhone }, ...input.clinicCopies]
        if (input.copyToClinic || input.sendClinicCopy || clinicContacts.some((contact) => contact.email || contact.phone)) {
          if ((input.copyToClinic || input.sendClinicCopy) && !clinicContacts.some((contact) => contact.email || contact.phone)) {
            const settings = await client.query(`SELECT clinic_name, clinic_email, phone FROM ${s}.clinic_settings WHERE id = TRUE`)
            if (settings.rowCount) clinicContacts.push({ email: settings.rows[0].clinic_email, phone: settings.rows[0].phone })
          }
          for (const contact of clinicContacts) contacts.push({ type: 'clinic', name: 'Clinic', email: contact.email, phone: contact.phone })
        }
        for (const contact of contacts) {
          for (const [channel, recipient] of [['email', contact.email], ['sms', contact.phone]] as const) {
            if (!recipient) continue
            await client.query(`INSERT INTO ${s}.lab_order_dispatches (lab_order_id, recipient_type, channel, recipient, recipient_name, status, attachment_name, attachment_mime_type, attachment_size, created_by) VALUES ($1,$2,$3,$4,$5,'queued',$6,$7,$8,$9)`, [order.id, contact.type, channel, recipient, contact.name, input.attachmentName || null, input.attachmentMimeType || null, input.attachmentSize || null, actor(req)])
          }
        }
        return order
      })
      return res.status(201).json({ success: true, data: result })
    } catch (error) { return sendError(res, error, 'Failed to create lab order') }
  }

  static async downloadLabOrder(req: TenantRequest, res: any) {
    try {
      const patientId = uuidParam(req, 'id'); const orderId = uuidParam(req, 'orderId'); const s = schema(req); await ensurePatientProfileTables(s)
      const result = await pool.query(`SELECT attachment_name, attachment_mime_type, attachment_data FROM ${s}.lab_orders WHERE id = $1 AND patient_id = $2`, [orderId, patientId])
      if (!result.rowCount) return res.status(404).json({ success: false, message: 'Lab order not found' })
      const order = result.rows[0]; if (!order.attachment_data) return res.status(404).json({ success: false, message: 'Lab order PDF is not available' })
      const filename = String(order.attachment_name || 'lab-order.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')
      res.setHeader('Content-Type', order.attachment_mime_type || 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); return res.send(order.attachment_data)
    } catch (error) { return sendError(res, error, 'Failed to download lab order') }
  }
}
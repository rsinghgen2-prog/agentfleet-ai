import { z } from 'zod'
import { pool } from '../config/database.js'
import type { TenantRequest } from '../types.js'
import { quoteIdentifier } from '../utils/sql.js'

const treatmentInput = z.object({
  title: z.string().trim().min(1).max(255),
  tooth: z.string().trim().max(80).default(''),
  status: z.enum(['recommended', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled']).default('recommended'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedCost: z.coerce.number().min(0).nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
  notes: z.string().trim().max(5000).default(''),
})
const toothInput = z.object({
  conditions: z.array(z.string().trim().max(80)).max(20).default([]),
  painLevel: z.coerce.number().int().min(0).max(10).default(0),
  status: z.enum(['active', 'resolved', 'monitoring']).default('active'),
  notes: z.string().trim().max(5000).default(''),
})

function schema(req: TenantRequest) { if (!req.tenant) throw new Error('Tenant context is missing'); return quoteIdentifier(req.tenant.schemaName) }
function actor(req: TenantRequest) { return req.user?.userId || null }
function idParam(req: TenantRequest) { return z.string().uuid().parse(req.params.id) }
function patientIdParam(req: TenantRequest) { return z.string().uuid().parse(req.params.patientId) }
function sendError(res: any, error: unknown, message: string) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); console.error(error); return res.status(500).json({ success: false, message }) }

const initializers = new Map<string, Promise<void>>()
function ensureClinicalTables(s: string) {
  const existing = initializers.get(s)
  if (existing) return existing
  const setup = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.treatment_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES ${s}.patients(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, tooth VARCHAR(80) NOT NULL DEFAULT '', status VARCHAR(30) NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended','accepted','scheduled','in_progress','completed','cancelled')), priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')), estimated_cost NUMERIC(12,2), due_date DATE, notes TEXT NOT NULL DEFAULT '', created_by UUID REFERENCES ${s}.users(id), updated_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.patient_tooth_records (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES ${s}.patients(id) ON DELETE CASCADE, tooth_number SMALLINT NOT NULL CHECK (tooth_number BETWEEN 11 AND 48), conditions JSONB NOT NULL DEFAULT '[]'::jsonb, pain_level INTEGER NOT NULL DEFAULT 0 CHECK (pain_level BETWEEN 0 AND 10), status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','monitoring')), notes TEXT NOT NULL DEFAULT '', created_by UUID REFERENCES ${s}.users(id), updated_by UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(patient_id, tooth_number))`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON ${s}.treatment_plans (patient_id, status, due_date)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tooth_records_patient ON ${s}.patient_tooth_records (patient_id, tooth_number)`)
  })()
  initializers.set(s, setup)
  setup.catch(() => initializers.delete(s))
  return setup
}

export class ClinicalController {
  static async listTreatmentPlans(req: TenantRequest, res: any) { try { const s = schema(req); const patientId = patientIdParam(req); await ensureClinicalTables(s); const result = await pool.query(`SELECT * FROM ${s}.treatment_plans WHERE patient_id = $1 ORDER BY CASE status WHEN 'in_progress' THEN 1 WHEN 'scheduled' THEN 2 WHEN 'accepted' THEN 3 WHEN 'recommended' THEN 4 WHEN 'completed' THEN 5 ELSE 6 END, due_date NULLS LAST, created_at DESC`, [patientId]); return res.json({ success: true, data: result.rows }) } catch (error) { return sendError(res, error, 'Failed to fetch treatment plans') } }
  static async createTreatmentPlan(req: TenantRequest, res: any) { try { const input = treatmentInput.parse(req.body); const s = schema(req); const patientId = patientIdParam(req); await ensureClinicalTables(s); const result = await pool.query(`INSERT INTO ${s}.treatment_plans (patient_id,title,tooth,status,priority,estimated_cost,due_date,notes,created_by,updated_by) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$9 WHERE EXISTS (SELECT 1 FROM ${s}.patients WHERE id = $1 AND is_active) RETURNING *`, [patientId, input.title, input.tooth, input.status, input.priority, input.estimatedCost ?? null, input.dueDate ?? null, input.notes, actor(req)]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Patient not found' }); return res.status(201).json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to create treatment plan') } }
  static async updateTreatmentPlan(req: TenantRequest, res: any) { try { const input = treatmentInput.partial().parse(req.body); const s = schema(req); const planId = idParam(req); await ensureClinicalTables(s); const entries = Object.entries(input); if (!entries.length) return res.status(400).json({ success: false, message: 'No fields to update' }); const names: Record<string, string> = { estimatedCost: 'estimated_cost', dueDate: 'due_date' }; const assignments = entries.map(([key], index) => `${names[key] || key} = $${index + 1}`); const result = await pool.query(`UPDATE ${s}.treatment_plans SET ${assignments.join(', ')}, updated_by = $${entries.length + 1}, updated_at = NOW() WHERE id = $${entries.length + 2} RETURNING *`, [...entries.map(([, value]) => value), actor(req), planId]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Treatment plan not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to update treatment plan') } }
  static async deleteTreatmentPlan(req: TenantRequest, res: any) { try { const s = schema(req); const planId = idParam(req); await ensureClinicalTables(s); const result = await pool.query(`UPDATE ${s}.treatment_plans SET status = 'cancelled', updated_by = $1, updated_at = NOW() WHERE id = $2 RETURNING id`, [actor(req), planId]); if (!result.rowCount) return res.status(404).json({ success: false, message: 'Treatment plan not found' }); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to cancel treatment plan') } }
  static async listToothRecords(req: TenantRequest, res: any) { try { const s = schema(req); const patientId = patientIdParam(req); await ensureClinicalTables(s); const result = await pool.query(`SELECT * FROM ${s}.patient_tooth_records WHERE patient_id = $1 ORDER BY tooth_number`, [patientId]); return res.json({ success: true, data: result.rows }) } catch (error) { return sendError(res, error, 'Failed to fetch dental chart') } }
  static async upsertToothRecord(req: TenantRequest, res: any) { try { const input = toothInput.parse(req.body); const s = schema(req); const patientId = patientIdParam(req); const toothNumber = z.coerce.number().int().min(11).max(48).parse(req.params.toothNumber); await ensureClinicalTables(s); const result = await pool.query(`INSERT INTO ${s}.patient_tooth_records (patient_id,tooth_number,conditions,pain_level,status,notes,created_by,updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$7) ON CONFLICT (patient_id,tooth_number) DO UPDATE SET conditions=EXCLUDED.conditions,pain_level=EXCLUDED.pain_level,status=EXCLUDED.status,notes=EXCLUDED.notes,updated_by=EXCLUDED.updated_by,updated_at=NOW() RETURNING *`, [patientId, toothNumber, JSON.stringify(input.conditions), input.painLevel, input.status, input.notes, actor(req)]); return res.json({ success: true, data: result.rows[0] }) } catch (error) { return sendError(res, error, 'Failed to save tooth record') } }
}

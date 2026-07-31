import { z } from 'zod'
import type { Response } from 'express'
import { pool } from '../config/database.js'
import type { TenantRequest } from '../types.js'
import { quoteIdentifier } from '../utils/sql.js'

const conversationInput = z.object({ subject: z.string().trim().min(1).max(160).default('Hospital support') })
const messageInput = z.object({ body: z.string().trim().min(1).max(5000) })
const supportTableInitializers = new Map<string, Promise<void>>()

function schema(req: TenantRequest) { if (!req.tenant) throw new Error('Tenant context is missing'); return quoteIdentifier(req.tenant.schemaName) }
function actor(req: TenantRequest) { return req.user?.userId || null }
function isSupportAgent(req: TenantRequest) { return ['admin', 'semi_admin', 'staff'].includes(req.user?.role || '') }
function sendError(res: Response, error: unknown, message: string) { if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues }); console.error(error); return res.status(500).json({ success: false, message }) }

function ensureSupportTables(s: string) {
  const existing = supportTableInitializers.get(s)
  if (existing) return existing
  const initializer = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.support_conversations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), subject VARCHAR(160) NOT NULL DEFAULT 'Hospital support', status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')), created_by UUID NOT NULL REFERENCES ${s}.users(id), assigned_to UUID REFERENCES ${s}.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS ${s}.support_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id UUID NOT NULL REFERENCES ${s}.support_conversations(id) ON DELETE CASCADE, sender_id UUID NOT NULL REFERENCES ${s}.users(id), sender_role VARCHAR(50) NOT NULL, body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await pool.query(`DROP TRIGGER IF EXISTS support_conversations_updated_at ON ${s}.support_conversations`)
    await pool.query(`CREATE TRIGGER support_conversations_updated_at BEFORE UPDATE ON ${s}.support_conversations FOR EACH ROW EXECUTE FUNCTION ${s}.set_updated_at()`)
  })()
  supportTableInitializers.set(s, initializer)
  initializer.catch(() => supportTableInitializers.delete(s))
  return initializer
}

async function audit(s: string, req: TenantRequest, action: string, entity: string, id: string, values: unknown) {
  await pool.query(`INSERT INTO ${s}.audit_logs (user_id, action, entity_type, entity_id, new_values) VALUES ($1,$2,$3,$4,$5)`, [actor(req), action, entity, id, values])
}

async function messages(s: string, conversationId: string) {
  const result = await pool.query(`SELECT m.id, m.conversation_id, m.sender_id, u.full_name AS sender_name, m.sender_role, m.body, m.created_at FROM ${s}.support_messages m JOIN ${s}.users u ON u.id = m.sender_id WHERE m.conversation_id = $1 ORDER BY m.created_at`, [conversationId])
  return result.rows
}

async function accessibleConversation(s: string, req: TenantRequest, id: string) {
  const result = await pool.query(`SELECT id, subject, status, created_by, created_at, updated_at FROM ${s}.support_conversations WHERE id = $1`, [id])
  const conversation = result.rows[0]
  if (!conversation || (conversation.created_by !== actor(req) && !isSupportAgent(req))) return null
  return conversation
}

export class SupportController {
  static async listConversations(req: TenantRequest, res: Response) {
    try {
      if (!isSupportAgent(req)) return res.status(403).json({ success: false, message: 'Support agent access is required' })
      const s = schema(req); await ensureSupportTables(s)
      const result = await pool.query(`SELECT c.id, c.subject, c.status, c.created_by, u.full_name AS requester_name, c.created_at, c.updated_at FROM ${s}.support_conversations c JOIN ${s}.users u ON u.id = c.created_by ORDER BY c.updated_at DESC LIMIT 100`)
      return res.json({ success: true, data: result.rows })
    } catch (error) { return sendError(res, error, 'Failed to fetch support conversations') }
  }

  static async getChat(req: TenantRequest, res: Response) {
    try {
      const s = schema(req); await ensureSupportTables(s)
      const result = await pool.query(`SELECT id, subject, status, created_by, created_at, updated_at FROM ${s}.support_conversations WHERE created_by = $1 ORDER BY updated_at DESC LIMIT 1`, [actor(req)])
      const conversation = result.rows[0] || null
      return res.json({ success: true, data: { conversation, messages: conversation ? await messages(s, conversation.id) : [] } })
    } catch (error) { return sendError(res, error, 'Failed to fetch support chat') }
  }

  static async createConversation(req: TenantRequest, res: Response) {
    try {
      const input = conversationInput.parse(req.body); const s = schema(req); const userId = actor(req)
      if (!userId) return res.status(401).json({ success: false, message: 'Authenticated user is required' })
      await ensureSupportTables(s)
      const result = await pool.query(`INSERT INTO ${s}.support_conversations (subject, created_by) VALUES ($1,$2) RETURNING id, subject, status, created_by, created_at, updated_at`, [input.subject, userId])
      await audit(s, req, 'create', 'support_conversation', result.rows[0].id, result.rows[0])
      return res.status(201).json({ success: true, data: { conversation: result.rows[0], messages: [] } })
    } catch (error) { return sendError(res, error, 'Failed to create support conversation') }
  }

  static async getConversation(req: TenantRequest, res: Response) {
    try {
      const parsedId = z.string().uuid().safeParse(req.params.id)
      if (!parsedId.success) return res.status(400).json({ success: false, message: 'Invalid support conversation id' })
      const s = schema(req); await ensureSupportTables(s); const conversation = await accessibleConversation(s, req, parsedId.data)
      if (!conversation) return res.status(404).json({ success: false, message: 'Support conversation not found' })
      return res.json({ success: true, data: { conversation, messages: await messages(s, conversation.id) } })
    } catch (error) { return sendError(res, error, 'Failed to fetch support conversation') }
  }

  static async sendMessage(req: TenantRequest, res: Response) {
    try {
      const input = messageInput.parse(req.body); const s = schema(req); const userId = actor(req)
      if (!userId) return res.status(401).json({ success: false, message: 'Authenticated user is required' })
      const parsedId = z.string().uuid().safeParse(req.params.id)
      if (!parsedId.success) return res.status(400).json({ success: false, message: 'Invalid support conversation id' })
      await ensureSupportTables(s); const id = parsedId.data; const conversation = await accessibleConversation(s, req, id)
      if (!conversation) return res.status(404).json({ success: false, message: 'Support conversation not found' })
      if (conversation.status === 'closed') return res.status(409).json({ success: false, message: 'Support conversation is closed' })
      const result = await pool.query(`INSERT INTO ${s}.support_messages (conversation_id, sender_id, sender_role, body) VALUES ($1,$2,$3,$4) RETURNING id, conversation_id, sender_id, sender_role, body, created_at`, [id, userId, req.user?.role || 'client', input.body])
      await pool.query(`UPDATE ${s}.support_conversations SET updated_at = NOW() WHERE id = $1`, [id])
      await audit(s, req, 'create', 'support_message', result.rows[0].id, result.rows[0])
      const sender = await pool.query(`SELECT full_name FROM ${s}.users WHERE id = $1`, [userId])
      const message = { ...result.rows[0], sender_name: sender.rows[0]?.full_name || req.user?.email || 'Support participant' }
      return res.status(201).json({ success: true, data: message })
    } catch (error) { return sendError(res, error, 'Failed to send support message') }
  }
}
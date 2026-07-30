import type { NextFunction, Response } from 'express'
import { pool } from '../config/database.js'
import type { TenantRequest } from '../types.js'
import { quoteIdentifier } from '../utils/sql.js'

export async function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user?.tenantId
    if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context is missing' })
    const result = await pool.query(
      `SELECT id, slug, schema_name, settings->>'timezone' AS timezone
       FROM public.tenants
       WHERE id = $1 AND is_active = TRUE AND subscription_status NOT IN ('suspended', 'cancelled')`,
      [tenantId],
    )
    if (result.rowCount !== 1) return res.status(403).json({ success: false, message: 'Tenant is inactive or unavailable' })
    const tenant = result.rows[0]
    quoteIdentifier(tenant.schema_name)
    req.tenant = { id: tenant.id, slug: tenant.slug, schemaName: tenant.schema_name, timezone: tenant.timezone || 'UTC' }
    next()
  } catch (error) {
    next(error)
  }
}
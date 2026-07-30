import jwt from 'jsonwebtoken'
import type { NextFunction, Response } from 'express'
import type { TenantRequest, AuthenticatedUser } from '../types.js'

export function authMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(503).json({ success: false, message: 'Authentication is not configured' })
    const payload = jwt.verify(token, secret) as AuthenticatedUser
    if (!payload.userId || !payload.tenantId) return res.status(401).json({ success: false, message: 'Tenant authentication required' })
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' })
  }
}
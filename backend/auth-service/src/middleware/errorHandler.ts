import type { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled auth-service error', { error })
  if (res.headersSent) return
  res.status(500).json({ success: false, message: 'Internal server error' })
}
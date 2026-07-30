import type { NextFunction, Request, Response } from 'express'

export interface AuthenticatedUser {
  userId: string
  email: string
  tenantId: string
  role: string
  permissions: string[]
  isSuperAdmin: boolean
}

export interface TenantContext {
  id: string
  slug: string
  schemaName: string
  timezone: string
}

export type TenantRequest = Request & {
  user?: AuthenticatedUser
  tenant?: TenantContext
}

export type Handler = (req: TenantRequest, res: Response, next: NextFunction) => unknown
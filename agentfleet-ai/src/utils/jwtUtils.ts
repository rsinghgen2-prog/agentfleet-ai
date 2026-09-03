/**
 * JWT Utility Functions
 * Decode and extract user data from JWT tokens
 */

export interface JWTPayload {
  userId: string
  email: string
  fullName?: string
  firstName?: string
  lastName?: string
  role: string
  tenantId: string
  schemaName: string
  isSuperAdmin?: boolean
  iat: number
  exp: number
  [key: string]: any
}

/**
 * Decode JWT token without verification (safe for client-side)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const decoded = JSON.parse(atob(parts[1]))
    return decoded as JWTPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload) return true

  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * Convert JWT payload to userRegistration format for Dashboard
 */
export function jwtToUserRegistration(payload: JWTPayload) {
  return {
    userId: payload.userId,
    email: payload.email,
    fullName: payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.email,
    firstName: payload.firstName || payload.fullName?.split(' ')[0] || '',
    lastName: payload.lastName || payload.fullName?.split(' ').slice(1).join(' ') || '',
    role: payload.role,
    tenantId: payload.tenantId,
    schemaName: payload.schemaName,
    phone: payload.phone || '',
    businessName: payload.businessName || '',
    industry: payload.industry || '',
    plan: payload.plan || 'basic',
    isSubscribed: payload.isSubscribed || true,
    paymentCompleted: payload.paymentCompleted || true,
    isSuperAdmin: payload.isSuperAdmin || false,
    registeredAt: new Date().toISOString(),
  }
}

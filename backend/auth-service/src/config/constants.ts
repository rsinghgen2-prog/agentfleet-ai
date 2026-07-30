export const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'rsingh.gen2@gmail.com',
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

export function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET is required')
  return secret
}
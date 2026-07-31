export function defaultDentistNoteExpiration(now = new Date()) {
  const expiration = new Date(now)
  expiration.setMonth(expiration.getMonth() + 1)
  return expiration
}

export function isDentistNoteExpired(expiresAt: string, now = new Date()) {
  return new Date(expiresAt).getTime() <= now.getTime()
}
export function quoteIdentifier(identifier: string): string {
  if (!/^tenant_[a-z0-9_]+$/.test(identifier)) throw new Error('Invalid tenant schema')
  return `"${identifier.replaceAll('"', '""')}"`
}

export function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return fallback
  return Math.min(parsed, max)
}
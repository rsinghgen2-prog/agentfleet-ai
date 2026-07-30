export function quoteIdentifier(identifier: string): string {
  if (!/^tenant_[a-z0-9_]+$/.test(identifier)) throw new Error('Invalid tenant schema')
  return `"${identifier.replaceAll('"', '""')}"`
}
import { quoteIdentifier } from './sql'

describe('auth SQL identifier validation', () => {
  it('accepts tenant schema names and quotes them', () => {
    expect(quoteIdentifier('tenant_vps_dental')).toBe('"tenant_vps_dental"')
  })

  it('rejects unsafe schema names', () => {
    expect(() => quoteIdentifier('public')).toThrow('Invalid tenant schema')
    expect(() => quoteIdentifier('tenant_bad;drop table users')).toThrow('Invalid tenant schema')
  })
})
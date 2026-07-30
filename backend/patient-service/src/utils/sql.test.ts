import { parsePositiveInt, quoteIdentifier } from './sql.js'

describe('tenant SQL helpers', () => {
  it('quotes valid tenant schema identifiers', () => {
    expect(quoteIdentifier('tenant_vps_dental')).toBe('"tenant_vps_dental"')
    expect(quoteIdentifier('tenant_abc_123')).toBe('"tenant_abc_123"')
  })

  it('rejects identifiers that could escape the tenant schema', () => {
    expect(() => quoteIdentifier('public')).toThrow('Invalid tenant schema')
    expect(() => quoteIdentifier('tenant_bad-schema')).toThrow('Invalid tenant schema')
    expect(() => quoteIdentifier('tenant_bad";DROP TABLE patients;--')).toThrow('Invalid tenant schema')
  })

  it('normalizes pagination values to safe bounds', () => {
    expect(parsePositiveInt('25', 10, 100)).toBe(25)
    expect(parsePositiveInt('1000', 10, 100)).toBe(100)
    expect(parsePositiveInt('-1', 10, 100)).toBe(10)
    expect(parsePositiveInt('not-a-number', 10, 100)).toBe(10)
  })
})
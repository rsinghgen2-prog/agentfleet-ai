import { defaultDentistNoteExpiration, isDentistNoteExpired } from './notes.js'

describe('dentist note expiration', () => {
  it('defaults to one calendar month from creation', () => {
    const created = new Date('2026-01-15T10:30:00.000Z')
    expect(defaultDentistNoteExpiration(created).toISOString()).toBe('2026-02-15T10:30:00.000Z')
  })

  it('detects expired and active expiration timestamps', () => {
    const now = new Date('2026-02-15T10:30:00.000Z')
    expect(isDentistNoteExpired('2026-02-15T10:29:59.000Z', now)).toBe(true)
    expect(isDentistNoteExpired('2026-02-15T10:30:01.000Z', now)).toBe(false)
  })
})
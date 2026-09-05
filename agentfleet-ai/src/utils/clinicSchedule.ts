import type { Appointment, Patient } from '../services/dashboardService'

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const appointmentDateKey = (value: string | Date | null | undefined) => {
  if (!value) return ''
  if (value instanceof Date) return localDateKey(value)
  const text = String(value)
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : localDateKey(new Date(text))
}

export const appointmentTimeMinutes = (value: string | Date | null | undefined) => {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes()
  const text = String(value || '')
  const iso = text.match(/T(\d{2}):(\d{2})/)
  if (iso) return Number(iso[1]) * 60 + Number(iso[2])
  const clock = text.match(/(\d{1,2}):(\d{2})/)
  if (!clock) return 0
  return Number(clock[1]) * 60 + Number(clock[2])
}

export const isOpenVisit = (appointment: Appointment) => !['cancelled', 'completed', 'no_show'].includes(appointment.status)
export const isClinicDayVisit = (appointment: Appointment) => !['cancelled', 'no_show'].includes(appointment.status)

const visitKey = (appointment: Appointment) => `${appointmentDateKey(appointment.appointment_date)}T${String(appointmentTimeMinutes(appointment.appointment_time)).padStart(4, '0')}`

export function sortClinicVisits(appointments: Appointment[]) {
  return [...appointments].sort((left, right) => visitKey(left).localeCompare(visitKey(right)))
}

export function pickDefaultClinicVisit(appointments: Appointment[], now = new Date()): Appointment | undefined {
  const open = sortClinicVisits(appointments.filter(isOpenVisit))
  if (!open.length) return undefined
  const today = localDateKey(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const todayVisits = open.filter((item) => appointmentDateKey(item.appointment_date) === today)
  if (todayVisits.length) {
    const current = todayVisits.find((item) => item.status === 'in_progress')
      || todayVisits.find((item) => appointmentTimeMinutes(item.appointment_time) >= nowMinutes)
      || [...todayVisits].reverse().find((item) => appointmentTimeMinutes(item.appointment_time) <= nowMinutes)
    return current || todayVisits[0]
  }
  return open.find((item) => appointmentDateKey(item.appointment_date) > today) || open[0]
}

export function visitsOnDate(appointments: Appointment[], date: string, includeCompleted = false) {
  return sortClinicVisits(appointments.filter((item) => {
    if (appointmentDateKey(item.appointment_date) !== date) return false
    return includeCompleted ? isClinicDayVisit(item) : isOpenVisit(item)
  }))
}

export function dayVisitForPatient(appointments: Appointment[], patientId: string, date: string) {
  const day = visitsOnDate(appointments, date, true).filter((item) => item.patient_id === patientId)
  return pickDefaultClinicVisit(day) || [...day].reverse().find((item) => item.status === 'completed') || day[0]
}

export function cancelledVisits(appointments: Appointment[], date?: string) {
  return sortClinicVisits(appointments.filter((item) => {
    if (item.status !== 'cancelled') return false
    return date ? appointmentDateKey(item.appointment_date) === date : true
  }))
}

export function latestCancelledVisit(appointments: Appointment[], patientId: string, date?: string) {
  const visits = cancelledVisits(appointments.filter((item) => item.patient_id === patientId), date)
  return visits.at(-1)
}

export function consultationBadge(appointment?: Appointment | null) {
  if (!appointment) return null
  if (appointment.status === 'completed') return 'Completed' as const
  if (appointment.status === 'cancelled') return 'Cancelled' as const
  if (appointment.status === 'in_progress') return 'In progress' as const
  if (appointment.status === 'scheduled' || appointment.status === 'confirmed') return 'Scheduled' as const
  return null
}

export function uniquePatientsForVisits(visits: Appointment[], patients: Patient[]) {
  const seen = new Set<string>()
  return visits.flatMap((visit) => {
    if (seen.has(visit.patient_id)) return []
    seen.add(visit.patient_id)
    const listed = patients.find((patient) => patient.id === visit.patient_id)
    return [{
      id: visit.patient_id,
      first_name: listed?.first_name || visit.first_name,
      last_name: listed?.last_name || visit.last_name,
      phone: listed?.phone || visit.phone,
      email: listed?.email || visit.email,
      gender: listed?.gender || visit.gender,
      notes: listed?.notes,
      last_visit: listed?.last_visit,
      next_appointment: listed?.next_appointment,
    } as Patient]
  })
}

export function patientDisplayName(person: { first_name?: string | null; last_name?: string | null } | null | undefined, fallback = 'Patient') {
  const name = [person?.first_name, person?.last_name].filter((part) => part && part !== 'undefined').join(' ').trim()
  return name || fallback
}

export function patientInitials(person: { first_name?: string | null; last_name?: string | null } | null | undefined) {
  const parts = patientDisplayName(person, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase() || '?'
}

export const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export type WeekdayKey = typeof WEEKDAY_KEYS[number]
export type DayHours = { open: boolean; start: string; end: string }

export const DEFAULT_WORKING_HOURS: Record<string, string> = {
  monday: '09:00-18:00',
  tuesday: '09:00-18:00',
  wednesday: '09:00-18:00',
  thursday: '09:00-18:00',
  friday: '09:00-18:00',
  saturday: '10:00-14:00',
}

const clockMinutes = (value: string) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

const clockLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export function parseDayHours(value?: string | null): DayHours {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'closed') return { open: false, start: '09:00', end: '18:00' }
  const [start, end] = String(value).split('-').map((part) => part.trim().slice(0, 5))
  if (!start || !end || clockMinutes(start) == null || clockMinutes(end) == null) return { open: false, start: '09:00', end: '18:00' }
  return { open: true, start, end }
}

export function serializeDayHours(hours: DayHours) {
  return hours.open ? `${hours.start}-${hours.end}` : ''
}

export function workingHoursMap(workingHours?: Record<string, string> | null) {
  return workingHours && Object.keys(workingHours).length ? workingHours : DEFAULT_WORKING_HOURS
}

export function workingHoursForDate(workingHours: Record<string, string> | undefined, date: Date | string): DayHours {
  const day = typeof date === 'string' ? new Date(`${date.slice(0, 10)}T00:00:00`) : date
  return parseDayHours(workingHoursMap(workingHours)[WEEKDAY_KEYS[day.getDay()]])
}

export function appointmentDuration(settings?: { appointment_settings?: Record<string, unknown> } | null) {
  const value = Number(settings?.appointment_settings?.duration)
  return Number.isFinite(value) && value >= 5 ? value : 30
}

export function appointmentBuffer(settings?: { appointment_settings?: Record<string, unknown> } | null) {
  const value = Number(settings?.appointment_settings?.bufferMinutes)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

export function clinicTimeSlots(workingHours: Record<string, string> | undefined, date: Date | string, duration = 30, buffer = 0) {
  const hours = workingHoursForDate(workingHours, date)
  const start = clockMinutes(hours.start)
  const end = clockMinutes(hours.end)
  if (!hours.open || start == null || end == null || end <= start) return []
  const step = Math.max(5, duration + buffer)
  const slots: string[] = []
  for (let time = start; time + duration <= end; time += step) slots.push(clockLabel(time))
  return slots
}

export function formatClinicClock(value: string) {
  const minutes = clockMinutes(value)
  if (minutes == null) return value
  const hour = Math.floor(minutes / 60)
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function clinicHoursLabel(workingHours?: Record<string, string> | null) {
  const source = workingHoursMap(workingHours)
  const weekday = parseDayHours(source.monday)
  const saturday = parseDayHours(source.saturday)
  const sunday = parseDayHours(source.sunday)
  const parts: string[] = []
  if (weekday.open) parts.push(`Mon–Fri ${formatClinicClock(weekday.start)} – ${formatClinicClock(weekday.end)}`)
  if (saturday.open) parts.push(`Sat ${formatClinicClock(saturday.start)} – ${formatClinicClock(saturday.end)}`)
  else parts.push('Sat closed')
  if (sunday.open) parts.push(`Sun ${formatClinicClock(sunday.start)} – ${formatClinicClock(sunday.end)}`)
  return parts.join(' · ')
}

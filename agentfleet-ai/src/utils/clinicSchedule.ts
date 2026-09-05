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

export function consultationBadge(appointment?: Appointment | null) {
  if (!appointment) return null
  if (appointment.status === 'completed') return 'Completed' as const
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

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Plus, Search, SmilePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookingModal, type BookingFormData } from '../components/BookingModal'
import DentistNotes from '../components/DentistNotes'
import { DashboardService, type Appointment } from '../services/dashboardService'
import { useDentalDashboardData } from '../hooks/useDentalDashboardData'

const formatTime = (time: string) => {
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`
}

const initials = (appointment: Appointment) => `${appointment.first_name[0]}${appointment.last_name[0]}`
const isoDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const parseDateOnly = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}
const displayDate = (value: string) => parseDateOnly(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const calendarCells = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cellCount = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7
  return Array.from({ length: cellCount }, (_, index) => {
    if (index < firstDay.getDay()) return null
    return new Date(month.getFullYear(), month.getMonth(), index - firstDay.getDay() + 1)
  })
}

type PatientRange = 'Today' | 'Tomorrow' | 'Next 3 Days' | 'Next 1 Week'
const patientRanges: PatientRange[] = ['Today', 'Tomorrow', 'Next 3 Days', 'Next 1 Week']
const rangeDates = (baseDate: string, range: PatientRange) => {
  const from = parseDateOnly(baseDate)
  const to = new Date(from)
  if (range === 'Tomorrow') to.setDate(to.getDate() + 1)
  if (range === 'Next 3 Days') to.setDate(to.getDate() + 2)
  if (range === 'Next 1 Week') to.setDate(to.getDate() + 6)
  return { from: isoDate(from), to: isoDate(to) }
}

export default function DentalClientStitchDashboard() {
  const routerNavigate = useNavigate()
  const { client, data, loading, error, refresh } = useDentalDashboardData()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [patientRange, setPatientRange] = useState<PatientRange>('Today')
  const [rangeAppointments, setRangeAppointments] = useState<Appointment[]>([])
  const [rangeLoading, setRangeLoading] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [calendarAppointments, setCalendarAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const baseDate = data?.currentDate.today || isoDate(new Date())
  const range = useMemo(() => rangeDates(baseDate, patientRange), [baseDate, patientRange])
  const loadRangeAppointments = useCallback(async () => {
    setRangeLoading(true)
    try {
      setRangeAppointments(await DashboardService.getAppointments(range.from, range.to))
    } catch {
      setRangeAppointments([])
    } finally {
      setRangeLoading(false)
    }
  }, [range.from, range.to])
  const loadCalendarAppointments = useCallback(async () => {
    const from = isoDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1))
    const to = isoDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0))
    try {
      setCalendarAppointments(await DashboardService.getAppointments(from, to))
    } catch {
      setCalendarAppointments([])
    }
  }, [calendarMonth])
  useEffect(() => { void loadRangeAppointments() }, [loadRangeAppointments])
  useEffect(() => { void loadCalendarAppointments() }, [loadCalendarAppointments])
  useEffect(() => {
    const refreshDashboard = () => { void refresh(); void loadRangeAppointments(); void loadCalendarAppointments() }
    window.addEventListener('focus', refreshDashboard)
    const interval = window.setInterval(refreshDashboard, 30000)
    return () => { window.removeEventListener('focus', refreshDashboard); window.clearInterval(interval) }
  }, [loadCalendarAppointments, loadRangeAppointments, refresh])
  useEffect(() => { const timer = window.setInterval(() => setCurrentTime(new Date()), 60000); return () => window.clearInterval(timer) }, [])
  const appointments = rangeAppointments
  const filteredAppointments = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    if (!needle) return appointments
    return appointments.filter((item) => `${item.first_name} ${item.last_name} ${item.phone} ${item.email} ${item.appointment_type} ${item.reason}`.toLowerCase().includes(needle))
  }, [appointments, searchQuery])
  const selected = filteredAppointments.find((item) => item.id === selectedId) || filteredAppointments[0]
  const navigate = (path: string) => {
    if (selected && path === `/dental-client/customers/${selected.patient_id}`) {
      routerNavigate(`/dental-client/client-consulation?appointment=`)
      return
    }
    routerNavigate(path)
  }
  const calendarDays = useMemo(() => calendarCells(calendarMonth), [calendarMonth])
  const appointmentDates = useMemo(() => new Set(calendarAppointments.filter((item) => item.status !== 'cancelled').map((item) => item.appointment_date.slice(0, 10))), [calendarAppointments])
  const displayName = client?.clientName || 'Dr. Rajeev Pratap Singh'
  const currentHour = currentTime.getHours()
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'
  const monthLabel = calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const upcoming = calendarAppointments.find((item) => item.status !== 'cancelled' && item.appointment_date.slice(0, 10) >= baseDate)

  const handleBooking = async (booking: BookingFormData) => {
    await DashboardService.createBooking(booking)
    await refresh()
    await loadRangeAppointments()
    await loadCalendarAppointments()
  }

  return (
    <div className="dental-stitch-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight text-[#151c23] sm:text-3xl">{greeting} <span className="text-[#005db6]">{displayName}</span> 👋</h1></div>
        <button onClick={() => setBookingOpen(true)} className="hidden items-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#00468b] sm:flex"><Plus size={17} /> New Patient Booking</button>
      </div>
      {error && <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#a23858]/20 bg-[#fe81a1]/10 p-4 text-sm text-[#761538] sm:flex-row sm:items-center sm:justify-between"><div><b className="block">Clinic data could not be loaded.</b><span>{error} Check the authentication/API environment and tenant database seed.</span></div><button onClick={() => void refresh()} className="shrink-0 rounded-xl bg-[#a23858] px-4 py-2 text-xs font-bold text-white">Retry</button></div>}
      <button onClick={() => setBookingOpen(true)} className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-sm font-bold text-white shadow-md sm:hidden"><Plus size={18} /> New Patient Booking</button>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="flex flex-col gap-5 xl:col-span-8">
          <section className="dental-stitch-card relative grid grid-cols-1 items-center gap-6 overflow-hidden p-5 sm:grid-cols-2 sm:p-7">
            <div className="relative z-10"><p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#424752]">Today's patient visits</p><div className="flex items-baseline gap-2"><span className="text-5xl font-bold tracking-tight text-[#151c23]">{data?.stats.todayVisits ?? 0}</span><span className="text-sm text-[#424752]">/person</span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="relative overflow-hidden rounded-2xl border border-[#79baf2] bg-gradient-to-br from-[#eff8ff] via-[#cce9ff] to-[#8ec8ff] p-4 shadow-sm"><span className="absolute -right-4 -top-5 h-16 w-16 rounded-full bg-white/40" /><span className="relative text-xs font-bold text-[#005db6]">New Patients</span><div className="relative mt-2 flex items-center justify-between"><b className="text-2xl text-[#005db6]">{data?.stats.newPatientsToday ?? 0}</b><span className="rounded-full bg-[#005db6] px-2 py-1 text-[10px] font-bold text-white">51% ↗</span></div></div><div className="relative overflow-hidden rounded-2xl border border-[#e99ab3] bg-gradient-to-br from-[#fff0f5] via-[#ffd5e2] to-[#f3a2bc] p-4 shadow-sm"><span className="absolute -bottom-6 -right-3 h-16 w-16 rounded-full bg-white/40" /><span className="relative text-xs font-bold text-[#a23858]">Returning</span><div className="relative mt-2 flex items-center justify-between"><b className="text-2xl text-[#a23858]">{Math.max(0, (data?.stats.totalAppointmentsToday || 0) - (data?.stats.newPatientsToday || 0))}</b><span className="rounded-full bg-[#a23858] px-2 py-1 text-[10px] font-bold text-white">51% ↘</span></div></div></div></div>
            <div className="hidden h-48 items-center justify-center sm:flex"><div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[18px] border-[#e2e9f2] bg-[#f7f9ff] shadow-inner"><SmilePlus size={92} strokeWidth={1.1} className="text-[#005db6]" /><span className="absolute -right-5 top-3 h-7 w-7 rounded-full bg-[#fe81a1]" /><span className="absolute -bottom-2 left-1 h-5 w-5 rounded-full bg-[#5897f4]" /></div></div>
          </section>

          <section className="dental-stitch-card flex items-center justify-between bg-[#edf4fe] p-5">
            <div><p className="text-xs font-bold uppercase tracking-widest text-[#424752]">Clinic patients</p><p className="mt-1 text-sm text-[#727783]">Total active patients</p></div>
            <strong className="text-3xl font-bold text-[#005db6]">{data?.stats.totalPatients ?? 0}</strong>
          </section>

          <section className="dental-stitch-card grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:p-6">
            <div><div className="mb-5 flex flex-col gap-3"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Patient List</h2><select aria-label="Patient appointment date range" value={patientRange} onChange={(event) => setPatientRange(event.target.value as PatientRange)} className="rounded-xl bg-[#e8eef8] px-3 py-2 text-xs font-bold text-[#424752] outline-none">{patientRanges.map((rangeOption) => <option key={rangeOption} value={rangeOption}>{rangeOption}</option>)}</select></div><div className="relative"><input aria-label="Search dashboard patients" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-10 w-full rounded-xl bg-[#f7f9ff] px-4 pr-10 text-xs outline-none focus:ring-2 focus:ring-[#005db6]/20" placeholder="Search this patient list…" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727783]" size={16} /></div></div><div className="space-y-3">{loading || rangeLoading ? <p className="text-sm text-[#727783]">Loading appointments…</p> : filteredAppointments.length === 0 ? <p className="text-sm text-[#727783]">No appointments match this search and date range.</p> : filteredAppointments.map((appointment) => <button key={appointment.id} onClick={() => setSelectedId(appointment.id)} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${selected?.id === appointment.id ? 'border-[#005db6] bg-[#edf4fe] ring-1 ring-[#005db6]/20' : 'border-[#c2c6d4]/30 hover:bg-[#edf4fe]'}`}><span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d6e3ff] text-sm font-bold text-[#005db6]">{initials(appointment)}</span><span><b className="block text-sm text-[#151c23]">{appointment.first_name} {appointment.last_name}</b><small className="text-xs text-[#005db6]">{appointment.appointment_type}</small></span></span><span className="rounded-lg bg-[#2a3138] px-2 py-1 text-[10px] font-bold text-white">{formatTime(appointment.appointment_time)}</span></button>)}</div></div>
            <div className="hidden rounded-2xl bg-[#f7f9ff] p-5 md:block"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#424752]">Consultation</p><h3 className="mt-1 text-xl font-semibold">{selected ? `${selected.first_name} ${selected.last_name}` : 'Select a patient'}</h3><p className="text-xs text-[#727783]">{selected?.gender || 'Patient'} · {selected?.appointment_type || 'Appointment'}</p></div><button className="rounded-full bg-white p-2 text-[#424752] shadow-sm"><ArrowUpRight size={17} /></button></div><div className="grid grid-cols-3 gap-2 border-b border-[#c2c6d4]/30 pb-5 text-center"><span className="rounded-xl bg-white p-3 text-xs font-bold text-[#005db6]">🦷<small className="mt-1 block text-[#424752]">Braces</small></span><span className="rounded-xl bg-white p-3 text-xs font-bold text-[#005db6]">✦<small className="mt-1 block text-[#424752]">Whitening</small></span><span className="rounded-xl bg-white p-3 text-xs font-bold text-[#005db6]">✚<small className="mt-1 block text-[#424752]">Cavity</small></span></div><dl className="mt-5 space-y-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-[#727783]">Last checked</dt><dd className="text-right font-semibold">Today · {selected ? formatTime(selected.appointment_time) : '—'}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#727783]">Observation</dt><dd className="max-w-[65%] text-right">{selected?.notes || 'No observations recorded yet.'}</dd></div></dl><button disabled={!selected} onClick={() => selected && navigate(`/dental-client/customers/${selected.patient_id}`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#00468b] disabled:cursor-not-allowed disabled:opacity-50"><ArrowUpRight size={16} /> Start</button></div>
          </section>
        </div>

        <aside className="flex flex-col gap-5 xl:col-span-4"><section className="dental-stitch-card p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Your Schedule</h2><div className="flex gap-1"><button aria-label="Previous month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-2 text-[#424752] hover:bg-[#e2e9f2]"><ChevronLeft size={18} /></button><button aria-label="Next month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-2 text-[#424752] hover:bg-[#e2e9f2]"><ChevronRight size={18} /></button></div></div><div className="mb-4 border-b border-dashed border-[#727783]/60 pb-4 text-center"><span className="text-base font-semibold text-[#424752]">{monthLabel}</span></div><div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-[#c2c6d4]/30 text-center"><div className="col-span-7 grid grid-cols-7 border-b border-[#c2c6d4]/30 bg-[#f7f9ff] py-2 text-[10px] font-bold tracking-wide text-[#727783]">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => <span key={day}>{day}</span>)}</div>{calendarDays.map((date, index) => { if (!date) return <span key={`empty-${index}`} className="min-h-10 border-b border-[#c2c6d4]/20" />; const dateValue = isoDate(date); const isToday = dateValue === isoDate(new Date()); const hasAppointment = appointmentDates.has(dateValue); return <span key={dateValue} className={`flex min-h-10 items-center justify-center border-b border-[#c2c6d4]/20 text-sm ${isToday ? 'bg-[#edf4fe] font-bold text-[#005db6]' : 'text-[#151c23]'} ${hasAppointment ? 'font-bold text-[#a23858] underline decoration-[#c77895] decoration-2 underline-offset-4' : ''}`}>{date.getDate()}</span> })}</div><div className="mt-7 flex items-center justify-between"><h3 className="text-2xl font-semibold">Upcoming</h3><button onClick={() => navigate('/dental-client/schedule')} className="text-sm font-medium text-[#005db6] underline underline-offset-4">View All</button></div><div className="mt-5 rounded-2xl bg-[#edf4fe] p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-[#6ea8e9] p-3 text-white"><CalendarDays size={22} /></div><div><b className="block text-sm">{upcoming ? `${upcoming.first_name} ${upcoming.last_name}` : 'No upcoming appointments'}</b><span className="text-xs text-[#424752]">{upcoming ? `${displayDate(upcoming.appointment_date)} · ${formatTime(upcoming.appointment_time)} · ${upcoming.appointment_type}` : 'Book an appointment to see it here.'}</span></div></div></div><div className="mt-4 max-h-64 space-y-2 overflow-y-auto">{calendarAppointments.filter((item) => item.status !== 'cancelled' && item.appointment_date.slice(0, 10) >= baseDate).map((item) => <div key={item.id} className="rounded-xl border border-[#c2c6d4]/30 bg-white p-3"><div className="flex items-center justify-between gap-2"><b className="text-xs text-[#151c23]">{item.first_name} {item.last_name}</b><span className="text-[10px] font-bold text-[#005db6]">{formatTime(item.appointment_time)}</span></div><p className="mt-1 text-[10px] text-[#727783]">{displayDate(item.appointment_date)} · {item.appointment_type}</p></div>)}</div></section><DentistNotes /></aside>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onSubmit={handleBooking} />
    </div>
  )
}
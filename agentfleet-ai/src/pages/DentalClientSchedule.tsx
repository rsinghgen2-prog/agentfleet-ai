import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3, Plus } from 'lucide-react'
import { useDentalDashboardData } from '../hooks/useDentalDashboardData'
import { BookingModal, type BookingFormData } from '../components/BookingModal'
import { DashboardService, type Appointment } from '../services/dashboardService'
import { consultationPath } from '../utils/consultation'
import { describeApiError } from '../utils/apiError'
import { appointmentDuration, clinicHoursLabel, formatClinicClock, workingHoursForDate } from '../utils/clinicSchedule'

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parseDateOnly = (value: string) => { const [year, month, day] = value.slice(0, 10).split('-').map(Number); return new Date(year, month - 1, day) }
const startOfWeek = (date: Date) => { const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - result.getDay()); return result }

export default function DentalClientSchedule() {
  const navigate = useNavigate()
  const { data, settings, refresh } = useDentalDashboardData()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = parseDateOnly(data?.currentDate.today || dateKey(new Date()))
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const weekDays = useMemo(() => weekdays.map((label, index) => { const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return { label, date } }), [weekStart])
  const from = dateKey(weekDays[0].date)
  const to = dateKey(weekDays[6].date)
  const loadAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      setAppointments(await DashboardService.getAppointments(from, to))
      setError(null)
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to load the appointment schedule from the backend.'))
    } finally {
      setLoading(false)
    }
  }, [from, to])
  useEffect(() => { void loadAppointments() }, [loadAppointments])
  useEffect(() => {
    const silentRefresh = () => { void loadAppointments(true) }
    window.addEventListener('focus', silentRefresh)
    const interval = window.setInterval(silentRefresh, 30000)
    return () => { window.removeEventListener('focus', silentRefresh); window.clearInterval(interval) }
  }, [loadAppointments])
  const handleBooking = async (booking: BookingFormData) => { await DashboardService.createBooking(booking); await refresh(); await loadAppointments() }

  const todayHours = workingHoursForDate(settings?.working_hours, today)
  const hoursLabel = todayHours.open ? `${formatClinicClock(todayHours.start)} - ${formatClinicClock(todayHours.end)}` : 'Closed today'
  const activeAppointments = appointments.filter((item) => item.status !== 'cancelled')
  const appointmentForDay = (date: Date) => activeAppointments.filter((item) => item.appointment_date.slice(0, 10) === dateKey(date)).sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-5 pb-24 sm:px-6 lg:px-8"><div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#005db6]">Clinic operations</p><h1 className="mt-1 text-2xl font-bold text-[#151c23] sm:text-3xl">Appointment Schedule</h1><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#424752]"><span className={`flex items-center gap-1 font-bold ${todayHours.open ? 'text-green-600' : 'text-rose-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${todayHours.open ? 'bg-green-600' : 'bg-rose-600'}`} /> {todayHours.open ? 'Clinic Open' : 'Clinic Closed'}</span><span>{hoursLabel}</span><span className="text-[#727783]">{clinicHoursLabel(settings?.working_hours)}</span><span className="text-[#727783]">{appointmentDuration(settings)} min visits</span></div></div><button onClick={() => setBookingOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md"><Plus size={17} /> <span>Quick Add</span></button></div>
      <ClinicDataStatus error={error} onRetry={() => void loadAppointments()} empty={!error && !loading && activeAppointments.length === 0} emptyText="No visits booked this week yet." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c2c6d4]/30 bg-white/70 px-3 py-2 text-xs"><div className="flex items-center gap-2 font-bold text-[#151c23]"><button aria-label="Previous week" onClick={() => setWeekStart((date) => { const next = new Date(date); next.setDate(next.getDate() - 7); return next })} className="rounded-lg bg-[#edf4fe] p-2 text-[#005db6] hover:bg-[#d6e3ff]"><ChevronLeft size={16} /></button><span>{weekDays[0].date.toLocaleString('en-US', { month: 'short' })} {weekDays[0].date.getDate()} – {weekDays[6].date.toLocaleString('en-US', { month: 'short' })} {weekDays[6].date.getDate()}, {weekDays[6].date.getFullYear()}</span><button aria-label="Next week" onClick={() => setWeekStart((date) => { const next = new Date(date); next.setDate(next.getDate() + 7); return next })} className="rounded-lg bg-[#edf4fe] p-2 text-[#005db6] hover:bg-[#d6e3ff]"><ChevronRight size={16} /></button></div><div className="flex items-center gap-3 text-[10px] font-bold text-[#727783]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#005db6]" />Standard</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#a23858]" />Emergency</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#16704d]" />Completed</span></div></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"><section className="dental-stitch-card overflow-hidden p-3 sm:p-4"><div className="mb-2 flex items-center justify-between px-1"><span className="text-xs text-[#727783]">{error ? '—' : loading && !appointments.length ? 'Loading…' : `${activeAppointments.length} booked visits`}</span><span className="text-[10px] font-bold uppercase tracking-wider text-[#005db6]">Compact week view</span></div><div className="grid grid-cols-7 gap-1.5 overflow-x-auto sm:gap-2">{weekDays.map(({ label, date }) => { const dayAppointments = appointmentForDay(date); const isToday = dateKey(date) === dateKey(today); const dayOpen = workingHoursForDate(settings?.working_hours, date).open; return <div key={label} className={`min-w-[112px] rounded-2xl border p-2 ${isToday ? 'border-[#005db6] bg-[#edf4fe]' : 'border-[#c2c6d4]/30 bg-[#fbfcff]'}`}><div className="mb-2 border-b border-[#c2c6d4]/30 pb-2 text-center"><b className={`block text-[10px] tracking-wider ${isToday ? 'text-[#005db6]' : 'text-[#727783]'}`}>{label}</b><strong className={`mt-0.5 block text-xl ${isToday ? 'text-[#005db6]' : 'text-[#151c23]'}`}>{date.getDate()}</strong><span className="text-[9px] text-[#727783]">{dayAppointments.length} {dayAppointments.length === 1 ? 'visit' : 'visits'}</span></div><div className="space-y-1.5">{dayAppointments.length ? dayAppointments.map((appointment) => <button type="button" onClick={() => navigate(consultationPath(appointment.id, appointment.patient_id))} key={appointment.id} className={`block w-full text-left rounded-xl border-l-4 p-2 text-[10px] shadow-sm ${appointment.appointment_type.toLowerCase().includes('emergency') ? 'border-[#a23858] bg-[#fff0f5]' : appointment.status === 'completed' ? 'border-[#16704d] bg-[#dff7ed]' : 'border-[#005db6] bg-[#d6e3ff]'}`}><span className="flex items-center gap-1 font-bold text-[#424752]"><Clock3 size={11} />{formatAppointment(appointment.appointment_time)}</span><b className="mt-1 block truncate text-[#151c23]">{appointment.first_name} {appointment.last_name}</b><span className="mt-0.5 block truncate text-[#727783]">{appointment.appointment_type}</span></button>) : <div className={`rounded-xl border border-dashed px-2 py-5 text-center text-[10px] ${dayOpen ? 'border-[#c2c6d4]/50 text-[#a0a6b2]' : 'border-rose-200 bg-rose-50 text-rose-500'}`}>{error ? 'Unavailable' : loading ? '…' : dayOpen ? 'Open' : 'Closed'}</div>}</div></div> })}</div></section><aside className="flex flex-col gap-4"><div className="rounded-3xl bg-gradient-to-br from-[#005db6] to-[#16704d] p-5 text-white shadow-lg"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">This week&apos;s load</p><div className="mt-3 flex items-end justify-between"><span className="text-4xl font-bold">{error ? '—' : activeAppointments.length}</span><span className="text-right text-xs text-white/80">booked<br />appointments</span></div><div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 p-3 text-xs"><CalendarPlus size={16} /> {activeAppointments.filter((item) => item.appointment_type.toLowerCase().includes('emergency')).length} emergency slots</div></div><div className="dental-stitch-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold text-[#151c23]">All booked visits</h2><Clock3 size={17} className="text-[#005db6]" /></div><div className="max-h-[430px] space-y-2 overflow-y-auto">{error ? <p className="p-3 text-xs text-[#761538]">Visits could not be loaded. Use Retry above.</p> : !loading && !activeAppointments.length ? <p className="p-3 text-xs text-[#727783]">No booked visits this week.</p> : activeAppointments.map((item) => <button type="button" onClick={() => navigate(consultationPath(item.id, item.patient_id))} key={item.id} className="w-full rounded-xl border border-[#c2c6d4]/30 bg-[#f7f9ff] p-3 text-left"><div className="flex items-center justify-between gap-2"><b className="text-xs text-[#151c23]">{item.first_name} {item.last_name}</b><span className="text-[10px] font-bold text-[#005db6]">{formatAppointment(item.appointment_time)}</span></div><p className="mt-1 text-[10px] text-[#727783]">{item.appointment_date.slice(0, 10)} · {item.appointment_type}</p></button>)}</div></div></aside></div><BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onSubmit={handleBooking} /></div>
  )
}

function formatAppointment(time: string) { const [hour, minute] = time.split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}` }
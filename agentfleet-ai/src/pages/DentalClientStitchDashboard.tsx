import { useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Plus, SmilePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookingModal, type BookingFormData } from '../components/BookingModal'
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
const calendarCells = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  return Array.from({ length: firstDay.getDay() + daysInMonth }, (_, index) => {
    if (index < firstDay.getDay()) return null
    return new Date(month.getFullYear(), month.getMonth(), index - firstDay.getDay() + 1)
  })
}

export default function DentalClientStitchDashboard() {
  const navigate = useNavigate()
  const { client, data, loading, error, refresh } = useDentalDashboardData()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const appointments = data?.todaysAppointments || []
  const selected = appointments.find((item) => item.id === selectedId) || appointments[0]
  const calendarDays = useMemo(() => calendarCells(calendarMonth), [calendarMonth])
  const appointmentDates = useMemo(() => new Set((data?.calendarData || []).map((item) => item.appointment_date)), [data?.calendarData])
  const displayName = client?.clientName || 'Dr. Rajeev Pratap Singh'
  const monthLabel = calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const handleBooking = async (booking: BookingFormData) => {
    await DashboardService.createBooking(booking)
    await refresh()
  }

  return (
    <div className="dental-stitch-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#424752]">Dashboard overview</p><h1 className="text-2xl font-bold tracking-tight text-[#151c23] sm:text-3xl">Good Morning <span className="text-[#005db6]">{displayName}</span> 👋</h1></div>
        <button onClick={() => setBookingOpen(true)} className="hidden items-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#00468b] sm:flex"><Plus size={17} /> New Patient Booking</button>
      </div>
      {error && <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#a23858]/20 bg-[#fe81a1]/10 p-4 text-sm text-[#761538] sm:flex-row sm:items-center sm:justify-between"><div><b className="block">Clinic data could not be loaded.</b><span>{error} Check the authentication/API environment and tenant database seed.</span></div><button onClick={() => void refresh()} className="shrink-0 rounded-xl bg-[#a23858] px-4 py-2 text-xs font-bold text-white">Retry</button></div>}
      <button onClick={() => setBookingOpen(true)} className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-sm font-bold text-white shadow-md sm:hidden"><Plus size={18} /> New Patient Booking</button>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="flex flex-col gap-5 xl:col-span-8">
          <section className="dental-stitch-card relative grid grid-cols-1 items-center gap-6 overflow-hidden p-5 sm:grid-cols-2 sm:p-7">
            <div className="relative z-10"><p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#424752]">Today's patient visits</p><div className="flex items-baseline gap-2"><span className="text-5xl font-bold tracking-tight text-[#151c23]">{data?.stats.todayVisits ?? 0}</span><span className="text-sm text-[#424752]">/person</span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-[#5897f4]/10 bg-[#5897f4]/20 p-4"><span className="text-xs font-bold text-[#005db6]">New Patients</span><div className="mt-2 flex items-center justify-between"><b className="text-2xl text-[#005db6]">{data?.stats.newPatientsToday ?? 0}</b><span className="rounded-full bg-[#005db6] px-2 py-1 text-[10px] font-bold text-white">51% ↗</span></div></div><div className="rounded-2xl border border-[#fe81a1]/10 bg-[#fe81a1]/20 p-4"><span className="text-xs font-bold text-[#a23858]">Returning</span><div className="mt-2 flex items-center justify-between"><b className="text-2xl text-[#a23858]">{Math.max(0, (data?.stats.totalAppointmentsToday || 0) - (data?.stats.newPatientsToday || 0))}</b><span className="rounded-full bg-[#a23858] px-2 py-1 text-[10px] font-bold text-white">51% ↘</span></div></div></div></div>
            <div className="hidden h-48 items-center justify-center sm:flex"><div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[18px] border-[#e2e9f2] bg-[#f7f9ff] shadow-inner"><SmilePlus size={92} strokeWidth={1.1} className="text-[#005db6]" /><span className="absolute -right-5 top-3 h-7 w-7 rounded-full bg-[#fe81a1]" /><span className="absolute -bottom-2 left-1 h-5 w-5 rounded-full bg-[#5897f4]" /></div></div>
          </section>

          <section className="dental-stitch-card grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:p-6">
            <div><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Patient List</h2><button className="flex items-center gap-1 rounded-xl bg-[#e8eef8] px-3 py-2 text-xs font-bold text-[#424752]">Today <ChevronDown size={14} /></button></div><div className="space-y-3">{loading ? <p className="text-sm text-[#727783]">Loading appointments…</p> : appointments.map((appointment) => <button key={appointment.id} onClick={() => setSelectedId(appointment.id)} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${selected?.id === appointment.id ? 'border-[#005db6] bg-[#edf4fe] ring-1 ring-[#005db6]/20' : 'border-[#c2c6d4]/30 hover:bg-[#edf4fe]'}`}><span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d6e3ff] text-sm font-bold text-[#005db6]">{initials(appointment)}</span><span><b className="block text-sm text-[#151c23]">{appointment.first_name} {appointment.last_name}</b><small className="text-xs text-[#005db6]">{appointment.appointment_type}</small></span></span><span className="rounded-lg bg-[#2a3138] px-2 py-1 text-[10px] font-bold text-white">{formatTime(appointment.appointment_time)}</span></button>)}</div></div>
            <div className="hidden rounded-2xl bg-[#f7f9ff] p-5 md:block"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#424752]">Consultation</p><h3 className="mt-1 text-xl font-semibold">{selected ? `${selected.first_name} ${selected.last_name}` : 'Select a patient'}</h3><p className="text-xs text-[#727783]">{selected?.gender || 'Patient'} · {selected?.appointment_type || 'Appointment'}</p></div><button className="rounded-full bg-white p-2 text-[#424752] shadow-sm"><ArrowUpRight size={17} /></button></div><div className="grid grid-cols-3 gap-2 border-b border-[#c2c6d4]/30 pb-5 text-center"><span className="rounded-xl bg-white p-3 text-xs font-bold text-[#005db6]">🦷<small className="mt-1 block text-[#424752]">Braces</small></span><span className="rounded-xl bg-white p-3 text-xs font-bold text-[#005db6]">✦<small className="mt-1 block text-[#424752]">Whitening</small></span><span className="rounded-xl bg-white p-3 text-xs font-bold text-[#005db6]">✚<small className="mt-1 block text-[#424752]">Cavity</small></span></div><dl className="mt-5 space-y-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-[#727783]">Last checked</dt><dd className="text-right font-semibold">Today · {selected ? formatTime(selected.appointment_time) : '—'}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#727783]">Observation</dt><dd className="max-w-[65%] text-right">{selected?.notes || 'No observations recorded yet.'}</dd></div></dl></div>
          </section>
        </div>

        <aside className="flex flex-col gap-5 xl:col-span-4"><section className="dental-stitch-card p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Your Schedules</h2><div className="flex gap-1"><button aria-label="Previous month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-2 text-[#424752] hover:bg-[#e2e9f2]"><ChevronLeft size={18} /></button><button aria-label="Next month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-2 text-[#424752] hover:bg-[#e2e9f2]"><ChevronRight size={18} /></button></div></div><div className="mb-4 flex items-center justify-between border-b border-dashed border-[#727783]/60 pb-4"><span className="text-base text-[#424752]">{monthLabel}</span></div><div className="grid grid-cols-7 gap-y-2 text-center text-xs"><div className="col-span-7 grid grid-cols-7 pb-2 text-[10px] font-medium text-[#727783]">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => <span key={day}>{day}</span>)}</div>{calendarDays.map((date, index) => { if (!date) return <span key={`empty-${index}`} className="h-9" />; const dateValue = isoDate(date); const isToday = dateValue === isoDate(new Date()); const hasAppointment = appointmentDates.has(dateValue); return <span key={dateValue} className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm ${isToday ? 'bg-[#f1f3f5] font-semibold' : ''} ${hasAppointment ? 'border border-[#c77895] text-[#151c23]' : 'text-[#151c23]'}`}>{date.getDate()}</span> })}</div><div className="mt-7 flex items-center justify-between"><h3 className="text-2xl font-semibold">Upcoming</h3><button onClick={() => navigate('/dental-client/schedule')} className="text-sm font-medium text-[#005db6] underline underline-offset-4">View All</button></div><div className="mt-5 rounded-2xl bg-[#edf4fe] p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-[#6ea8e9] p-3 text-white"><CalendarDays size={22} /></div><div><b className="block text-sm">Monthly doctor&apos;s meet</b><span className="text-xs text-[#424752]">{appointments[0] ? `${new Date(`${appointments[0].appointment_date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  |  ${formatTime(appointments[0].appointment_time)}` : 'No upcoming appointments'}</span></div></div></div></section><section className="dental-stitch-card min-h-40 p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Dentist Notes</h2><button className="rounded-full bg-[#e8eef8] p-2 text-[#005db6]"><Plus size={16} /></button></div><p className="mt-4 text-sm leading-6 text-[#424752]">Keep clinical notes, follow-ups, and treatment reminders together for the next visit.</p><button className="mt-4 flex items-center gap-2 rounded-xl border border-[#c2c6d4] bg-white px-4 py-2 text-xs font-bold text-[#005db6]"><Plus size={15} /> Add new note</button></section></aside>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onSubmit={handleBooking} />
    </div>
  )
}
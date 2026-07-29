import { useState } from 'react'
import { MessageCircle, Phone, Plus, Search, Stethoscope, Clock3 } from 'lucide-react'
import { useDentalDashboardData } from '../hooks/useDentalDashboardData'
import { BookingModal, type BookingFormData } from '../components/BookingModal'
import { DashboardService, type Appointment } from '../services/dashboardService'

const formatTime = (time: string) => {
  const [hour, minute] = time.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

const patientStatus = (appointment: Appointment, index: number) => appointment.status === 'completed' ? 'Completed' : index === 0 ? 'Checked In' : 'Scheduled'

export default function DentalClientPatients() {
  const { data, refresh } = useDentalDashboardData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All Patients')
  const [bookingOpen, setBookingOpen] = useState(false)
  const appointments = data?.todaysAppointments || []
  const filtered = appointments.filter((appointment, index) => {
    const matchesQuery = `${appointment.first_name} ${appointment.last_name}`.toLowerCase().includes(query.toLowerCase()) || appointment.patient_id.includes(query)
    const status = patientStatus(appointment, index)
    return matchesQuery && (filter === 'All Patients' || status === filter)
  })

  const handleBooking = async (booking: BookingFormData) => { await DashboardService.createBooking(booking); await refresh() }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#151c23] sm:text-3xl">Patient List</h1><p className="mt-1 text-sm text-[#424752]">V.P.S. Dental &amp; Oral Care</p></div><button onClick={() => setBookingOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md"><Plus size={17} /><span className="hidden sm:inline">New Patient</span></button></div>
      <div className="relative mb-6"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-14 w-full rounded-xl border-0 bg-white px-6 pr-12 text-sm text-[#151c23] shadow-sm outline-none placeholder:text-[#727783] focus:ring-2 focus:ring-[#005db6]/20" placeholder="Search patients by name or ID..." /><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#424752]" size={20} /></div>
      <div className="dental-stitch-hide-scrollbar mb-7 flex gap-3 overflow-x-auto pb-1">{['All Patients', 'Checked In', 'Scheduled', 'Completed'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition ${filter === item ? 'bg-[#005db6] text-white shadow-md' : 'bg-[#dce3ec] text-[#424752] hover:bg-[#e2e9f2]'}`}>{item}</button>)}</div>
      <div className="grid gap-5 lg:grid-cols-2">{filtered.map((appointment, index) => { const status = patientStatus(appointment, index); return <article key={appointment.id} className="dental-stitch-card flex flex-col gap-4 p-5 transition hover:-translate-y-0.5"><div className="flex items-start justify-between gap-3"><div className="flex gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d6e3ff] text-lg font-bold text-[#005db6]">{appointment.first_name[0]}{appointment.last_name[0]}</div><div><h2 className="text-xl font-semibold text-[#151c23]">{appointment.first_name} {appointment.last_name}</h2><p className="text-xs text-[#727783]">ID: #VPS-{appointment.patient_id.padStart(4, '0')}</p></div></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${status === 'Checked In' ? 'bg-[#5897f4]/20 text-[#00468b]' : status === 'Completed' ? 'bg-[#dce3ec] text-[#424752]' : 'bg-[#fe81a1]/20 text-[#761538]'}`}>{status}</span></div><div className="flex items-center gap-2 border-y border-[#c2c6d4]/20 py-3 text-sm text-[#424752]"><Stethoscope size={18} className="text-[#005db6]" /> {appointment.reason || appointment.appointment_type}</div><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-[#151c23]"><Clock3 size={17} className="text-[#727783]" />{formatTime(appointment.appointment_time)}</span><div className="flex gap-2"><a href={`tel:${appointment.phone}`} aria-label={`Call ${appointment.first_name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e2e9f2] text-[#005db6]"><Phone size={18} /></a><button aria-label={`Message ${appointment.first_name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#005db6] text-white shadow-md"><MessageCircle size={18} /></button></div></div></article> })}</div>
      {filtered.length === 0 && <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">No patients match your search.</div>}
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onSubmit={handleBooking} />
    </div>
  )
}
import { useCallback, useEffect, useState } from 'react'
import { MessageCircle, Phone, Plus, Search, Stethoscope, Clock3 } from 'lucide-react'
import { BookingModal, type BookingFormData } from '../components/BookingModal'
import { DashboardService, type Patient } from '../services/dashboardService'

type Filter = 'All Patients' | 'Active Follow-up' | 'Upcoming' | 'No Recent Visit'
type DateFilter = 'All Dates' | 'Today' | 'Tomorrow' | 'Next 3 Days' | 'Next 1 Week'
const patientStatus = (patient: Patient): Exclude<Filter, 'All Patients'> => patient.next_appointment ? 'Upcoming' : patient.last_visit ? 'Active Follow-up' : 'No Recent Visit'
const formatDate = (value?: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No visit recorded'
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const matchesDateFilter = (value: string | null | undefined, filter: DateFilter) => {
  if (filter === 'All Dates') return true
  if (!value) return false
  const appointmentDate = value.slice(0, 10)
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const to = new Date(from)
  if (filter === 'Tomorrow') to.setDate(to.getDate() + 1)
  if (filter === 'Next 3 Days') to.setDate(to.getDate() + 2)
  if (filter === 'Next 1 Week') to.setDate(to.getDate() + 6)
  return appointmentDate >= dateKey(from) && appointmentDate <= dateKey(to)
}

export default function DentalClientPatients() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All Patients')
  const [dateFilter, setDateFilter] = useState<DateFilter>('All Dates')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)

  const loadPatients = useCallback(async () => { setLoading(true); setError(null); try { const result = await DashboardService.getPatients(query); setPatients(result.data) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load patients') } finally { setLoading(false) } }, [query])
  useEffect(() => { void loadPatients() }, [loadPatients])
  const filtered = patients.filter((patient) => (filter === 'All Patients' || patientStatus(patient) === filter) && matchesDateFilter(patient.next_appointment, dateFilter))
  const handleBooking = async (booking: BookingFormData) => { await DashboardService.createBooking(booking); setBookingOpen(false); await loadPatients() }

  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#151c23] sm:text-3xl">Patient List</h1><p className="mt-1 text-sm text-[#424752]">Patients and follow-up activity for this clinic.</p></div><button onClick={() => setBookingOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md"><Plus size={17} /><span className="hidden sm:inline">New Patient</span></button></div>
    <div className="relative mb-6"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-14 w-full rounded-xl border-0 bg-white px-6 pr-12 text-sm text-[#151c23] shadow-sm outline-none placeholder:text-[#727783] focus:ring-2 focus:ring-[#005db6]/20" placeholder="Search patients by name, phone, email, or ID..." /><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#424752]" size={20} /></div>
    <div className="mb-5 flex items-center gap-3"><label htmlFor="patient-date-filter" className="text-sm font-semibold text-[#424752]">Appointments:</label><select id="patient-date-filter" value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)} className="rounded-xl bg-[#e8eef8] px-4 py-3 text-xs font-bold text-[#424752] outline-none"><option>All Dates</option><option>Today</option><option>Tomorrow</option><option>Next 3 Days</option><option>Next 1 Week</option></select></div>
    <div className="dental-stitch-hide-scrollbar mb-7 flex gap-3 overflow-x-auto pb-1">{(['All Patients', 'Active Follow-up', 'Upcoming', 'No Recent Visit'] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition ${filter === item ? 'bg-[#005db6] text-white shadow-md' : 'bg-[#dce3ec] text-[#424752] hover:bg-[#e2e9f2]'}`}>{item}</button>)}</div>
    {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading ? <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">Loading patients…</div> : <div className="grid gap-5 lg:grid-cols-2">{filtered.map((patient) => { const status = patientStatus(patient); const initials = `${patient.first_name[0] || ''}${patient.last_name[0] || ''}`; return <article key={patient.id} className="dental-stitch-card flex flex-col gap-4 p-5 transition hover:-translate-y-0.5"><div className="flex items-start justify-between gap-3"><div className="flex gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d6e3ff] text-lg font-bold text-[#005db6]">{initials}</div><div><h2 className="text-xl font-semibold text-[#151c23]">{patient.first_name} {patient.last_name}</h2><p className="text-xs text-[#727783]">ID: #{patient.id.slice(0, 8)}</p></div></div><span className="rounded-full bg-[#5897f4]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00468b]">{status}</span></div><div className="flex items-center gap-2 border-y border-[#c2c6d4]/20 py-3 text-sm text-[#424752]"><Stethoscope size={18} className="text-[#005db6]" /> Last visit: {formatDate(patient.last_visit)}</div><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-[#151c23]"><Clock3 size={17} className="text-[#727783]" />Next: {formatDate(patient.next_appointment)}</span><div className="flex gap-2"><a href={`tel:${patient.phone || ''}`} aria-label={`Call ${patient.first_name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e2e9f2] text-[#005db6]"><Phone size={18} /></a><button aria-label={`Message ${patient.first_name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#005db6] text-white shadow-md"><MessageCircle size={18} /></button></div></div></article> })}</div>}
    {!loading && filtered.length === 0 && <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">No patients match your search.</div>}
    <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onSubmit={handleBooking} />
  </div>
}
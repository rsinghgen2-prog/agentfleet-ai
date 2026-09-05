import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ChevronDown, Clock3, Heart, Image, Mail, MessageCircle, Phone, Plus, Search, Stethoscope } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookingModal, type BookingFormData } from '../components/BookingModal'
import { DashboardService, type Appointment, type Patient, type PatientProfile } from '../services/dashboardService'
import { describeApiError } from '../utils/apiError'
import { ClinicDataStatus } from '../components/dental/ClinicDataStatus'
import { VisitChangeModal, type VisitChangeIntent } from '../components/dental/VisitChangeModal'
import { consultationPath } from '../utils/consultation'
import { appointmentDateKey, cancelledVisits, consultationBadge, dayVisitForPatient, isOpenVisit, latestCancelledVisit, localDateKey, patientDisplayName, patientInitials, pickDefaultClinicVisit, uniquePatientsForVisits, visitsOnDate } from '../utils/clinicSchedule'

type Filter = 'All Patients' | 'Active Follow-up' | 'Upcoming' | 'Completed' | 'Cancelled' | 'No Recent Visit'
type DateFilter = 'All Dates' | 'Today' | 'Tomorrow' | 'Next 3 Days' | 'Next 1 Week'
type TileStatus = Exclude<Filter, 'All Patients'> | 'In progress' | 'Scheduled'
const rosterStatus = (patient: Patient): Exclude<Filter, 'All Patients' | 'Completed' | 'Cancelled'> => patient.next_appointment ? 'Upcoming' : patient.last_visit ? 'Active Follow-up' : 'No Recent Visit'
const patientStatus = (patient: Patient, visit?: Appointment | null): TileStatus => consultationBadge(visit) || rosterStatus(patient)
const cancelledReason = (visit?: Appointment) => {
  const notes = visit?.notes || ''
  const match = notes.match(/Cancelled:\s*(.+)$/m)
  return match?.[1]?.trim() || visit?.reason || 'Appointment cancelled'
}
const patientTone = (status: TileStatus) => status === 'Cancelled'
  ? { card: 'border-rose-200 bg-gradient-to-br from-white via-rose-50 to-rose-100', avatar: 'bg-rose-100 text-rose-700', badge: 'bg-rose-600 text-white', icon: 'text-rose-600', action: 'bg-rose-100 text-rose-700 hover:bg-rose-200' }
  : status === 'Completed'
  ? { card: 'border-[#65b891]/45 bg-gradient-to-br from-white via-[#effbf6] to-[#dff7ed]', avatar: 'bg-[#dff7ed] text-[#16704d]', badge: 'bg-[#16704d] text-white', icon: 'text-[#16704d]', action: 'bg-[#dff7ed] text-[#16704d] hover:bg-[#c5eedc]' }
  : status === 'In progress'
    ? { card: 'border-[#e4b66e]/50 bg-gradient-to-br from-white via-[#fffaf0] to-[#fff0d8]', avatar: 'bg-[#fff0d8] text-[#8a5a00]', badge: 'bg-[#8a5a00] text-white', icon: 'text-[#8a5a00]', action: 'bg-[#fff0d8] text-[#8a5a00] hover:bg-[#ffe4b6]' }
    : status === 'Upcoming' || status === 'Scheduled'
      ? { card: 'border-[#5897f4]/45 bg-gradient-to-br from-white via-[#edf4fe] to-[#d6e3ff]', avatar: 'bg-[#d6e3ff] text-[#005db6]', badge: 'bg-[#5897f4]/25 text-[#00468b]', icon: 'text-[#005db6]', action: 'bg-[#d6e3ff] text-[#005db6] hover:bg-[#c6d9ff]' }
      : status === 'Active Follow-up'
        ? { card: 'border-[#65b891]/45 bg-gradient-to-br from-white via-[#effbf6] to-[#dff7ed]', avatar: 'bg-[#dff7ed] text-[#16704d]', badge: 'bg-[#dff7ed] text-[#16704d]', icon: 'text-[#16704d]', action: 'bg-[#dff7ed] text-[#16704d] hover:bg-[#c5eedc]' }
        : { card: 'border-[#e4b66e]/50 bg-gradient-to-br from-white via-[#fffaf0] to-[#fff0d8]', avatar: 'bg-[#fff0d8] text-[#8a5a00]', badge: 'bg-[#fff0d8] text-[#8a5a00]', icon: 'text-[#8a5a00]', action: 'bg-[#fff0d8] text-[#8a5a00] hover:bg-[#ffe4b6]' }
const formatDate = (value?: string | null) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No visit recorded'
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const matchesWindow = (value: string | null | undefined, filter: DateFilter) => {
  if (filter === 'All Dates' || filter === 'Today') return true
  if (!value) return false
  const appointmentDate = value.slice(0, 10)
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const to = new Date(from)
  if (filter === 'Tomorrow') { from.setDate(from.getDate() + 1); to.setDate(to.getDate() + 1) }
  if (filter === 'Next 3 Days') to.setDate(to.getDate() + 2)
  if (filter === 'Next 1 Week') to.setDate(to.getDate() + 6)
  return appointmentDate >= dateKey(from) && appointmentDate <= dateKey(to)
}

export default function DentalClientPatients() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [filter, setFilter] = useState<Filter>('All Patients')
  const [dateFilter, setDateFilter] = useState<DateFilter>('Today')
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [selectedId, setSelectedId] = useState(searchParams.get('patient') || '')
  const [pain, setPain] = useState(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [changeVisit, setChangeVisit] = useState<{ patient: Patient; visit: Appointment } | null>(null)
  const [changeSaving, setChangeSaving] = useState(false)
  const [changeError, setChangeError] = useState('')

  useEffect(() => { setQuery(searchParams.get('search') || '') }, [searchParams])
  const updateSearch = (value: string) => {
    setQuery(value)
    const nextParams = new URLSearchParams(searchParams)
    if (value.trim()) nextParams.set('search', value)
    else nextParams.delete('search')
    setSearchParams(nextParams, { replace: true })
  }
  const choose = (id: string) => {
    setSelectedId(id)
    const nextParams = new URLSearchParams(searchParams)
    if (id) nextParams.set('patient', id)
    else nextParams.delete('patient')
    setSearchParams(nextParams, { replace: true })
  }

  const loadPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const from = new Date(); from.setDate(from.getDate() - 14)
      const to = new Date(); to.setDate(to.getDate() + 365)
      const [patientResult, appointmentResult] = await Promise.all([
        DashboardService.getPatients(query, 100, 0),
        DashboardService.getAppointments(localDateKey(from), localDateKey(to)),
      ])
      setPatients(patientResult.data)
      setAppointments(appointmentResult)
      setSelectedId((current) => {
        const preferred = current || searchParams.get('patient') || ''
        const valid = Boolean(preferred && (appointmentResult.some((item) => item.patient_id === preferred) || patientResult.data.some((item) => item.id === preferred)))
        if (valid) return preferred
        return pickDefaultClinicVisit(appointmentResult)?.patient_id || patientResult.data[0]?.id || ''
      })
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to load patients from the backend.'))
    } finally {
      setLoading(false)
    }
  }, [query])
  useEffect(() => { void loadPatients() }, [loadPatients])
  useEffect(() => {
    if (!selectedId) { setProfile(null); return }
    let active = true
    void DashboardService.getPatientProfile(selectedId).then((result) => { if (active) setProfile(result) }).catch(() => { if (active) setProfile(null) })
    return () => { active = false }
  }, [selectedId])

  const todayKey = localDateKey()
  const todayClinicVisits = useMemo(() => visitsOnDate(appointments, todayKey, true), [appointments, todayKey])
  const defaultVisit = useMemo(() => pickDefaultClinicVisit(appointments), [appointments])
  const focusDate = todayClinicVisits.length ? todayKey : appointmentDateKey(defaultVisit?.appointment_date) || todayKey
  const clinicDayPatients = useMemo(() => {
    const listed = uniquePatientsForVisits(visitsOnDate(appointments, focusDate, true), patients)
    if (!query.trim()) return listed
    const allowed = new Set(patients.map((item) => item.id))
    return listed.filter((item) => allowed.has(item.id))
  }, [appointments, focusDate, patients, query])
  const completedIds = useMemo(() => new Set(appointments.filter((item) => item.status === 'completed' && (dateFilter !== 'Today' || appointmentDateKey(item.appointment_date) === focusDate)).map((item) => item.patient_id)), [appointments, dateFilter, focusDate])
  const cancelledPatients = useMemo(() => {
    const visits = cancelledVisits(appointments).filter((item) => {
      const key = appointmentDateKey(item.appointment_date)
      if (dateFilter === 'Today') return key === focusDate
      if (dateFilter === 'All Dates') return true
      return matchesWindow(key, dateFilter)
    })
    const listed = uniquePatientsForVisits(visits, patients)
    if (!query.trim()) return listed
    const allowed = new Set(patients.map((item) => item.id))
    return listed.filter((item) => allowed.has(item.id))
  }, [appointments, dateFilter, focusDate, patients, query])
  const cancelledIds = useMemo(() => new Set(cancelledPatients.map((item) => item.id)), [cancelledPatients])
  const matchesFilter = (patient: Patient) => {
    const visit = dayVisitForPatient(appointments, patient.id, focusDate)
    if (filter === 'All Patients') return true
    if (filter === 'Completed') return completedIds.has(patient.id)
    if (filter === 'Cancelled') return cancelledIds.has(patient.id)
    const status = patientStatus(patient, visit)
    if (filter === 'Upcoming') return status === 'Upcoming' || status === 'Scheduled'
    if (filter === 'Active Follow-up' || filter === 'No Recent Visit') return rosterStatus(patient) === filter && status !== 'Completed'
    return status === filter
  }
  const holidayFallback = dateFilter === 'Today' && focusDate !== todayKey
  const filtered = patients.filter((patient) => {
    if (!matchesFilter(patient)) return false
    if (dateFilter === 'Today') return clinicDayPatients.some((item) => item.id === patient.id) || (filter === 'Completed' && completedIds.has(patient.id) && dateFilter !== 'Today') || (filter === 'Cancelled' && cancelledIds.has(patient.id))
    if (dateFilter === 'All Dates') return true
    return matchesWindow(patient.next_appointment, dateFilter) || (filter === 'Completed' && completedIds.has(patient.id)) || (filter === 'Cancelled' && cancelledIds.has(patient.id))
  })
  const visible = filter === 'Cancelled'
    ? cancelledPatients
    : dateFilter === 'Today' && clinicDayPatients.length
      ? clinicDayPatients.filter((patient) => matchesFilter(patient))
      : filtered
  const selected = patients.find((item) => item.id === selectedId) || clinicDayPatients.find((item) => item.id === selectedId) || cancelledPatients.find((item) => item.id === selectedId) || profile?.patient
  const selectedVisit = filter === 'Cancelled'
    ? latestCancelledVisit(appointments, selectedId, dateFilter === 'Today' ? focusDate : undefined)
    : dayVisitForPatient(appointments, selectedId, focusDate) || pickDefaultClinicVisit(appointments.filter((item) => item.patient_id === selectedId))
  const handleBooking = async (booking: BookingFormData) => { await DashboardService.createBooking(booking); setBookingOpen(false); await loadPatients() }
  const handleVisitChange = async (intent: VisitChangeIntent) => {
    if (!changeVisit) return
    setChangeSaving(true)
    setChangeError('')
    try {
      if (intent.kind === 'reschedule') {
        await DashboardService.updateAppointment(changeVisit.visit.id, {
          appointmentDate: intent.date,
          appointmentTime: intent.time.slice(0, 5),
          status: changeVisit.visit.status === 'in_progress' ? 'scheduled' : changeVisit.visit.status,
        })
      } else {
        const notes = [changeVisit.visit.notes, `Cancelled: ${intent.reason}`].filter(Boolean).join('\n')
        await DashboardService.updateAppointment(changeVisit.visit.id, { status: 'cancelled', notes })
      }
      if (intent.kind === 'cancel') setFilter('Cancelled')
      setChangeVisit(null)
      await loadPatients()
    } catch (reason) {
      setChangeError(describeApiError(reason, intent.kind === 'reschedule' ? 'Unable to reschedule this visit.' : 'Unable to cancel this visit.'))
    } finally {
      setChangeSaving(false)
    }
  }
  const listCaption = dateFilter === 'Today'
    ? holidayFallback
      ? `Next scheduled day · ${formatDate(focusDate)}`
      : "Today's scheduled patients"
    : 'Patients and follow-up activity for this clinic.'

  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#151c23] sm:text-3xl">Patients</h1><p className="mt-1 text-sm text-[#424752]">{listCaption}</p></div><button onClick={() => setBookingOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md"><Plus size={17} /><span className="hidden sm:inline">New Patient</span></button></div>
    <div className="relative mb-6"><input value={query} onChange={(event) => updateSearch(event.target.value)} className="h-14 w-full rounded-xl border-0 bg-white px-6 pr-12 text-sm text-[#151c23] shadow-sm outline-none placeholder:text-[#727783] focus:ring-2 focus:ring-[#005db6]/20" placeholder="Search patients by name, phone, email, or ID..." /><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#424752]" size={20} /></div>
    <div className="mb-5 flex items-center gap-3"><label htmlFor="patient-date-filter" className="text-sm font-semibold text-[#424752]">Appointments:</label><select id="patient-date-filter" value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)} className="rounded-xl bg-[#e8eef8] px-4 py-3 text-xs font-bold text-[#424752] outline-none"><option>All Dates</option><option>Today</option><option>Tomorrow</option><option>Next 3 Days</option><option>Next 1 Week</option></select></div>
    <div className="dental-stitch-hide-scrollbar mb-7 flex gap-3 overflow-x-auto pb-1">{(['All Patients', 'Active Follow-up', 'Upcoming', 'Completed', 'Cancelled', 'No Recent Visit'] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition ${filter === item ? (item === 'Cancelled' ? 'bg-rose-600 text-white shadow-md' : 'bg-[#005db6] text-white shadow-md') : 'bg-[#dce3ec] text-[#424752] hover:bg-[#e2e9f2]'}`}>{item}</button>)}</div>
    <ClinicDataStatus error={error} onRetry={() => void loadPatients()} empty={!loading && !error && visible.length === 0} emptyText={patients.length ? (filter === 'Cancelled' ? (dateFilter === 'Today' ? 'No cancelled appointments for today. Switch to All Dates to see earlier cancellations.' : 'No cancelled appointments match this date range.') : dateFilter === 'Today' ? (holidayFallback ? 'No patients are booked on the next scheduled day.' : 'No patients are scheduled today. Switch to All Dates to see the full roster.') : 'No patients match your search.') : 'No patients are in this clinic yet.'} />
    {loading ? <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">Loading patients…</div> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{visible.map((patient) => {
        const visit = filter === 'Cancelled'
          ? latestCancelledVisit(appointments, patient.id, dateFilter === 'Today' ? focusDate : undefined)
          : dayVisitForPatient(appointments, patient.id, focusDate) || pickDefaultClinicVisit(appointments.filter((item) => item.patient_id === patient.id))
        const status = patientStatus(patient, visit)
        const tone = patientTone(status)
        const selectedCard = patient.id === selectedId
        const completed = visit?.status === 'completed'
        const cancelled = visit?.status === 'cancelled'
        return <article key={patient.id} className={`dental-stitch-card flex flex-col gap-4 border p-5 transition hover:-translate-y-0.5 ${selectedCard ? 'ring-2 ring-[#005db6]/40 ' : ''}${tone.card}`}>
          <button type="button" onClick={() => choose(patient.id)} className="flex items-start justify-between gap-3 text-left"><div className="flex gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${tone.avatar}`}>{patientInitials(patient)}</div><div><h2 className="text-xl font-semibold text-[#151c23]">{patientDisplayName(patient)}</h2><p className="text-xs text-[#727783]">ID: #{patient.id.slice(0, 8)}</p></div></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${tone.badge}`}>{status}</span></button>
          <div className="flex items-center gap-2 border-y border-white/70 py-3 text-sm text-[#424752]"><Stethoscope size={18} className={tone.icon} /> Last visit: {formatDate(patient.last_visit)}</div>
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-2 text-xs font-bold text-[#151c23]"><Clock3 size={17} className={tone.icon} />{cancelled ? `Cancelled: ${formatDate(visit?.appointment_date)}` : `Next: ${formatDate(patient.next_appointment)}`}</span>
            {cancelled && <p className="text-xs text-rose-700">{cancelledReason(visit)}</p>}
            <div className="flex flex-wrap items-center gap-2">
              {!cancelled && <button type="button" onClick={() => navigate(consultationPath(visit?.id, patient.id))} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#005db6] px-3 py-2.5 text-xs font-bold text-white shadow-sm min-w-[148px]"><ArrowUpRight size={16} /> {completed ? 'View Consultation' : 'Start Consultation'}</button>}
              {visit && isOpenVisit(visit) && <button type="button" onClick={() => { setChangeError(''); setChangeVisit({ patient, visit }) }} className="rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm">Cancel</button>}
              <button type="button" onClick={() => navigate(`/dental-client/patients/${encodeURIComponent(patient.id)}`)} className={`rounded-xl px-3 py-2.5 text-xs font-bold ${tone.action}`}>View Profile</button>
              <a href={`tel:${patient.phone || ''}`} aria-label={`Call ${patientDisplayName(patient)}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-[#005db6] shadow-sm"><Phone size={18} /></a>
              <button type="button" aria-label={`Message ${patientDisplayName(patient)}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#005db6] text-white shadow-md"><MessageCircle size={18} /></button>
            </div>
          </div>
        </article>
      })}</div>
      <PatientSnapshot
        patient={selected}
        profile={profile}
        visit={selectedVisit}
        pain={pain}
        setPain={setPain}
        onStart={() => selectedVisit && selectedId && navigate(consultationPath(selectedVisit.id, selectedId))}
        onCancel={() => {
          if (!selected || !selectedVisit || !isOpenVisit(selectedVisit)) return
          setChangeError('')
          setChangeVisit({ patient: selected, visit: selectedVisit })
        }}
        onEdit={() => selectedId && navigate(`/dental-client/patients/${encodeURIComponent(selectedId)}`)}
        onDocuments={() => selectedVisit && selectedId ? navigate(consultationPath(selectedVisit.id, selectedId, 'documents')) : navigate(selectedId ? `/dental-client/patients/${encodeURIComponent(selectedId)}` : '/dental-client/patients')}
        onNotes={() => navigate(selectedId ? `/dental-client/clinical-notes?patient=${encodeURIComponent(selectedId)}` : '/dental-client/clinical-notes')}
      />
    </div>}
    <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onSubmit={handleBooking} />
    {changeVisit && <VisitChangeModal patient={changeVisit.patient} visit={changeVisit.visit} saving={changeSaving} error={changeError} onClose={() => { if (!changeSaving) setChangeVisit(null) }} onConfirm={(intent) => void handleVisitChange(intent)} />}
  </div>
}

function PatientSnapshot({ patient, profile, visit, pain, setPain, onStart, onCancel, onEdit, onDocuments, onNotes }: { patient?: Patient; profile: PatientProfile | null; visit?: Appointment; pain: number; setPain: (value: number) => void; onStart: () => void; onCancel: () => void; onEdit: () => void; onDocuments: () => void; onNotes: () => void }) {
  if (!patient) return <aside className="dental-stitch-card p-6 text-sm text-[#727783]">Select a patient to see today's visit, alerts, and clinical snapshot.</aside>
  const reports = [...(profile?.reports || [])].sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at)).slice(0, 3)
  const completed = visit?.status === 'completed'
  const cancelled = visit?.status === 'cancelled'
  const badge = consultationBadge(visit)
  const visitTitle = cancelled ? 'Cancelled visit' : completed ? 'Completed visit' : "Today's visit"
  return <aside className="space-y-4 xl:sticky xl:top-24">
    <section className="dental-stitch-card p-5">
      <div className="flex items-start gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d6e3ff] text-lg font-bold text-[#005db6]">{patientInitials(patient)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[#151c23]">{patientDisplayName(patient)}</h2>{badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cancelled ? 'bg-rose-600 text-white' : completed ? 'bg-[#16704d] text-white' : 'bg-[#fff0d8] text-[#8a5a00]'}`}>{badge}</span>}</div><p className="mt-1 truncate text-xs text-[#727783]">MRN: {patient.id.slice(0, 8).toUpperCase()}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#727783]"><span className="flex items-center gap-1"><Phone size={12} />{patient.phone || 'No phone'}</span><span className="flex items-center gap-1"><Mail size={12} />{patient.email || 'No email'}</span></div></div></div>
      <button onClick={onEdit} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-sky-700">Edit patient record</button>
    </section>
    <section className="dental-stitch-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-[#151c23]">{visitTitle}</h3><div className="flex items-center gap-2">{visit && isOpenVisit(visit) && <button type="button" onClick={onCancel} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">Cancel</button>}{!cancelled && <button type="button" onClick={onStart} disabled={!visit} className="rounded-lg bg-[#005db6] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{completed ? 'View' : 'Start'}</button>}</div></div>
      <p className="text-sm text-[#151c23]">{cancelled ? cancelledReason(visit) : visit?.reason || (completed ? 'Consultation completed' : 'No upcoming visit')}</p>
      <p className="mt-1 text-xs text-[#727783]">{visit ? `${formatDate(visit.appointment_date)} · ${String(visit.appointment_time).slice(0, 5)}` : 'Book an appointment to start a consultation.'}</p>
      {!completed && !cancelled && <label className="mt-4 block text-xs text-[#727783]">Pain level<div className="mt-2 flex items-center gap-2"><span>0</span><input type="range" min="0" max="10" value={pain} onChange={(event) => setPain(Number(event.target.value))} className="flex-1 accent-[#005db6]" /><span>10</span></div><p className="text-center font-bold text-[#005db6]">{pain}/10</p></label>}
    </section>
    <section className="dental-stitch-card p-5">
      <h3 className="mb-3 text-sm font-bold text-[#151c23]">Care snapshot</h3>
      <Summary label="Treatment plan" value={profile?.visits.length ? 'In progress' : 'Not started'} />
      <Summary label="Prescriptions" value={`${profile?.prescriptions.length ?? 0} active`} />
      <Summary label="Total visits" value={String(profile?.visits.length ?? 0)} />
    </section>
    <section className="dental-stitch-card p-5">
      <div className="mb-3 flex items-start gap-2 text-sm text-rose-600"><Heart size={15} className="mt-0.5 shrink-0 fill-rose-500" /><span><b className="block">Medical alerts</b><small className="text-xs text-[#727783]">{patient.notes || 'No alerts recorded'}</small></span></div>
    </section>
    <section className="dental-stitch-card p-5">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-[#151c23]">Documents</h3><button onClick={onDocuments} className="text-xs font-bold text-[#005db6]">View all</button></div>
      {reports.length ? reports.map((report) => <button key={report.id} onClick={onDocuments} className="mb-2 flex w-full items-center gap-3 rounded-lg border border-[#c2c6d4]/30 p-3 text-left last:mb-0 hover:bg-[#edf4fe]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4fe] text-[#005db6]"><Image size={16} /></span><span className="min-w-0"><b className="block truncate text-xs text-[#151c23]">{report.file_name}</b><small className="text-[10px] text-[#727783]">{formatDate(report.uploaded_at)}</small></span><ChevronDown size={14} className="shrink-0 -rotate-90 text-[#727783]" /></button>) : <p className="text-sm text-[#727783]">No documents attached to this patient.</p>}
    </section>
    <section className="dental-stitch-card p-5">
      <h3 className="text-sm font-bold text-[#151c23]">Last clinical note</h3>
      <p className="mt-2 text-sm leading-6 text-[#424752]">{profile?.visits[0]?.summary || 'No clinical note has been recorded for this patient.'}</p>
      <button onClick={onNotes} className="mt-3 text-sm font-bold text-[#005db6]">View all notes</button>
    </section>
  </aside>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-[#c2c6d4]/20 py-2.5 text-sm last:border-0"><span className="text-[#727783]">{label}</span><b className="text-right text-[#151c23]">{value}</b></div>
}

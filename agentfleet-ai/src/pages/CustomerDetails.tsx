import { useEffect, useState, type FormEvent } from 'react'
import { Check, Edit3, Mail, Phone, Search, UserRound, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PatientProfile from './PatientProfile'
import { DashboardService, type Patient, type PatientProfile as PatientProfileData } from '../services/dashboardService'

type Draft = { firstName: string; lastName: string; email: string; phone: string; notes: string }

export default function CustomerDetails() {
  const { id } = useParams<{ id?: string }>()
  return id ? <PatientProfile /> : <CustomerDirectory />
}

function CustomerDirectory() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [profile, setProfile] = useState<PatientProfileData | null>(null)
  const [draft, setDraft] = useState<Draft>({ firstName: '', lastName: '', email: '', phone: '', notes: '' })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const result = await DashboardService.getPatients(query, 100, 0)
        if (active) {
          setPatients(result.data)
          setSelectedId((current) => current && result.data.some((patient) => patient.id === current) ? current : result.data[0]?.id || null)
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load customers')
      } finally { if (active) setLoading(false) }
    }
    const timer = window.setTimeout(() => void load(), 200)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query])

  useEffect(() => {
    if (!selectedId) { setProfile(null); return }
    let active = true
    setProfileLoading(true)
    void DashboardService.getPatientProfile(selectedId).then((result) => {
      if (!active) return
      setProfile(result)
      setDraft({ firstName: result.patient.first_name, lastName: result.patient.last_name, email: result.patient.email || '', phone: result.patient.phone || '', notes: result.patient.notes || '' })
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load customer details') }).finally(() => { if (active) setProfileLoading(false) })
    return () => { active = false }
  }, [selectedId])

  const saveDetails = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedId) return
    setSaving(true); setError(''); setNotice('')
    try {
      const patient = await DashboardService.updatePatient(selectedId, { firstName: draft.firstName, lastName: draft.lastName, email: draft.email || null, phone: draft.phone || null, notes: draft.notes || null })
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, ...patient } : item))
      setProfile((current) => current ? { ...current, patient } : current)
      setEditing(false); setNotice('Customer details updated.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save customer details') }
    finally { setSaving(false) }
  }

  const selected = profile?.patient || patients.find((patient) => patient.id === selectedId)
  const selectPatient = (patient: Patient) => { setSelectedId(patient.id); setEditing(false); setNotice('') }
  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#727783]">Clinical workspace</p><h1 className="mt-1 text-2xl font-bold text-[#151c23] sm:text-3xl">Customer Details</h1><p className="mt-2 max-w-2xl text-sm text-[#727783]">Select a customer to review their contact details and care activity without leaving the directory.</p></div>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mb-4 rounded-xl bg-[#dff7ed] p-4 text-sm text-[#16704d]">{notice}</p>}
    <section className="grid min-h-[620px] overflow-hidden rounded-3xl border border-[#c2c6d4]/30 bg-white shadow-[0_10px_30px_rgba(15,54,92,0.06)] lg:grid-cols-[minmax(280px,360px)_1fr]">
      <CustomerList patients={patients} query={query} loading={loading} selectedId={selectedId} setQuery={setQuery} selectPatient={selectPatient} />
      <CustomerPane selected={selected} profile={profile} loading={profileLoading} editing={editing} draft={draft} saving={saving} setEditing={setEditing} setDraft={setDraft} saveDetails={saveDetails} openFullRecord={() => selected && navigate(`/dental-client/customers/${selected.id}`)} />
    </section>
  </div>
}

function CustomerList({ patients, query, loading, selectedId, setQuery, selectPatient }: { patients: Patient[]; query: string; loading: boolean; selectedId: string | null; setQuery: (value: string) => void; selectPatient: (patient: Patient) => void }) {
  return <div className="border-b border-[#c2c6d4]/30 bg-[#f7f9ff] lg:border-b-0 lg:border-r"><div className="border-b border-[#c2c6d4]/30 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-bold text-[#151c23]">Customers</h2><p className="mt-1 text-xs text-[#727783]">{patients.length} records</p></div><UserRound size={19} className="text-[#005db6]" /></div><div className="relative"><input aria-label="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, email..." className="h-11 w-full rounded-xl border border-[#c2c6d4]/40 bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727783]" size={17} /></div></div><div className="dental-stitch-scrollbar max-h-[530px] space-y-1 overflow-y-auto p-3">{loading ? <p className="p-3 text-sm text-[#727783]">Loading customers...</p> : patients.length === 0 ? <p className="p-3 text-sm text-[#727783]">No customers match this search.</p> : patients.map((patient) => <button key={patient.id} onClick={() => selectPatient(patient)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selectedId === patient.id ? 'bg-[#005db6] text-white shadow-md' : 'text-[#151c23] hover:bg-[#eaf2fc]'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selectedId === patient.id ? 'bg-white/20' : 'bg-[#d6e3ff] text-[#005db6]'}`}><UserRound size={18} /></span><span className="min-w-0"><b className="block truncate text-sm">{patient.first_name} {patient.last_name}</b><small className={`block truncate text-xs ${selectedId === patient.id ? 'text-white/75' : 'text-[#727783]'}`}>{patient.phone || patient.email || `ID: ${patient.id.slice(0, 12)}`}</small></span></button>)}</div></div>
}

function CustomerPane({ selected, profile, loading, editing, draft, saving, setEditing, setDraft, saveDetails, openFullRecord }: { selected?: Patient; profile: PatientProfileData | null; loading: boolean; editing: boolean; draft: Draft; saving: boolean; setEditing: (value: boolean) => void; setDraft: (value: Draft) => void; saveDetails: (event: FormEvent) => void; openFullRecord: () => void }) {
  if (loading) return <div className="flex min-h-[500px] items-center justify-center p-5 text-sm text-[#727783]">Loading customer details...</div>
  if (!selected) return <div className="flex min-h-[500px] flex-col items-center justify-center p-5 text-center"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4fe] text-[#005db6]"><UserRound size={28} /></span><h2 className="text-lg font-bold text-[#151c23]">Select a customer</h2><p className="mt-2 max-w-xs text-sm text-[#727783]">Choose a record from the list to view contact details, visits, prescriptions, and reports.</p></div>
  const initials = `${selected.first_name[0] || ''}${selected.last_name[0] || ''}`
  return <div className="p-5 sm:p-8"><div className="flex flex-col justify-between gap-4 border-b border-[#c2c6d4]/30 pb-6 sm:flex-row sm:items-start"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d6e3ff] text-xl font-bold text-[#005db6]">{initials}</div><div><p className="text-xs font-bold uppercase tracking-widest text-[#727783]">Customer record</p><h2 className="mt-1 text-2xl font-bold text-[#151c23]">{selected.first_name} {selected.last_name}</h2><p className="mt-1 text-xs text-[#727783]">ID: #{selected.id.slice(0, 12)}</p></div></div><div className="flex gap-2"><button type="button" onClick={() => setEditing(!editing)} className="flex items-center gap-2 rounded-xl bg-[#edf4fe] px-3 py-2 text-xs font-bold text-[#005db6]">{editing ? <X size={15} /> : <Edit3 size={15} />}{editing ? 'Cancel' : 'Edit details'}</button><button type="button" onClick={openFullRecord} className="rounded-xl bg-[#005db6] px-3 py-2 text-xs font-bold text-white">Full record</button></div></div>{editing ? <form onSubmit={saveDetails} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><EditField label="First name" value={draft.firstName} required onChange={(value) => setDraft({ ...draft, firstName: value })} /><EditField label="Last name" value={draft.lastName} required onChange={(value) => setDraft({ ...draft, lastName: value })} /><EditField label="Email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} /><EditField label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} /></div><label className="block text-xs font-bold text-[#424752]">Notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="mt-1 h-28 w-full rounded-xl border border-[#c2c6d4]/60 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label><button disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white disabled:opacity-50"><Check size={15} />{saving ? 'Saving...' : 'Save customer details'}</button></form> : <CustomerSummary selected={selected} profile={profile} />}</div>
}

function CustomerSummary({ selected, profile }: { selected: Patient; profile: PatientProfileData | null }) { return <><div className="mt-6 grid gap-4 sm:grid-cols-2"><Detail icon={<Phone size={17} />} label="Phone" value={selected.phone || 'Not provided'} /><Detail icon={<Mail size={17} />} label="Email" value={selected.email || 'Not provided'} /></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><Summary label="Visits" value={String(profile?.visits.length || 0)} /><Summary label="Prescriptions" value={String(profile?.prescriptions.length || 0)} /><Summary label="Reports" value={String(profile?.reports.length || 0)} /></div><div className="mt-6 rounded-2xl bg-[#f7f9ff] p-5"><p className="text-xs font-bold uppercase tracking-widest text-[#727783]">Customer notes</p><p className="mt-2 text-sm leading-6 text-[#424752]">{selected.notes || 'No notes have been recorded for this customer.'}</p></div></> }
function EditField({ label, value, required, onChange }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) { return <label className="block text-xs font-bold text-[#424752]">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/60 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label> }
function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-[#c2c6d4]/30 p-4"><span className="text-[#005db6]">{icon}</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-[#727783]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[#151c23]">{value}</p></div></div> }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#edf4fe] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#727783]">{label}</p><p className="mt-2 text-2xl font-bold text-[#005db6]">{value}</p></div> }

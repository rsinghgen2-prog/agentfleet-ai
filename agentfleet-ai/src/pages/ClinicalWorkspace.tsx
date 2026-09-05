import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FileText, HeartPulse, MessageSquare, Search, Send, Smile, Stethoscope, Upload, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { DashboardService, type DentistNote, type Patient, type PatientProfile } from '../services/dashboardService'
import CommunicationsInbox from '../components/dental/CommunicationsInbox'
import { DentalChartPanel } from '../components/dental/DentalChartPanel'
import { MedicalHistoryPanel } from '../components/dental/MedicalHistoryPanel'
import { TreatmentPlanPanel } from '../components/dental/TreatmentPlanPanel'
import { describeApiError } from '../utils/apiError'
import { ClinicDataStatus } from '../components/dental/ClinicDataStatus'

type Workspace = 'chart' | 'treatment' | 'history' | 'notes' | 'documents' | 'communications'
const copy: Record<Workspace, { title: string; eyebrow: string; description: string; icon: typeof Smile }> = {
  chart: { title: 'Dental Chart', eyebrow: 'Clinical record', description: 'Review tooth conditions and the current treatment context for every patient.', icon: Smile },
  treatment: { title: 'Treatment Plan', eyebrow: 'Care coordination', description: 'Track planned care and the next clinical action for each patient.', icon: Stethoscope },
  history: { title: 'Medical History', eyebrow: 'Patient safety', description: 'Review contact details, medical notes, alerts, and visit history before treatment.', icon: HeartPulse },
  notes: { title: 'Clinical Notes', eyebrow: 'Provider workspace', description: 'Create and maintain internal notes for the clinic team.', icon: FileText },
  documents: { title: 'Documents', eyebrow: 'Patient records', description: 'Find clinical reports and laboratory documents attached to patient records.', icon: FileText },
  communications: { title: 'Communications', eyebrow: 'Patient support', description: 'Review the clinic support conversation and send a message to the care team.', icon: MessageSquare },
}

export default function ClinicalWorkspace({ kind }: { kind: Workspace }) {
  const [params, setParams] = useSearchParams()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedId, setSelectedId] = useState(params.get('patient') || '')
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileTick, setProfileTick] = useState(0)
  const metadata = copy[kind]

  const loadPatients = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const result = await DashboardService.getPatients('', 100, 0)
      setPatients(result.data)
      setSelectedId((current) => current || result.data[0]?.id || '')
    } catch (reason) {
      setListError(describeApiError(reason, 'Unable to load patients from the backend.'))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void loadPatients() }, [loadPatients])
  useEffect(() => { const patient = params.get('patient'); if (patient) setSelectedId(patient) }, [params])
  useEffect(() => {
    if (!selectedId) { setProfile(null); setProfileError(''); return }
    setProfileError('')
    void DashboardService.getPatientProfile(selectedId).then((result) => { setProfile(result); setProfileError('') }).catch((reason) => { setProfile(null); setProfileError(describeApiError(reason, 'Unable to load this patient record.')) })
  }, [selectedId, profileTick])
  const choose = (id: string) => { setSelectedId(id); setParams({ patient: id }, { replace: true }) }
  const retry = () => { void loadPatients(); setProfileTick((tick) => tick + 1) }
  const filtered = patients.filter((patient) => `${patient.first_name} ${patient.last_name} ${patient.phone || ''} ${patient.email || ''}`.toLowerCase().includes(query.toLowerCase()))
  const Icon = metadata.icon
  const error = listError || profileError
  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8"><div className="mb-6"><div className="flex items-center gap-2 text-[#005db6]"><Icon size={18} /><p className="text-xs font-bold uppercase tracking-[0.16em]">{metadata.eyebrow}</p></div><h1 className="mt-2 text-2xl font-bold text-[#151c23] sm:text-3xl">{metadata.title}</h1><p className="mt-2 max-w-2xl text-sm text-[#727783]">{metadata.description}</p></div><ClinicDataStatus error={error} onRetry={retry} empty={!loading && !error && patients.length === 0} emptyText="No patients are in this clinic yet." /><div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"><PatientPicker patients={filtered} query={query} loading={loading} loadFailed={Boolean(listError)} selectedId={selectedId} setQuery={setQuery} choose={choose} />{kind === 'chart' && <ChartPanel profile={profile} />}{kind === 'treatment' && <TreatmentPanel profile={profile} />}{kind === 'history' && <HistoryPanel profile={profile} />}{kind === 'notes' && <NotesPanel />}{kind === 'documents' && <DocumentsPanel profile={profile} />}{kind === 'communications' && <CommunicationsInbox />}</div></div>
}

function PatientPicker({ patients, query, loading, loadFailed, selectedId, setQuery, choose }: { patients: Patient[]; query: string; loading: boolean; loadFailed: boolean; selectedId: string; setQuery: (value: string) => void; choose: (id: string) => void }) {
  return <section className="dental-stitch-card h-fit overflow-hidden"><div className="border-b border-[#c2c6d4]/30 bg-[#f7f9ff] p-4"><h2 className="font-bold text-[#151c23]">Patients</h2><div className="relative mt-3"><input aria-label="Search patients" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patients..." className="h-10 w-full rounded-xl border border-[#c2c6d4]/40 bg-white px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727783]" size={16} /></div></div><div className="max-h-[520px] space-y-1 overflow-y-auto p-3">{loading ? <p className="p-3 text-sm text-[#727783]">Loading patients...</p> : loadFailed ? <p className="p-3 text-sm text-[#761538]">Patients could not be loaded. Use Retry above.</p> : patients.length === 0 ? <p className="p-3 text-sm text-[#727783]">No patients found.</p> : patients.map((patient) => <button key={patient.id} onClick={() => choose(patient.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${selectedId === patient.id ? 'bg-[#005db6] text-white' : 'hover:bg-[#edf4fe]'}`}><span className={`flex h-9 w-9 items-center justify-center rounded-full ${selectedId === patient.id ? 'bg-white/20' : 'bg-[#d6e3ff] text-[#005db6]'}`}><UserRound size={16} /></span><span className="min-w-0"><b className="block truncate text-sm">{patient.first_name} {patient.last_name}</b><small className={`block truncate text-xs ${selectedId === patient.id ? 'text-white/75' : 'text-[#727783]'}`}>{patient.phone || patient.email || 'No contact details'}</small></span></button>)}</div></section>
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) { return <section className="dental-stitch-card p-5 sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-[#151c23]">{title}</h2>{action}</div>{children}</section> }
function Empty({ text }: { text: string }) { return <p className="rounded-xl bg-[#f7f9ff] p-5 text-sm text-[#727783]">{text}</p> }
function ChartPanel({ profile }: { profile: PatientProfile | null }) {
  if (!profile) return <Empty text="Choose a patient to view the dental chart." />
  return <DentalChartPanel profile={profile} />
}

function TreatmentPanel({ profile }: { profile: PatientProfile | null }) {
  if (!profile) return <Empty text="Choose a patient to view the treatment plan." />
  return <TreatmentPlanPanel profile={profile} />
}

function HistoryPanel({ profile }: { profile: PatientProfile | null }) {
  const [current, setCurrent] = useState(profile)
  useEffect(() => { setCurrent(profile) }, [profile])
  if (!current) return <Panel title="Medical history"><Empty text="Choose a patient to view medical history." /></Panel>
  return <MedicalHistoryPanel profile={current} onUpdated={setCurrent} />
}
function NotesPanel() {
  const [notes, setNotes] = useState<DentistNote[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    void DashboardService.getDentistNotes().then((result) => { setNotes(result); setError('') }).catch((reason) => setError(describeApiError(reason, 'Unable to load clinical notes from the backend.')))
  }, [])
  const add = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) return
    try {
      const note = await DashboardService.createDentistNote({ title: 'Clinical note', content: draft })
      setNotes((current) => [note, ...current])
      setDraft('')
      setError('')
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to save clinical note.'))
    }
  }
  return <Panel title="Clinical notes">{error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}<form onSubmit={add} className="mb-5 flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add note for care team..." className="h-11 flex-1 rounded-xl border border-[#c2c6d4]/50 px-3 text-sm" /><button className="rounded-xl bg-[#005db6] px-4 text-white"><Send size={16} /></button></form>{notes.length ? <div className="space-y-3">{notes.map((note) => <article key={note.id} className="rounded-xl bg-[#f7f9ff] p-4 text-sm">{note.content}</article>)}</div> : <Empty text={error ? 'Clinical notes could not be loaded.' : 'No clinical notes yet.'} />}</Panel>
}
function DocumentsPanel({ profile }: { profile: PatientProfile | null }) { const [uploading, setUploading] = useState(false); const [notice, setNotice] = useState(''); const upload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file || !profile) return; if (file.size > 2 * 1024 * 1024) { setNotice('Files must be 2 MB or smaller.'); return } const reader = new FileReader(); reader.onload = () => { const result = typeof reader.result === 'string' ? reader.result : ''; setUploading(true); void DashboardService.createMedicalReport({ patientId: profile.patient.id, fileName: file.name, mimeType: file.type || 'application/octet-stream', fileSize: file.size, dataBase64: result.includes(',') ? result.slice(result.indexOf(',') + 1) : result, description: 'Uploaded from Documents.' }).then(() => setNotice('Document uploaded. Reload the patient record to view it.')).catch((reason) => setNotice(describeApiError(reason, 'Unable to upload document.'))).finally(() => setUploading(false)) }; reader.readAsDataURL(file) }; return <div className="space-y-5"><Panel title="Documents" action={<label className="flex cursor-pointer items-center gap-1 text-xs font-bold text-[#005db6]"><Upload size={15} />{uploading ? 'Uploading...' : 'Upload document'}<input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={upload} className="sr-only" /></label>}>{notice && <p className="mb-3 rounded-lg bg-[#edf4fe] p-3 text-xs text-[#005db6]">{notice}</p>}{profile ? <div className="space-y-3">{profile.reports.map((report) => <div key={report.id} className="flex gap-3 rounded-xl border border-[#c2c6d4]/30 p-4"><FileText className="text-[#005db6]" /><div><p className="text-sm font-semibold">{report.file_name}</p><p className="text-xs text-[#727783]">{report.description || 'Clinical report'}</p></div></div>)}{profile.lab_orders.map((order) => <div key={order.id} className="flex gap-3 rounded-xl border border-[#c2c6d4]/30 p-4"><FileText className="text-[#005db6]" /><div><p className="text-sm font-semibold">{order.order_number}</p><p className="text-xs text-[#727783]">{order.lab_name} · {order.dispatch_status}</p></div></div>)}{!profile.reports.length && !profile.lab_orders.length && <Empty text="No documents attached." />}</div> : <Empty text="Choose a patient to view documents." />}</Panel><NotesPanel /></div> }
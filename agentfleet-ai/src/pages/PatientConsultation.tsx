import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, Edit3, FileText, Heart, Mail, Phone, Printer, Save, Share2, Upload, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DentalChartPanel } from '../components/dental/DentalChartPanel'
import { DocumentsPanel } from '../components/dental/DocumentsPanel'
import { MedicalHistoryPanel } from '../components/dental/MedicalHistoryPanel'
import { TreatmentPlanPanel } from '../components/dental/TreatmentPlanPanel'
import { DashboardService, type Appointment, type PatientProfile, type TreatmentPlan } from '../services/dashboardService'
import { describeApiError } from '../utils/apiError'
import { patientDisplayName, patientInitials } from '../utils/clinicSchedule'
import { buildVisitCharges, chargesDescription, chargesTotal } from '../utils/visitCharges'

type Action = 'back' | 'complete'
type Tab = 'Visit' | 'Dental Chart' | 'Treatment Plan' | 'Imaging' | 'Documents' | 'Medical History' | 'Complete'
type Draft = { reason: string; duration: string; painLevel: string; bloodPressure: string; pulse: string; temperature: string; exam: string; findings: string; treatment: string; notes: string }

const tabs: Tab[] = ['Visit', 'Dental Chart', 'Treatment Plan', 'Imaging', 'Documents', 'Medical History', 'Complete']
const blankDraft: Draft = { reason: '', duration: '', painLevel: '0', bloodPressure: '', pulse: '', temperature: '', exam: '', findings: '', treatment: '', notes: '' }
const inputClass = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-200'
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const tabFromQuery = (value: string | null): Tab => {
  if (value === 'chart' || value === 'dental-chart') return 'Dental Chart'
  if (value === 'plan' || value === 'treatment' || value === 'treatment-plan') return 'Treatment Plan'
  if (value === 'imaging') return 'Imaging'
  if (value === 'documents' || value === 'document') return 'Documents'
  if (value === 'history' || value === 'medical-history') return 'Medical History'
  if (value === 'complete') return 'Complete'
  return 'Visit'
}

function extractNotes(notes: string) {
  const match = notes.match(/(?:Consultation notes|Notes):\s*([\s\S]*)$/i)
  if (!match) return notes
  const text = match[1].trim()
  return text === 'Not recorded' ? '' : text
}

function draftFromAppointment(current: Appointment): Draft {
  const plan = current.treatment_plan && typeof current.treatment_plan === 'object' ? current.treatment_plan : {}
  const vitals = plan.vitals && typeof plan.vitals === 'object' ? plan.vitals as Record<string, unknown> : {}
  return {
    reason: current.reason || '',
    duration: String(plan.duration || ''),
    painLevel: String(plan.painLevel ?? '0'),
    bloodPressure: String(vitals.bloodPressure || ''),
    pulse: String(vitals.pulse || ''),
    temperature: String(vitals.temperature || ''),
    exam: String(plan.exam || ''),
    findings: current.diagnosis || '',
    treatment: typeof plan.plan === 'string' ? plan.plan : '',
    notes: extractNotes(current.notes || ''),
  }
}

export default function PatientConsultation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment')
  const patientId = searchParams.get('patient')
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [plans, setPlans] = useState<TreatmentPlan[]>([])
  const [draft, setDraft] = useState(blankDraft)
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromQuery(searchParams.get('tab')))
  const [pendingAction, setPendingAction] = useState<Action | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState('')
  const [error, setError] = useState('')
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => { setActiveTab(tabFromQuery(searchParams.get('tab'))) }, [searchParams])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      let current: Appointment | null = null
      if (appointmentId) {
        current = await DashboardService.getAppointment(appointmentId)
      } else if (patientId) {
        const now = new Date(); const from = new Date(now); const to = new Date(now)
        from.setDate(from.getDate() - 365); to.setDate(to.getDate() + 365)
        const appointments = await DashboardService.getAppointments(dateKey(from), dateKey(to))
        const forPatient = appointments.filter((item) => item.patient_id === patientId)
        current = forPatient.find((item) => !['cancelled', 'completed'].includes(item.status)) || forPatient[0] || null
      }
      if (!current) throw new Error('Select a patient appointment to open consultation')
      const patientProfile = await DashboardService.getPatientProfile(current.patient_id)
      const treatmentPlans = await DashboardService.getTreatmentPlans(current.patient_id).catch(() => [] as TreatmentPlan[])
      if (!active) return
      setAppointment(current)
      setProfile(patientProfile)
      setPlans(treatmentPlans)
      setDraft(draftFromAppointment(current))
    }
    void load().catch((reason) => { if (active) setError(describeApiError(reason, 'Unable to load consultation from the backend.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [appointmentId, patientId, retryTick])

  const update = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }))

  const saveVisit = async (status: 'in_progress' | 'completed') => {
    if (!appointment) return
    setSaving(true)
    setError('')
    setSavedNotice('')
    try {
      const notes = [`Exam: ${draft.exam || 'Not recorded'}`, `Assessment: ${draft.findings || 'Not recorded'}`, `Plan: ${draft.treatment || 'Not recorded'}`, `Vitals: BP ${draft.bloodPressure || 'N/A'} · Pulse ${draft.pulse || 'N/A'} · Temperature ${draft.temperature || 'N/A'}`, `Pain: ${draft.painLevel}/10`, `Notes: ${draft.notes || 'Not recorded'}`].join('\n')
      const nextStatus = status === 'completed' ? 'completed' : (['scheduled', 'confirmed'].includes(appointment.status) ? 'in_progress' : status)
      const treatmentPlan = { plan: draft.treatment, exam: draft.exam, duration: draft.duration, painLevel: draft.painLevel, vitals: { bloodPressure: draft.bloodPressure, pulse: draft.pulse, temperature: draft.temperature } }
      const updated = await DashboardService.updateAppointment(appointment.id, {
        status: nextStatus,
        reason: draft.reason,
        diagnosis: draft.findings,
        notes,
        treatment_plan: treatmentPlan,
      })
      if (profile) {
        const nextPatient = await DashboardService.updatePatient(appointment.patient_id, {
          medicalHistory: { ...(profile.patient.medical_history || {}), bloodPressure: draft.bloodPressure, pulse: draft.pulse, temperature: draft.temperature },
        }).catch(() => null)
        if (nextPatient) setProfile({ ...profile, patient: { ...profile.patient, ...nextPatient, medical_history: { ...(profile.patient.medical_history || {}), bloodPressure: draft.bloodPressure, pulse: draft.pulse, temperature: draft.temperature } } })
      }
      setAppointment({
        ...appointment,
        ...updated,
        status: nextStatus,
        reason: draft.reason,
        diagnosis: draft.findings,
        notes,
        treatment_plan: treatmentPlan,
      })
      if (status === 'completed') {
        try {
          const lines = buildVisitCharges({ visit: { ...appointment, status: 'completed' }, plans, prescriptions: profile?.prescriptions || [], labOrders: profile?.lab_orders || [] })
          const existing = await DashboardService.getPayments({ customerId: appointment.patient_id })
          if (!existing.some((item) => item.description.includes(`Visit:${appointment.id}`))) {
            await DashboardService.createPayment({
              customerId: appointment.patient_id,
              amount: chargesTotal(lines),
              status: 'pending',
              description: chargesDescription(appointment.id, lines),
            })
          }
        } catch { /* Billing still opens even if the pending payment could not be created. */ }
        navigate(`/dental-client/payments?patient=${encodeURIComponent(appointment.patient_id)}`)
        return
      }
      setSavedNotice('Visit notes saved. The consultation stays in progress.')
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to save consultation'))
    } finally {
      setSaving(false)
    }
  }

  const confirmAction = async () => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    if (action === 'back') {
      navigate(patientId ? `/dental-client/patients?patient=${encodeURIComponent(patientId)}` : '/dental-client/patients')
      return
    }
    await saveVisit('completed')
  }

  const shareSummary = async () => {
    if (!profile || !appointment) return
    const name = patientDisplayName(profile.patient)
    const text = [`Consultation — ${name}`, `Visit: ${appointment.appointment_type} · ${String(appointment.appointment_date).slice(0, 10)} ${String(appointment.appointment_time).slice(0, 5)}`, `Complaint: ${draft.reason || 'Not recorded'}`, `Assessment: ${draft.findings || 'Not recorded'}`, `Plan: ${draft.treatment || 'Not recorded'}`, `Pain: ${draft.painLevel}/10`].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setSavedNotice('Consultation summary copied to clipboard.')
    } catch {
      setError('Unable to copy the consultation summary.')
    }
  }

  if (loading) return <div className="min-h-screen p-10 text-center text-sm text-slate-500">Loading consultation...</div>
  if (!appointment || !profile) return <div className="min-h-screen p-10 text-center"><p className="text-sm text-red-600">{error || 'Consultation not found.'}</p><button onClick={() => setRetryTick((tick) => tick + 1)} className="mt-4 mr-2 rounded-lg border border-sky-600 px-4 py-2 text-sm font-medium text-sky-700">Retry</button><button onClick={() => navigate('/dental-client')} className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white">Back to dashboard</button></div>

  const patient = profile.patient
  const completed = appointment.status === 'completed'
  const allergies = patient.allergies?.length ? patient.allergies : []
  const medicalHistory = patient.medical_history || {}
  const conditions = Array.isArray(medicalHistory.conditions) ? medicalHistory.conditions.map(String) : []

  return (
    <div className="consultation-shell min-h-[calc(100vh-4rem)] px-4 py-5 text-[13px] text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setPendingAction('back')} className="flex items-center gap-2 text-sm font-medium text-sky-700 hover:underline"><ArrowLeft size={17} /> Back to patients</button>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{completed ? 'Consultation completed' : 'Consultation in progress'}</span>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"><Printer size={13} /> Print</button>
            <button type="button" onClick={() => void shareSummary()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"><Share2 size={13} /> Copy summary</button>
            <button type="button" disabled={saving || completed} onClick={() => void saveVisit('in_progress')} className="flex items-center gap-1.5 rounded-lg border border-sky-600 px-3 py-2 text-xs font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={13} /> {saving ? 'Saving…' : 'Save visit'}</button>
            <button type="button" disabled={completed} onClick={() => setPendingAction('complete')} className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"><CheckCircle2 size={13} /> {completed ? 'Completed' : 'Complete'}</button>
          </div>
        </div>
        {error && <div role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {savedNotice && <div role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{savedNotice}</div>}
        <PatientBanner patient={patient} appointment={appointment} allergies={allergies} conditions={conditions} onEdit={() => navigate(`/dental-client/patients/${encodeURIComponent(patient.id)}`)} />
        <div className="mt-4 flex gap-6 overflow-x-auto border-b border-slate-200 px-2">
          {tabs.map((tab) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 border-b-2 pb-3 text-sm font-medium ${activeTab === tab ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab}</button>)}
        </div>
        <div className="mt-4">
          {activeTab === 'Visit' && <VisitTab draft={draft} update={update} patient={patient} appointment={appointment} profile={profile} plans={plans} completed={completed} allergies={allergies} conditions={conditions} onComplete={() => setPendingAction('complete')} onPlans={() => setActiveTab('Treatment Plan')} onHistory={() => setActiveTab('Medical History')} onPrescriptionsAdded={(next) => setProfile(next)} />}
          {activeTab === 'Dental Chart' && <DentalChartPanel profile={profile} />}
          {activeTab === 'Treatment Plan' && <TreatmentPlanPanel profile={profile} plans={plans} onPlansChange={setPlans} />}
          {activeTab === 'Imaging' && <ImagingTab profile={profile} onDocuments={() => setActiveTab('Documents')} onRefresh={async () => setProfile(await DashboardService.getPatientProfile(patient.id))} />}
          {activeTab === 'Documents' && <DocumentsPanel profile={profile} onUpdated={setProfile} />}
          {activeTab === 'Medical History' && <MedicalHistoryPanel profile={profile} onUpdated={setProfile} />}
          {activeTab === 'Complete' && <CompleteTab draft={draft} completed={completed} onComplete={() => setPendingAction('complete')} />}
        </div>
      </div>
      {pendingAction && <ConfirmModal action={pendingAction} saving={saving} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmAction()} />}
    </div>
  )
}

function PatientBanner({ patient, appointment, allergies, conditions, onEdit }: { patient: PatientProfile['patient']; appointment: Appointment; allergies: string[]; conditions: string[]; onEdit: () => void }) {
  const name = patientDisplayName(patient)
  const initials = patientInitials(patient)
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700">{initials}</div>
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            {patient.gender && <span className="text-sm text-slate-400">{patient.gender}</span>}
            <span className="text-sm text-slate-400">Chairside consultation</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">MRN: {patient.id.slice(0, 8).toUpperCase()}</span>
            <span className="flex items-center gap-1"><Phone size={13} /> {patient.phone || 'No phone'}</span>
            <span className="flex items-center gap-1"><CalendarDays size={13} /> {patient.date_of_birth || 'DOB not recorded'}</span>
            <span className="flex items-center gap-1"><Mail size={13} /> {patient.email || 'No email'}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{appointment.appointment_type}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{String(appointment.appointment_date).slice(0, 10)} · {String(appointment.appointment_time).slice(0, 5)}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Last visit: {patient.last_visit || 'Not recorded'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${allergies.length ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><AlertTriangle size={14} /> {allergies.length ? `Allergies: ${allergies.join(', ')}` : 'No allergies recorded'}</span>
          <span className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${conditions.length ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><Heart size={14} /> {conditions.length ? conditions.join(', ') : 'No medical conditions flagged'}</span>
        </div>
        <button type="button" onClick={onEdit} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-sky-700"><Edit3 size={14} /> Edit patient</button>
      </div>
    </section>
  )
}

function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="dental-stitch-card p-4">{(title || action) && <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-800">{title}</h2>{action}</div>}{children}</section>
}

function VisitTab({ draft, update, patient, appointment, profile, plans, completed, allergies, conditions, onComplete, onPlans, onHistory, onPrescriptionsAdded }: {
  draft: Draft
  update: (key: keyof Draft, value: string) => void
  patient: PatientProfile['patient']
  appointment: Appointment
  profile: PatientProfile
  plans: TreatmentPlan[]
  completed: boolean
  allergies: string[]
  conditions: string[]
  onComplete: () => void
  onPlans: () => void
  onHistory: () => void
  onPrescriptionsAdded: (profile: PatientProfile) => void
}) {
  const readonly = completed
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[270px_minmax(0,1fr)_310px]">
      <div className="space-y-4">
        <Card title="Chief complaint">
          <SelectField label="Reason for visit" value={draft.reason} disabled={readonly} options={['Tooth Pain', 'Routine Checkup', 'Cleaning', 'Cavity Review', 'Follow-up', 'Emergency', 'Other']} onChange={(value) => update('reason', value)} />
          <SelectField label="Symptom duration" value={draft.duration} disabled={readonly} options={['Today', '2 Days', '3 Days', '1 Week', 'More than 1 Week']} onChange={(value) => update('duration', value)} />
          <label className="mt-3 block text-xs text-slate-500">Pain level<div className="mt-2 flex items-center gap-2"><span>0</span><input type="range" min="0" max="10" disabled={readonly} value={draft.painLevel} onChange={(event) => update('painLevel', event.target.value)} className="flex-1 accent-sky-600" /><span>10</span></div><p className="mt-1 text-center font-semibold text-sky-700">{draft.painLevel}/10</p></label>
        </Card>
        <Card title="Vital signs">
          <div className="space-y-3">
            <Field label="BP" value={draft.bloodPressure} disabled={readonly} placeholder="120/80 mmHg" onChange={(value) => update('bloodPressure', value)} />
            <Field label="Pulse" value={draft.pulse} disabled={readonly} placeholder="72 bpm" onChange={(value) => update('pulse', value)} />
            <Field label="Temperature" value={draft.temperature} disabled={readonly} placeholder="98.6 °F" onChange={(value) => update('temperature', value)} />
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Chair time: {String(appointment.appointment_time).slice(0, 5)} · {appointment.duration || 30} min</p>
        </Card>
        <Card title="Medical alerts" action={<button type="button" onClick={onHistory} className="text-xs font-medium text-sky-600">Update history</button>}>
          <div className="space-y-2 text-sm">
            <p className={`flex items-center gap-2 font-medium ${allergies.length ? 'text-rose-600' : 'text-slate-500'}`}><AlertTriangle size={14} /> {allergies.length ? allergies.join(', ') : 'No medication allergies recorded'}</p>
            <p className={`flex items-center gap-2 font-medium ${conditions.length ? 'text-rose-600' : 'text-slate-500'}`}><Heart size={14} /> {conditions.length ? conditions.join(', ') : 'No systemic conditions flagged'}</p>
          </div>
          <p className="mt-3 text-xs text-slate-400">{patient.notes || 'No additional safety notes.'}</p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Clinical notes (SOAP)">
          <p className="mb-2 text-xs text-slate-400">Subjective findings are the complaint and pain on the left. Chart tooth-level conditions on the Dental Chart tab.</p>
          <TextField label="Objective (exam)" value={draft.exam} disabled={readonly} placeholder="Soft tissue, occlusion, caries, existing restorations…" onChange={(value) => update('exam', value)} />
          <TextField label="Assessment / diagnosis" value={draft.findings} disabled={readonly} placeholder="Working diagnosis for this visit…" onChange={(value) => update('findings', value)} />
          <TextField label="Plan" value={draft.treatment} disabled={readonly} placeholder="Treatment completed today and recommended next steps…" onChange={(value) => update('treatment', value)} />
          <TextField label="Additional notes" value={draft.notes} disabled={readonly} placeholder="Patient instructions, consent, follow-up…" onChange={(value) => update('notes', value)} />
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Treatment plans" action={<button type="button" onClick={onPlans} className="text-xs font-medium text-sky-600">Open full plan</button>}>
          {plans.length ? <div className="space-y-3">{plans.slice(0, 4).map((plan) => (
            <div key={plan.id} className="flex items-start gap-2">
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{plan.title}{plan.tooth ? ` · ${plan.tooth}` : ''}</p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{plan.status.replace('_', ' ')}</span>
            </div>
          ))}</div> : <p className="text-xs text-slate-400">No treatment plan items yet. Add them from the Treatment Plan tab.</p>}
        </Card>
        <PrescriptionCard profile={profile} onUpdated={onPrescriptionsAdded} />
        <Card>
          <button type="button" disabled={completed} onClick={onComplete} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"><CheckCircle2 size={13} /> {completed ? 'Visit completed' : 'Mark visit complete'}</button>
        </Card>
      </div>
    </div>
  )
}

function PrescriptionCard({ profile, onUpdated }: { profile: PatientProfile; onUpdated: (profile: PatientProfile) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ medication: '', dosage: '', frequency: '', duration: '', instructions: 'Use as directed.' })
  const add = async () => {
    if (!form.medication.trim()) return
    setSaving(true)
    setNotice('')
    try {
      await DashboardService.createPrescription({ patientId: profile.patient.id, medication: form.medication.trim(), dosage: form.dosage.trim(), frequency: form.frequency.trim(), duration: form.duration.trim(), instructions: form.instructions.trim() })
      onUpdated(await DashboardService.getPatientProfile(profile.patient.id))
      setForm({ medication: '', dosage: '', frequency: '', duration: '', instructions: 'Use as directed.' })
      setOpen(false)
      setNotice('Prescription saved.')
    } catch (reason) {
      setNotice(describeApiError(reason, 'Unable to save prescription'))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Card title="Prescriptions" action={<button type="button" onClick={() => setOpen((value) => !value)} className="text-xs font-medium text-sky-600">{open ? 'Cancel' : '+ Add'}</button>}>
      {notice && <p className={`mb-2 text-xs ${notice.startsWith('Unable') ? 'text-rose-700' : 'text-emerald-700'}`}>{notice}</p>}
      {open && (
        <div className="mb-3 space-y-2">
          <Field label="Medication" value={form.medication} placeholder="e.g. Amoxicillin" onChange={(value) => setForm({ ...form, medication: value })} />
          <Field label="Dosage" value={form.dosage} placeholder="500 mg" onChange={(value) => setForm({ ...form, dosage: value })} />
          <Field label="Frequency" value={form.frequency} placeholder="TID" onChange={(value) => setForm({ ...form, frequency: value })} />
          <Field label="Duration" value={form.duration} placeholder="5 days" onChange={(value) => setForm({ ...form, duration: value })} />
          <button type="button" disabled={saving || !form.medication.trim()} onClick={() => void add()} className="w-full rounded-lg bg-sky-600 py-2 text-xs font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save prescription'}</button>
        </div>
      )}
      {profile.prescriptions.length ? <div className="space-y-3">{profile.prescriptions.slice(0, 4).map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><FileText size={15} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{item.medication}</p>
            <p className="text-[11px] text-slate-400">{item.dosage} · {item.frequency}</p>
          </div>
        </div>
      ))}</div> : <p className="text-xs text-slate-400">No prescriptions recorded.</p>}
    </Card>
  )
}

function ImagingTab({ profile, onRefresh, onDocuments }: { profile: PatientProfile; onRefresh: () => Promise<void>; onDocuments: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setNotice('Files must be 2 MB or smaller.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setUploading(true)
      void DashboardService.createMedicalReport({
        patientId: profile.patient.id,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataBase64: result.includes(',') ? result.slice(result.indexOf(',') + 1) : result,
        description: 'Uploaded from consultation imaging.',
      }).then(async () => {
        setNotice('Image uploaded to the patient record.')
        await onRefresh()
      }).catch((reason) => setNotice(describeApiError(reason, 'Unable to upload imaging.'))).finally(() => setUploading(false))
    }
    reader.readAsDataURL(file)
  }
  return (
    <Card title="Imaging & radiographs" action={<label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-sky-600"><Upload size={14} />{uploading ? 'Uploading…' : 'Upload'}<input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={upload} className="sr-only" /></label>}>
      <p className="mb-3 text-xs text-slate-500">Store bitewings, OPG, and intraoral photos with this visit. Files also appear under the <button type="button" onClick={onDocuments} className="font-medium text-sky-600 hover:underline">Documents</button> tab for this patient.</p>
      {notice && <p className="mb-3 text-xs text-sky-700">{notice}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {profile.reports.map((report) => (
          <button type="button" key={report.id} onClick={() => void DashboardService.downloadMedicalReport(profile.patient.id, report.id, report.file_name)} className="rounded-lg border border-slate-100 p-3 text-left hover:border-sky-200">
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-900 text-slate-400"><FileText size={24} /></div>
            <p className="mt-2 truncate text-xs font-medium">{report.file_name}</p>
            <p className="text-[11px] text-slate-400">{String(report.uploaded_at).slice(0, 10)}</p>
          </button>
        ))}
        {!profile.reports.length && <p className="text-sm text-slate-400">No imaging attached yet.</p>}
      </div>
    </Card>
  )
}

function CompleteTab({ draft, completed, onComplete }: { draft: Draft; completed: boolean; onComplete: () => void }) {
  return (
    <Card title={completed ? 'Consultation completed' : 'Complete consultation'}>
      <p className="text-sm leading-6 text-slate-600">{completed ? 'This visit is complete. Chart updates can still be made from the Dental Chart tab on a later visit.' : 'Review the SOAP summary, then mark the visit complete. The patient will show Completed on the Patients page.'}</p>
      <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        <p><b>Complaint:</b> {draft.reason || 'Not recorded'}{draft.duration ? ` · ${draft.duration}` : ''}</p>
        <p><b>Exam:</b> {draft.exam || 'Not recorded'}</p>
        <p><b>Assessment:</b> {draft.findings || 'Not recorded'}</p>
        <p><b>Plan:</b> {draft.treatment || 'Not recorded'}</p>
        <p><b>Notes:</b> {draft.notes || 'Not recorded'}</p>
        <p><b>Pain:</b> {draft.painLevel}/10 · BP {draft.bloodPressure || 'N/A'} · Pulse {draft.pulse || 'N/A'}</p>
      </div>
      {completed ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Completed</p> : <button type="button" onClick={onComplete} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-3 text-sm font-medium text-white"><CheckCircle2 size={16} /> Mark consultation complete</button>}
    </Card>
  )
}

function Field({ label, value, placeholder, onChange, disabled }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <label className="block text-xs text-slate-500">{label}<input value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputClass} disabled:bg-slate-50`} /></label>
}
function TextField({ label, value, placeholder, onChange, disabled }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <label className="mt-3 block text-xs text-slate-500">{label}<textarea value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputClass} h-24 py-2 disabled:bg-slate-50`} /></label>
}
function SelectField({ label, value, options, onChange, disabled }: { label: string; value: string; options: string[]; onChange: (value: string) => void; disabled?: boolean }) {
  return <label className="mt-3 block text-xs text-slate-500">{label}<span className="relative block"><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`${inputClass} appearance-none pr-8 disabled:bg-slate-50`}><option value="">Select...</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></span></label>
}
function ConfirmModal({ action, saving, onCancel, onConfirm }: { action: Action; saving: boolean; onCancel: () => void; onConfirm: () => void }) {
  const title = action === 'back' ? 'Leave consultation?' : 'Complete consultation?'
  const text = action === 'back' ? 'Unsaved visit notes will be discarded. Tooth chart records already saved stay on the patient file.' : 'The visit will be marked completed. Next you can collect payment for this patient on Billing.'
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Please confirm</p>
            <h2 id="confirm-title" className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close confirmation" className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{text}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600">Cancel</button>
          <button type="button" disabled={saving} onClick={onConfirm} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white">{saving ? 'Saving...' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  )
}

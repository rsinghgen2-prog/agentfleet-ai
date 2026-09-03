import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, ChevronDown, Clock3, Edit3, HeartPulse, Save, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardService, type Appointment, type PatientProfile } from '../services/dashboardService'

type Action = 'back' | 'save' | 'complete'
type ConsultationDraft = { reason: string; duration: string; painLevel: string; bloodPressure: string; pulse: string; temperature: string; findings: string; treatment: string; notes: string }
const blankDraft: ConsultationDraft = { reason: '', duration: '', painLevel: '0', bloodPressure: '', pulse: '', temperature: '', findings: '', treatment: '', notes: '' }
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const inputClass = 'mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/60 bg-white px-3 text-sm text-[#151c23] outline-none focus:ring-2 focus:ring-[#005db6]/20'

export default function PatientConsultation() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [draft, setDraft] = useState(blankDraft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState<Action | null>(null)

  useEffect(() => {
    let active = true
    const today = new Date()
    const from = new Date(today); from.setDate(from.getDate() - 365)
    const to = new Date(today); to.setDate(to.getDate() + 365)
    const load = async () => {
      try {
        const appointments = await DashboardService.getAppointments(dateKey(from), dateKey(to))
        const current = appointments.find((item) => item.id === appointmentId)
        if (!current) throw new Error('Appointment not found')
        const patientProfile = await DashboardService.getPatientProfile(current.patient_id)
        if (!active) return
        setAppointment(current); setProfile(patientProfile)
        setDraft({ ...blankDraft, reason: current.reason || '', notes: current.notes || '' })
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load consultation') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [appointmentId])

  const confirmAction = async () => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    if (action === 'back') { navigate('/dental-client'); return }
    if (!appointment) return
    setSaving(true); setError('')
    try {
      const notes = [`Clinical findings: ${draft.findings || 'Not recorded'}`, `Treatment plan: ${draft.treatment || 'Not recorded'}`, `Vitals: BP ${draft.bloodPressure || 'N/A'} · Pulse ${draft.pulse || 'N/A'} · Temperature ${draft.temperature || 'N/A'}`, `Pain level: ${draft.painLevel}/10`, `Consultation notes: ${draft.notes || 'Not recorded'}`].join('\n')
      await DashboardService.updateAppointment(appointment.id, { status: action === 'complete' ? 'completed' : 'in_progress', reason: draft.reason, diagnosis: draft.findings, notes, treatment_plan: { plan: draft.treatment, painLevel: draft.painLevel, vitals: { bloodPressure: draft.bloodPressure, pulse: draft.pulse, temperature: draft.temperature } } })
      if (action === 'complete') navigate('/dental-client')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save consultation') }
    finally { setSaving(false) }
  }

  const update = (key: keyof ConsultationDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }))
  if (loading) return <div className="min-h-[calc(100vh-4rem)] p-10 text-center text-sm text-[#727783]">Loading consultation...</div>
  if (!appointment || !profile) return <div className="min-h-[calc(100vh-4rem)] p-10 text-center"><p className="text-sm text-red-700">{error || 'Consultation not found.'}</p><button onClick={() => navigate('/dental-client')} className="mt-4 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white">Back to dashboard</button></div>
  const patient = profile.patient
  const initials = `${patient.first_name[0] || ''}${patient.last_name[0] || ''}`
  return <div className="min-h-[calc(100vh-4rem)] px-4 py-5 pb-28 sm:px-6 lg:px-8">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button onClick={() => setPendingAction('back')} className="flex items-center gap-2 text-xs font-bold text-[#005db6] hover:underline"><ArrowLeft size={16} /> Back to dashboard</button><span className="rounded-full bg-[#fff0d8] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8a5a00]">Consultation in progress</span></div>
    {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <header className="dental-stitch-card mb-5 overflow-hidden p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d6e3ff] text-xl font-bold text-[#005db6]">{initials}</div><div><p className="text-xs font-bold uppercase tracking-widest text-[#727783]">Patient consultation</p><h1 className="mt-1 text-2xl font-bold text-[#151c23]">{patient.first_name} {patient.last_name}</h1><p className="mt-1 text-xs text-[#727783]">MRN: #{patient.id.slice(0, 12)} · {patient.gender || 'Patient'} · {appointment.appointment_type}</p></div></div><div className="flex items-center gap-2 rounded-xl bg-[#edf4fe] px-3 py-2 text-xs font-bold text-[#005db6]"><Clock3 size={15} /> {appointment.appointment_time.slice(0, 5)}</div></div><div className="mt-5 grid gap-4 border-t border-[#c2c6d4]/30 pt-5 sm:grid-cols-3"><Info label="Phone" value={patient.phone || 'Not provided'} /><Info label="Email" value={patient.email || 'Not provided'} /><Info label="Visit date" value={appointment.appointment_date.slice(0, 10)} /></div></header>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><main className="space-y-5"><section className="dental-stitch-card p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#005db6]">Today&apos;s visit</p><h2 className="mt-1 text-xl font-bold text-[#151c23]">Reason for visit</h2></div><Edit3 size={19} className="text-[#005db6]" /></div><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Chief complaint" value={draft.reason} options={['Tooth Pain', 'Routine Checkup', 'Cleaning', 'Cavity Review', 'Follow-up', 'Other']} onChange={(value) => update('reason', value)} /><SelectField label="Duration" value={draft.duration} options={['Today', '2 Days', '3 Days', '1 Week', 'More than 1 Week']} onChange={(value) => update('duration', value)} /></div><label className="mt-5 block text-xs font-bold text-[#424752]">Pain level <div className="mt-2 flex items-center gap-3"><span className="text-xs text-[#727783]">0</span><input type="range" min="0" max="10" value={draft.painLevel} onChange={(event) => update('painLevel', event.target.value)} className="w-full accent-[#005db6]" /><span className="text-xs text-[#727783]">10</span><b className="w-8 text-right text-sm text-[#005db6]">{draft.painLevel}</b></div></label></section><section className="dental-stitch-card p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><HeartPulse size={19} className="text-[#005db6]" /><h2 className="text-xl font-bold text-[#151c23]">Vital signs</h2></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Blood pressure" value={draft.bloodPressure} placeholder="120/80 mmHg" onChange={(value) => update('bloodPressure', value)} /><Field label="Pulse" value={draft.pulse} placeholder="72 bpm" onChange={(value) => update('pulse', value)} /><Field label="Temperature" value={draft.temperature} placeholder="98.6 °F" onChange={(value) => update('temperature', value)} /></div></section><section className="dental-stitch-card p-5 sm:p-6"><h2 className="mb-5 text-xl font-bold text-[#151c23]">Clinical notes</h2><TextField label="Findings" value={draft.findings} placeholder="Record examination findings, diagnosis, and tooth observations..." onChange={(value) => update('findings', value)} /><TextField label="Treatment plan" value={draft.treatment} placeholder="Add recommended treatment or next steps..." onChange={(value) => update('treatment', value)} /><TextField label="Consultation notes" value={draft.notes} placeholder="Add any additional notes for this patient..." onChange={(value) => update('notes', value)} /></section></main><aside className="space-y-5"><section className="dental-stitch-card p-5"><h2 className="mb-4 text-lg font-bold text-[#151c23]">Medical alerts</h2><div className="space-y-2"><Alert text="Review allergies and medical history" /><Alert text="Confirm medication changes" /></div></section><section className="dental-stitch-card p-5"><h2 className="mb-4 text-lg font-bold text-[#151c23]">Record summary</h2><div className="space-y-3 text-xs"><Info label="Last visit" value={patient.last_visit || 'Not recorded'} /><Info label="Next appointment" value={patient.next_appointment || 'Not scheduled'} /><Info label="Previous notes" value={patient.notes || 'No previous notes'} /></div></section></aside></div>
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#c2c6d4]/30 bg-white/95 p-3 shadow-lg backdrop-blur-md md:left-20 lg:left-64"><div className="mx-auto flex max-w-7xl justify-end gap-2 sm:gap-3"><button onClick={() => setPendingAction('back')} className="rounded-xl bg-[#e2e9f2] px-4 py-3 text-xs font-bold text-[#424752]">Back</button><button disabled={saving} onClick={() => setPendingAction('save')} className="flex items-center gap-2 rounded-xl bg-[#edf4fe] px-4 py-3 text-xs font-bold text-[#005db6] disabled:opacity-50"><Save size={15} /> Save</button><button disabled={saving} onClick={() => setPendingAction('complete')} className="flex items-center gap-2 rounded-xl bg-[#005db6] px-5 py-3 text-xs font-bold text-white disabled:opacity-50"><Check size={15} /> Complete</button></div></div>
    {pendingAction && <ConfirmModal action={pendingAction} saving={saving} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmAction()} />}
  </div>
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#727783]">{label}</p><p className="mt-1 text-sm font-semibold text-[#151c23]">{value}</p></div> }
function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) { return <label className="block text-xs font-bold text-[#424752]">{label}<input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label> }
function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) { return <label className="mt-4 block text-xs font-bold text-[#424752]">{label}<textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputClass} h-24 py-3`} /></label> }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="block text-xs font-bold text-[#424752]">{label}<span className="relative block"><select value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} appearance-none pr-10`}><option value="">Select...</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#727783]" /></span></label> }
function Alert({ text }: { text: string }) { return <div className="flex items-center gap-2 rounded-xl bg-[#fff0d8] p-3 text-xs font-semibold text-[#8a5a00]"><AlertTriangle size={15} />{text}</div> }
function ConfirmModal({ action, saving, onCancel, onConfirm }: { action: Action; saving: boolean; onCancel: () => void; onConfirm: () => void }) { const labels = { back: 'leave without saving', save: 'save this consultation', complete: 'complete this consultation' }; return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#151c23]/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="consultation-confirm-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#727783]">Please confirm</p><h2 id="consultation-confirm-title" className="mt-1 text-xl font-bold text-[#151c23]">{action === 'back' ? 'Leave consultation?' : action === 'save' ? 'Save consultation?' : 'Complete consultation?'}</h2></div><button aria-label="Close confirmation" onClick={onCancel} className="rounded-full p-2 text-[#727783] hover:bg-[#e2e9f2]"><X size={18} /></button></div><p className="mt-4 text-sm leading-6 text-[#424752]">Are you sure you want to {labels[action]}? {action === 'back' ? 'Any changes made on this page will be discarded.' : action === 'save' ? 'Your notes will be saved and you will remain on this page.' : 'The visit will be marked completed and you will return to the dashboard.'}</p><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} className="rounded-xl bg-[#e2e9f2] px-4 py-3 text-xs font-bold text-[#424752]">Cancel</button><button disabled={saving} onClick={onConfirm} className="rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Confirm'}</button></div></div></div> }

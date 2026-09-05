import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { DashboardService, type Patient, type PatientProfile, type TreatmentPlan, type TreatmentPlanPriority, type TreatmentPlanStatus } from '../../services/dashboardService'
import { describeApiError } from '../../utils/apiError'
import { patientDisplayName } from '../../utils/clinicSchedule'

type AssignMode = 'current' | 'existing' | 'new'
type PlanFilter = 'Active Plan' | 'Completed Plans' | 'All Plans'
const treatments = ['Consultation & Examination', 'Professional Cleaning', 'Root Canal', 'Crown Placement', 'Filling', 'Extraction', 'Whitening', 'Implant', 'Braces / aligners']
const toothAreas = ['Full mouth', 'Upper arch', 'Lower arch', 'Tooth #16', 'Tooth #26', 'Tooth #36', 'Tooth #46']
const dueOptions = ['Today', 'Within 1 week', 'Within 1 month', 'Next visit', 'To be scheduled']
const inputClass = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-200'
const blankDraft = { title: '', tooth: '', priority: 'medium', cost: '', due: '', notes: '' }

const nextStatus = (status: TreatmentPlanStatus): TreatmentPlanStatus => status === 'completed' ? 'recommended' : status === 'in_progress' ? 'completed' : 'in_progress'

export function TreatmentPlanPanel({ profile, plans, onPlansChange }: { profile: PatientProfile; plans?: TreatmentPlan[]; onPlansChange?: (plans: TreatmentPlan[]) => void }) {
  const [items, setItems] = useState<TreatmentPlan[]>(plans || [])
  const [filter, setFilter] = useState<PlanFilter>('Active Plan')
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { if (plans) setItems(plans) }, [plans])
  useEffect(() => {
    if (plans) return
    setError('')
    void DashboardService.getTreatmentPlans(profile.patient.id).then((result) => { setItems(result); onPlansChange?.(result) }).catch((reason) => {
      setItems([])
      setError(describeApiError(reason, 'Unable to load treatment plans from the backend.'))
    })
  }, [profile.patient.id])

  const publish = (next: TreatmentPlan[]) => { setItems(next); onPlansChange?.(next) }
  const visible = items.filter((plan) => filter === 'All Plans' || (filter === 'Completed Plans' ? plan.status === 'completed' : plan.status !== 'completed'))
  const totalCost = items.filter((plan) => plan.status !== 'cancelled' && plan.status !== 'completed').reduce((sum, plan) => sum + Number(plan.estimated_cost || 0), 0)

  const updateStatus = async (plan: TreatmentPlan) => {
    try {
      const updated = await DashboardService.updateTreatmentPlan(plan.id, profile.patient.id, { status: nextStatus(plan.status) })
      publish(items.map((item) => item.id === plan.id ? updated : item))
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to update treatment plan status'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Treatment plan · {patientDisplayName(profile.patient)}</h2>
          <p className="mt-1 text-xs text-slate-500">Recommended care and estimated cost for this patient. Create a new item in the modal; it defaults to the patient in this consultation.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white">New plan</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(['Active Plan', 'Completed Plans', 'All Plans'] as PlanFilter[]).map((tab) => (
          <button type="button" key={tab} onClick={() => setFilter(tab)} className={filter === tab ? 'rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white' : 'rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500'}>{tab}</button>
        ))}
        <span className="ml-auto text-xs text-slate-500">Open estimate: {totalCost ? totalCost.toLocaleString('en-IN') : '—'}</span>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      <section className="dental-stitch-card overflow-x-auto p-4">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-400">
            <tr><th className="px-3 py-3">#</th><th className="px-3 py-3">Treatment</th><th className="px-3 py-3">Tooth/Area</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Priority</th><th className="px-3 py-3">Est. cost</th><th className="px-3 py-3">Timing</th><th className="px-3 py-3">Action</th></tr>
          </thead>
          <tbody>
            {visible.map((plan, index) => (
              <tr key={plan.id} className="border-b border-slate-100">
                <td className="px-3 py-3 text-slate-400">{index + 1}</td>
                <td className="px-3 py-3 font-semibold text-slate-800">{plan.title}</td>
                <td className="px-3 py-3 text-slate-500">{plan.tooth || '-'}</td>
                <td className="px-3 py-3"><span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700">{plan.status.replace('_', ' ')}</span></td>
                <td className="px-3 py-3 text-slate-500">{plan.priority}</td>
                <td className="px-3 py-3 text-slate-600">{plan.estimated_cost ?? '-'}</td>
                <td className="px-3 py-3 text-slate-500">{plan.due_date || plan.notes || '-'}</td>
                <td className="px-3 py-3"><button type="button" onClick={() => void updateStatus(plan)} className="text-xs font-medium text-sky-600">Update status</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <p className="p-4 text-sm text-slate-400">{error ? 'Treatment plans could not be loaded.' : 'No treatment plan items yet. Use New plan to add one.'}</p>}
      </section>
      {modalOpen && (
        <CreatePlanModal
          currentPatient={profile.patient}
          onClose={() => setModalOpen(false)}
          onCreated={(created, assignedTo) => {
            if (assignedTo.id === profile.patient.id) publish([created, ...items])
            setNotice(`Plan “${created.title}” saved for ${patientDisplayName(assignedTo)}. Estimated cost stays on that patient’s chart until collected in Billing.`)
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function CreatePlanModal({ currentPatient, onClose, onCreated }: { currentPatient: Patient; onClose: () => void; onCreated: (plan: TreatmentPlan, assignedTo: Patient) => void }) {
  const [assign, setAssign] = useState<AssignMode>('current')
  const [draft, setDraft] = useState(blankDraft)
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(currentPatient.id)
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void DashboardService.getPatients('', 100, 0).then((result) => setPatients(result.data)).catch(() => setPatients([]))
  }, [])

  const filtered = useMemo(() => {
    const needle = search.toLowerCase()
    return patients.filter((patient) => `${patient.first_name} ${patient.last_name} ${patient.phone || ''} ${patient.email || ''}`.toLowerCase().includes(needle))
  }, [patients, search])

  const submit = async () => {
    if (!draft.title.trim()) { setError('Choose a treatment.'); return }
    setSaving(true)
    setError('')
    try {
      let assigned = currentPatient
      if (assign === 'existing') {
        const found = patients.find((item) => item.id === selectedId)
        if (!found) throw new Error('Select a patient for this plan.')
        assigned = found
      }
      if (assign === 'new') {
        if (!newPatient.firstName.trim() || !newPatient.lastName.trim()) throw new Error('First and last name are required for a new patient.')
        assigned = await DashboardService.createPatient({
          firstName: newPatient.firstName.trim(),
          lastName: newPatient.lastName.trim(),
          phone: newPatient.phone.trim() || null,
          email: newPatient.email.trim() || null,
        })
      }
      const estimatedCost = Number(String(draft.cost).replace(/[^\d.]/g, '')) || null
      const created = await DashboardService.createTreatmentPlan(assigned.id, {
        title: draft.title.trim(),
        tooth: draft.tooth,
        status: 'recommended',
        priority: draft.priority as TreatmentPlanPriority,
        estimatedCost,
        notes: [draft.due ? `Due: ${draft.due}` : '', draft.notes].filter(Boolean).join('\n'),
      })
      onCreated(created, assigned)
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to save treatment plan'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="plan-modal-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New treatment plan</p>
            <h2 id="plan-modal-title" className="mt-1 text-xl font-bold text-slate-900">Assign care and estimate</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <p className="mt-2 text-sm text-slate-500">The plan and estimated cost default to the patient in this consultation. You can assign it to another existing patient or create a new patient first.</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold text-slate-500">Assign to</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {([['current', `This patient · ${patientDisplayName(currentPatient)}`], ['existing', 'Another patient'], ['new', 'New patient']] as Array<[AssignMode, string]>).map(([mode, label]) => (
              <label key={mode} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${assign === mode ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-slate-200 text-slate-600'}`}>
                <input type="radio" name="plan-assign" checked={assign === mode} onChange={() => setAssign(mode)} className="accent-sky-600" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {assign === 'existing' && (
          <div className="mt-4">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patients…" className={inputClass} />
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
              {filtered.length ? filtered.map((patient) => (
                <button type="button" key={patient.id} onClick={() => setSelectedId(patient.id)} className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${selectedId === patient.id ? 'bg-sky-50 text-sky-800' : 'hover:bg-slate-50'}`}>
                  <span>{patientDisplayName(patient)}</span>
                  <span className="text-xs text-slate-400">{patient.phone || patient.email || ''}</span>
                </button>
              )) : <p className="p-3 text-sm text-slate-400">No matching patients.</p>}
            </div>
          </div>
        )}
        {assign === 'new' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-500">First name<input value={newPatient.firstName} onChange={(event) => setNewPatient({ ...newPatient, firstName: event.target.value })} className={inputClass} /></label>
            <label className="text-xs text-slate-500">Last name<input value={newPatient.lastName} onChange={(event) => setNewPatient({ ...newPatient, lastName: event.target.value })} className={inputClass} /></label>
            <label className="text-xs text-slate-500">Phone<input value={newPatient.phone} onChange={(event) => setNewPatient({ ...newPatient, phone: event.target.value })} className={inputClass} /></label>
            <label className="text-xs text-slate-500">Email<input value={newPatient.email} onChange={(event) => setNewPatient({ ...newPatient, email: event.target.value })} className={inputClass} /></label>
          </div>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-500">Treatment<select value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={inputClass}><option value="">Select treatment</option>{treatments.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="text-xs text-slate-500">Tooth / area<select value={draft.tooth} onChange={(event) => setDraft({ ...draft, tooth: event.target.value })} className={inputClass}><option value="">Select area</option>{toothAreas.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="text-xs text-slate-500">Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })} className={inputClass}>{['low', 'medium', 'high', 'urgent'].map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="text-xs text-slate-500">Estimated cost<input value={draft.cost} onChange={(event) => setDraft({ ...draft, cost: event.target.value })} placeholder="e.g. 1200" className={inputClass} /></label>
          <label className="text-xs text-slate-500">Timing<select value={draft.due} onChange={(event) => setDraft({ ...draft, due: event.target.value })} className={inputClass}><option value="">Select timing</option>{dueOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="text-xs text-slate-500">Notes<input value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Payment notes, staging…" className={inputClass} /></label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600">Cancel</button>
          <button type="button" disabled={saving} onClick={() => void submit()} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save plan'}</button>
        </div>
      </div>
    </div>
  )
}

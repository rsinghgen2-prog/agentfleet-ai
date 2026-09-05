import { useEffect, useState } from 'react'
import { DashboardService, type PatientProfile } from '../../services/dashboardService'
import { describeApiError } from '../../utils/apiError'

const conditionOptions = ['Diabetes', 'High Blood Pressure', 'Heart Disease', 'Asthma', 'Kidney Disease', 'Liver Disease', 'Blood Disorder', 'Pregnancy', 'Artificial Joint', 'Pacemaker']
const inputClass = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-200'

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="dental-stitch-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-800">{title}</h2>{action}</div>{children}</section>
}

export function MedicalHistoryPanel({ profile, onUpdated }: { profile: PatientProfile; onUpdated?: (profile: PatientProfile) => void }) {
  const medicalHistory = profile.patient.medical_history || {}
  const dentalHistory = profile.patient.dental_history || {}
  const [conditions, setConditions] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [allergyDraft, setAllergyDraft] = useState('')
  const [lastCleaning, setLastCleaning] = useState('')
  const [procedures, setProcedures] = useState('')
  const [safetyNotes, setSafetyNotes] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [rxOpen, setRxOpen] = useState(false)
  const [rxSaving, setRxSaving] = useState(false)
  const [rxForm, setRxForm] = useState({ medication: '', dosage: '', frequency: '', duration: '', instructions: 'Use as directed.' })

  useEffect(() => {
    const history = profile.patient.medical_history || {}
    const dental = profile.patient.dental_history || {}
    setConditions(Array.isArray(history.conditions) ? history.conditions.map(String) : [])
    setAllergies(profile.patient.allergies || [])
    setLastCleaning(String(dental.lastCleaning || ''))
    setProcedures((Array.isArray(dental.surgeries) ? dental.surgeries.map(String) : []).join(', '))
    setSafetyNotes(profile.patient.notes || '')
  }, [profile])

  const refresh = async () => {
    const next = await DashboardService.getPatientProfile(profile.patient.id)
    onUpdated?.(next)
    return next
  }

  const persistPatient = async (changes: Parameters<typeof DashboardService.updatePatient>[1], success: string) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await DashboardService.updatePatient(profile.patient.id, changes)
      await refresh()
      setNotice(success)
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to save medical history'))
    } finally {
      setSaving(false)
    }
  }

  const toggleCondition = (condition: string) => {
    const next = conditions.includes(condition) ? conditions.filter((item) => item !== condition) : [...conditions, condition]
    setConditions(next)
    void persistPatient({ medicalHistory: { ...medicalHistory, conditions: next } }, 'Medical conditions updated.')
  }

  const addAllergy = () => {
    const value = allergyDraft.trim()
    if (!value || allergies.includes(value)) return
    const next = [...allergies, value]
    setAllergies(next)
    setAllergyDraft('')
    void persistPatient({ allergies: next }, 'Allergy added.')
  }

  const removeAllergy = (allergy: string) => {
    const next = allergies.filter((item) => item !== allergy)
    setAllergies(next)
    void persistPatient({ allergies: next }, 'Allergy removed.')
  }

  const saveDentalAndNotes = () => {
    const surgeries = procedures.split(',').map((item) => item.trim()).filter(Boolean)
    void persistPatient({
      notes: safetyNotes,
      dentalHistory: { ...dentalHistory, lastCleaning, surgeries },
    }, 'Dental history and safety notes saved.')
  }

  const addPrescription = async () => {
    if (!rxForm.medication.trim()) return
    setRxSaving(true)
    setError('')
    try {
      await DashboardService.createPrescription({ patientId: profile.patient.id, medication: rxForm.medication.trim(), dosage: rxForm.dosage.trim(), frequency: rxForm.frequency.trim(), duration: rxForm.duration.trim(), instructions: rxForm.instructions.trim() })
      await refresh()
      setRxForm({ medication: '', dosage: '', frequency: '', duration: '', instructions: 'Use as directed.' })
      setRxOpen(false)
      setNotice('Medication saved.')
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to save medication'))
    } finally {
      setRxSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Review systemic conditions, allergies, and prior dental care before treatment. Changes save to this patient’s record, not only this visit.</p>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr_280px]">
        <Card title="Medical conditions">
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {conditionOptions.map((condition) => (
              <label key={condition} className="flex items-center gap-2">
                <input type="checkbox" checked={conditions.includes(condition)} onChange={() => toggleCondition(condition)} className="accent-sky-600" />
                {condition}
              </label>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Allergies">
            <div className="mb-3 flex gap-2">
              <input value={allergyDraft} onChange={(event) => setAllergyDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addAllergy() }} placeholder="e.g. Penicillin" className={`${inputClass} mt-0`} />
              <button type="button" onClick={addAllergy} className="shrink-0 rounded-lg bg-sky-600 px-3 text-xs font-medium text-white">Add</button>
            </div>
            {allergies.length ? <div className="space-y-2">{allergies.map((allergy) => (
              <div key={allergy} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                <span className="font-semibold text-slate-800">{allergy}</span>
                <button type="button" onClick={() => removeAllergy(allergy)} className="text-xs font-medium text-rose-600">Remove</button>
              </div>
            ))}</div> : <p className="text-sm text-slate-400">No allergies recorded.</p>}
          </Card>
          <Card title="Current medications" action={<button type="button" onClick={() => setRxOpen((value) => !value)} className="text-xs font-medium text-sky-600">{rxOpen ? 'Cancel' : '+ Add'}</button>}>
            {rxOpen && (
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-slate-500">Medication<input value={rxForm.medication} onChange={(event) => setRxForm({ ...rxForm, medication: event.target.value })} className={inputClass} /></label>
                <label className="text-xs text-slate-500">Dosage<input value={rxForm.dosage} onChange={(event) => setRxForm({ ...rxForm, dosage: event.target.value })} placeholder="500 mg" className={inputClass} /></label>
                <label className="text-xs text-slate-500">Frequency<input value={rxForm.frequency} onChange={(event) => setRxForm({ ...rxForm, frequency: event.target.value })} placeholder="TID" className={inputClass} /></label>
                <label className="text-xs text-slate-500">Duration<input value={rxForm.duration} onChange={(event) => setRxForm({ ...rxForm, duration: event.target.value })} placeholder="5 days" className={inputClass} /></label>
                <div className="sm:col-span-2"><button type="button" disabled={rxSaving || !rxForm.medication.trim()} onClick={() => void addPrescription()} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{rxSaving ? 'Saving…' : 'Save medication'}</button></div>
              </div>
            )}
            {profile.prescriptions.length ? <div className="space-y-2">{profile.prescriptions.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <b className="text-slate-800">{item.medication}</b>
                <p className="mt-1 text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration}</p>
              </div>
            ))}</div> : <p className="text-sm text-slate-400">No current medications recorded.</p>}
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Last recorded vitals">
            <p className="text-xs text-slate-400">From the patient file. Today’s chairside vitals are on the Visit tab.</p>
            <div className="mt-3 space-y-2 text-sm">
              <p><span className="text-slate-500">Last visit:</span> <b>{profile.visits[0]?.visit_date ? String(profile.visits[0].visit_date).slice(0, 10) : 'Not recorded'}</b></p>
              <p><span className="text-slate-500">BP:</span> <b>{String(medicalHistory.bloodPressure || 'Not recorded')}</b></p>
              <p><span className="text-slate-500">Pulse:</span> <b>{String(medicalHistory.pulse || 'Not recorded')}</b></p>
              <p><span className="text-slate-500">Temperature:</span> <b>{String(medicalHistory.temperature || 'Not recorded')}</b></p>
            </div>
          </Card>
          <Card title="Dental history">
            <label className="block text-xs text-slate-500">Last cleaning<input value={lastCleaning} onChange={(event) => setLastCleaning(event.target.value)} placeholder="e.g. 2026-03-12" className={inputClass} /></label>
            <label className="mt-3 block text-xs text-slate-500">Previous procedures<textarea value={procedures} onChange={(event) => setProcedures(event.target.value)} placeholder="Extraction, RCT, crown…" className={`${inputClass} h-20 py-2`} /></label>
            <label className="mt-3 block text-xs text-slate-500">Safety notes<textarea value={safetyNotes} onChange={(event) => setSafetyNotes(event.target.value)} placeholder="Premedication, bleeding risk, anxiety…" className={`${inputClass} h-20 py-2`} /></label>
            <button type="button" disabled={saving} onClick={saveDentalAndNotes} className="mt-3 w-full rounded-lg bg-sky-600 py-2 text-xs font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save dental history'}</button>
          </Card>
        </div>
      </div>
      <Card title="Visit history">
        {profile.visits.length ? <div className="space-y-3">{profile.visits.map((visit) => (
          <article key={visit.id} className="border-l-2 border-sky-500 pl-4">
            <p className="text-xs font-semibold text-sky-700">{String(visit.visit_date).slice(0, 10)} · {visit.status}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{visit.visit_type}</p>
            <p className="mt-1 text-sm text-slate-600">{visit.summary}</p>
          </article>
        ))}</div> : <p className="text-sm text-slate-400">No visits recorded.</p>}
      </Card>
    </div>
  )
}

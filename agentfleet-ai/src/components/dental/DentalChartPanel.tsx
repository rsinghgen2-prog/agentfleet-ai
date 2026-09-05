import { useEffect, useState } from 'react'
import { DashboardService, type PatientProfile, type ToothRecord } from '../../services/dashboardService'
import { describeApiError } from '../../utils/apiError'

const fdiTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const conditionOptions = ['Cavity', 'Missing', 'Fractured', 'Infection', 'Filling', 'Root Canal', 'Crown', 'Implant']
const legend = [['Caries', '#ef4444'], ['Filling', '#3b82f6'], ['Crown', '#a855f7'], ['Missing', '#9ca3af'], ['Implant', '#22c55e'], ['RCT', '#eab308']] as const
const toothColor = (conditions: string[]) => {
  const joined = conditions.join(' ').toLowerCase()
  if (/caries|cavity/.test(joined)) return '#ef4444'
  if (/implant/.test(joined)) return '#22c55e'
  if (/fill/.test(joined)) return '#3b82f6'
  if (/crown/.test(joined)) return '#a855f7'
  if (/missing/.test(joined)) return '#9ca3af'
  if (/rct|root/.test(joined)) return '#eab308'
  return ''
}

type ChartTab = 'Odontogram' | 'Perio' | 'Tooth history'

export function DentalChartPanel({ profile, compact = false }: { profile: PatientProfile; compact?: boolean }) {
  const [tab, setTab] = useState<ChartTab>('Odontogram')
  const [tooth, setTooth] = useState(16)
  const [records, setRecords] = useState<ToothRecord[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [painLevel, setPainLevel] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    void DashboardService.getDentalChart(profile.patient.id).then((result) => { setRecords(result); setError('') }).catch((reason) => {
      setRecords([])
      setError(describeApiError(reason, 'Unable to load the dental chart from the backend.'))
    })
  }, [profile.patient.id])

  useEffect(() => {
    const record = records.find((item) => Number(item.tooth_number) === tooth)
    setConditions(Array.isArray(record?.conditions) ? record.conditions.map(String) : [])
    setPainLevel(Number(record?.pain_level || 0))
    setNotes(record?.notes || '')
    setNotice('')
  }, [records, tooth])

  const toggle = (item: string) => setConditions((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])
  const saveTooth = async () => {
    setSaving(true)
    setNotice('')
    try {
      const saved = await DashboardService.saveToothRecord(profile.patient.id, tooth, { conditions, painLevel, notes, status: 'active' })
      setRecords((current) => [...current.filter((item) => Number(item.tooth_number) !== tooth), saved])
      setNotice(`Tooth #${tooth} saved to the patient chart.`)
    } catch (reason) {
      setNotice(describeApiError(reason, 'Unable to save tooth record'))
    } finally {
      setSaving(false)
    }
  }

  const row = (numbers: number[]) => (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
      {numbers.map((number) => {
        const color = toothColor(records.find((item) => Number(item.tooth_number) === number)?.conditions || [])
        return (
          <button type="button" key={number} title={`FDI tooth ${number}`} onClick={() => setTooth(number)} className={`flex flex-col items-center gap-1 rounded-lg p-1 transition hover:bg-[#edf4fe] ${tooth === number ? 'bg-rose-50 ring-1 ring-rose-200' : ''}`}>
            <span className={`flex h-10 w-7 items-center justify-center rounded-[45%] border-2 bg-white text-[9px] ${color ? '' : 'border-slate-200'}`} style={color ? { borderColor: color, backgroundColor: `${color}22` } : undefined}>●</span>
            <small className={tooth === number ? 'font-semibold text-rose-600' : 'text-slate-500'}>{number}</small>
          </button>
        )
      })}
    </div>
  )

  const selected = records.find((item) => Number(item.tooth_number) === tooth)

  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto border-b border-slate-200">
        {(['Odontogram', 'Perio', 'Tooth history'] as ChartTab[]).map((item) => (
          <button type="button" key={item} onClick={() => setTab(item)} className={`shrink-0 border-b-2 pb-3 text-sm font-medium ${tab === item ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{item}</button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {tab === 'Odontogram' && (
        <section className="dental-stitch-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">FDI odontogram</h2>
              <p className="mt-1 text-xs text-slate-500">Select a tooth, mark conditions, and save to this patient’s chart.</p>
            </div>
            <span className="text-xs text-slate-500">{records.length} teeth charted</span>
          </div>
          <div className={`grid gap-6 ${compact ? '' : 'lg:grid-cols-[minmax(0,1fr)_260px]'}`}>
            <div>
              <div className="mb-4 flex flex-wrap gap-3 text-[11px] text-slate-500">{legend.map(([label, color]) => <span key={label} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}</div>
              <p className="mb-2 text-center text-xs font-medium text-slate-400">Upper</p>
              {row(fdiTeeth.slice(0, 16))}
              <p className="mb-2 mt-6 text-center text-xs font-medium text-slate-400">Lower</p>
              {row(fdiTeeth.slice(16))}
            </div>
            <div className="border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5">
              <p className="text-xs font-semibold text-slate-500">Selected tooth</p>
              <p className="mt-1 text-lg font-bold text-slate-900">#{tooth}</p>
              {selected?.status && <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{selected.status}</p>}
              {notice && <p className="mt-2 text-xs text-emerald-700">{notice}</p>}
              <p className="mb-2 mt-4 text-xs font-semibold text-slate-500">Conditions</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">{conditionOptions.map((item) => <label key={item} className="flex items-center gap-2"><input type="checkbox" checked={conditions.includes(item)} onChange={() => toggle(item)} className="accent-sky-600" />{item}</label>)}</div>
              <label className="mt-4 block text-xs text-slate-500">Pain <b className="ml-1 text-rose-600">{painLevel}/10</b><input type="range" min="0" max="10" value={painLevel} onChange={(event) => setPainLevel(Number(event.target.value))} className="mt-2 w-full accent-sky-600" /></label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-4 h-20 w-full rounded-lg border border-slate-200 p-2 text-sm" placeholder="Clinical notes for this tooth" />
              <button type="button" disabled={saving} onClick={() => void saveTooth()} className="mt-3 w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save tooth record'}</button>
            </div>
          </div>
        </section>
      )}
      {tab === 'Perio' && (
        <section className="dental-stitch-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-800">Periodontal snapshot · tooth #{tooth}</h2>
          <p className="mt-1 text-xs text-slate-500">Record pocket depth and bleeding against the selected tooth. Full-arch perio probing can be expanded later.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs text-slate-400"><tr><th className="px-3 py-3">Site</th><th className="px-3 py-3">Pocket</th><th className="px-3 py-3">Bleeding</th><th className="px-3 py-3">Mobility</th></tr></thead>
              <tbody>{['MB', 'B', 'DB', 'ML', 'L', 'DL'].map((site) => (
                <tr key={site} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-semibold">#{tooth} {site}</td>
                  <td className="px-3 py-3"><input aria-label={`Pocket ${site}`} defaultValue="3" className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm" /> mm</td>
                  <td className="px-3 py-3"><input type="checkbox" className="accent-sky-600" /></td>
                  <td className="px-3 py-3"><select aria-label={`Mobility ${site}`} className="h-9 rounded-lg border border-slate-200 px-2 text-sm"><option>None</option><option>I</option><option>II</option><option>III</option></select></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
      {tab === 'Tooth history' && (
        <section className="dental-stitch-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-800">Visit history for context</h2>
          <p className="mt-1 text-xs text-slate-500">Chart notes on tooth #{tooth} sit with the odontogram. Clinic visits below help correlate findings.</p>
          {selected?.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{selected.notes}</p>}
          <div className="mt-4 space-y-3">{profile.visits.length ? profile.visits.map((visit) => (
            <article key={visit.id} className="border-l-2 border-sky-500 pl-4">
              <p className="text-xs font-semibold text-sky-700">{String(visit.visit_date).slice(0, 10)} · {visit.status}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{visit.visit_type}</p>
              <p className="mt-1 text-sm text-slate-600">{visit.summary}</p>
            </article>
          )) : <p className="text-sm text-slate-500">No visits recorded yet.</p>}</div>
        </section>
      )}
    </div>
  )
}

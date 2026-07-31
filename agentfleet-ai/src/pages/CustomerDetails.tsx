import { useEffect, useState } from 'react'
import { ArrowRight, Search, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PatientProfile from './PatientProfile'
import { DashboardService, type Patient } from '../services/dashboardService'

export default function CustomerDetails() {
  const { id } = useParams<{ id?: string }>()
  return id ? <PatientProfile /> : <CustomerDirectory />
}

function CustomerDirectory() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await DashboardService.getPatients(query, 100, 0)
        if (active) setPatients(result.data)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load customers')
      } finally {
        if (active) setLoading(false)
      }
    }
    const timer = window.setTimeout(() => void load(), 200)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query])

  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#727783]">Clinical workspace</p><h1 className="mt-1 text-2xl font-bold text-[#151c23] sm:text-3xl">Customer Details</h1><p className="mt-2 max-w-2xl text-sm text-[#727783]">Open a complete customer record with appointments, consultation notes, prescriptions, reports, lab orders, and traceable communications.</p></div>
    <section className="dental-stitch-card p-5 sm:p-7">
      <div className="relative mb-5"><input aria-label="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers by name, phone, email, or ID…" className="h-12 w-full rounded-xl bg-[#f7f9ff] px-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" /><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727783]" size={18} /></div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-[#727783]">Loading customers…</p> : patients.length === 0 ? <p className="rounded-xl bg-[#f7f9ff] p-5 text-sm text-[#727783]">No customers match this search.</p> : <div className="grid gap-3 md:grid-cols-2">{patients.map((patient) => <button key={patient.id} onClick={() => navigate(`/dental-client/customers/${patient.id}`)} className="flex items-center justify-between gap-4 rounded-2xl border border-[#c2c6d4]/40 bg-[#f7f9ff] p-4 text-left transition hover:border-[#005db6] hover:bg-[#edf4fe]"><span className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d6e3ff] text-[#005db6]"><UserRound size={20} /></span><span className="min-w-0"><b className="block truncate text-sm text-[#151c23]">{patient.first_name} {patient.last_name}</b><small className="block truncate text-xs text-[#727783]">{patient.phone || patient.email || `ID: ${patient.id.slice(0, 12)}`}</small></span></span><ArrowRight size={17} className="shrink-0 text-[#005db6]" /></button>)}</div>}
    </section>
  </div>
}
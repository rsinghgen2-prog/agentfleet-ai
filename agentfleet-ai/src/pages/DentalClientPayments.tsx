import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Download, FileText, Plus, RefreshCw, Search, ShieldCheck, WalletCards, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { DashboardService, type Appointment, type Patient, type PatientProfile, type Payment, type PaymentInput, type PaymentMethod, type PaymentStatus, type PaymentSummary, type TreatmentPlan } from '../services/dashboardService'
import { useDentalDashboardData } from '../hooks/useDentalDashboardData'
import { describeApiError } from '../utils/apiError'
import { ClinicDataStatus } from '../components/dental/ClinicDataStatus'
import { appointmentDateKey, localDateKey, patientDisplayName, patientInitials, sortClinicVisits } from '../utils/clinicSchedule'
import { buildVisitCharges, chargeKindLabel, chargesDescription, chargesTotal, type ChargeKind } from '../utils/visitCharges'

const statuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded']
const methods: PaymentMethod[] = ['cash', 'upi', 'card', 'online', 'bank_transfer', 'cheque']
const methodLabel: Record<PaymentMethod, string> = { cash: 'Cash', upi: 'UPI', card: 'Credit / Debit card', online: 'Online', bank_transfer: 'Bank transfer', cheque: 'Cheque' }
const quickMethods: PaymentMethod[] = ['cash', 'upi', 'card']
const money = (amount: number, currency = 'INR') => `${currency === 'INR' ? '₹' : `${currency} `}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const inputClass = 'mt-1 h-11 w-full rounded-xl border border-[#c7d2e2] bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#3578e5] focus:ring-2 focus:ring-[#3578e5]/15'
const buttonClass = 'rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const statusTone: Record<PaymentStatus, string> = { paid: 'bg-[#dff8eb] text-[#16704d]', pending: 'bg-[#fff5df] text-[#8b5d00]', failed: 'bg-[#ffe2e8] text-[#ac2853]', refunded: 'bg-[#e9f1ff] text-[#2864c7]' }

function useIsClientAdmin(): boolean {
  return useMemo(() => {
    if (localStorage.getItem('userType') !== 'client') return false
    const token = localStorage.getItem('accessToken')
    if (!token) return true
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || '')) as { role?: string; isSuperAdmin?: boolean }
      if (payload.isSuperAdmin) return true
      return ['admin', 'super_admin', 'owner', 'client_admin'].includes(payload.role || '')
    } catch { return true }
  }, [])
}

const emptyDraft = { customerId: '', amount: '', status: 'paid' as PaymentStatus, method: 'cash' as PaymentMethod | '', description: '' }

function recentCompletedVisits(appointments: Appointment[]) {
  const completed = [...sortClinicVisits(appointments.filter((item) => item.status === 'completed'))].reverse()
  const seen = new Set<string>()
  return completed.filter((item) => {
    if (seen.has(item.patient_id)) return false
    seen.add(item.patient_id)
    return true
  })
}

function sumPayments(payments: Payment[], patientId: string, status: PaymentStatus) {
  return payments.filter((item) => item.customer_id === patientId && item.status === status).reduce((total, item) => total + Number(item.amount || 0), 0)
}

export default function DentalClientPayments() {
  const { settings, client } = useDentalDashboardData()
  const isAdmin = useIsClientAdmin()
  const [params, setParams] = useSearchParams()
  const requestedId = params.get('patient') || ''
  const clinicName = settings?.clinic_name || client?.brandName || 'Dental Clinic'
  const [payments, setPayments] = useState<Payment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [visits, setVisits] = useState<Appointment[]>([])
  const [plans, setPlans] = useState<TreatmentPlan[]>([])
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState(requestedId)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const fail = (reason: unknown, fallback: string) => setError(describeApiError(reason, fallback))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const from = new Date(); from.setDate(from.getDate() - 14)
      const to = new Date(); to.setDate(to.getDate() + 7)
      const [paymentList, patientResult, appointmentList] = await Promise.all([
        DashboardService.getPayments({ status: statusFilter === 'all' ? undefined : statusFilter }),
        DashboardService.getPatients('', 200),
        DashboardService.getAppointments(localDateKey(from), localDateKey(to)),
      ])
      setPayments(paymentList)
      setPatients(patientResult.data)
      setVisits(appointmentList)
      if (isAdmin) { try { setSummary(await DashboardService.getPaymentSummary()) } catch { setSummary(null) } }
    } catch (reason) { fail(reason, 'Unable to load payments') } finally { setLoading(false) }
  }, [statusFilter, isAdmin])
  useEffect(() => { void load() }, [load])
  useEffect(() => { if (requestedId) setSelectedId(requestedId) }, [requestedId])

  const dueVisits = useMemo(() => {
    const recent = recentCompletedVisits(visits)
    const today = localDateKey()
    return [...recent.filter((item) => appointmentDateKey(item.appointment_date) === today), ...recent.filter((item) => appointmentDateKey(item.appointment_date) !== today)]
  }, [visits])

  useEffect(() => {
    if (selectedId && (patients.some((item) => item.id === selectedId) || dueVisits.some((item) => item.patient_id === selectedId))) return
    const next = dueVisits[0]?.patient_id || patients[0]?.id || ''
    if (!next) return
    setSelectedId(next)
    setParams((current) => { const nextParams = new URLSearchParams(current); nextParams.set('patient', next); return nextParams }, { replace: true })
  }, [dueVisits, patients, selectedId, setParams])

  useEffect(() => {
    if (!selectedId) { setPlans([]); setProfile(null); return }
    void Promise.all([
      DashboardService.getTreatmentPlans(selectedId).catch(() => [] as TreatmentPlan[]),
      DashboardService.getPatientProfile(selectedId).catch(() => null),
    ]).then(([nextPlans, nextProfile]) => {
      setPlans(nextPlans)
      setProfile(nextProfile)
    })
  }, [selectedId])

  const choose = (id: string) => {
    setSelectedId(id)
    setQuery('')
    setParams((current) => { const nextParams = new URLSearchParams(current); nextParams.set('patient', id); return nextParams }, { replace: true })
  }

  const selectedPatient = patients.find((item) => item.id === selectedId) || profile?.patient
  const selectedVisit = dueVisits.find((item) => item.patient_id === selectedId) || visits.find((item) => item.patient_id === selectedId && item.status === 'completed')
  const selectedName = patientDisplayName(selectedPatient || selectedVisit)
  const charges = useMemo(() => buildVisitCharges({ visit: selectedVisit, plans, prescriptions: profile?.prescriptions, labOrders: profile?.lab_orders }), [selectedVisit, plans, profile])
  const planned = chargesTotal(charges)
  const collected = sumPayments(payments, selectedId, 'paid')
  const pending = sumPayments(payments, selectedId, 'pending')
  const due = Math.max(0, planned - collected)
  const needle = query.trim().toLowerCase()
  const nameOf = (id: string) => { const patient = patients.find((item) => item.id === id); return patient ? patientDisplayName(patient) : id }
  const matchingPatients = needle ? patients.filter((patient) => `${patient.first_name} ${patient.last_name} ${patient.phone || ''} ${patient.email || ''}`.toLowerCase().includes(needle)).slice(0, 8) : []
  const visiblePayments = payments.filter((payment) => {
    if (!needle) return selectedId ? payment.customer_id === selectedId : true
    return `${payment.payment_number} ${nameOf(payment.customer_id)} ${payment.customer_id} ${payment.description}`.toLowerCase().includes(needle)
  })

  const openCollect = (patientId: string, amount?: number, description?: string, method: PaymentMethod = 'cash') => {
    setDraft({ customerId: patientId, amount: amount && amount > 0 ? String(amount) : '', status: 'paid', method, description: description || (selectedVisit ? chargesDescription(selectedVisit.id, charges) : charges.map((line) => line.label).join('\n')) })
    setModal(true)
  }

  const createPayment = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.customerId) { setError('Select a patient'); return }
    if (draft.status === 'paid' && !draft.method) { setError('Choose how this payment was collected (UPI, cash, card, or another method).'); return }
    setBusy(true); setError(null)
    try {
      const input: PaymentInput = { customerId: draft.customerId, amount: Number(draft.amount) || 0, status: draft.status, method: draft.method || null, description: draft.description }
      await DashboardService.createPayment(input)
      setModal(false)
      setDraft(emptyDraft)
      setNotice(`Payment recorded for ${nameOf(draft.customerId)}.`)
      await load()
    } catch (reason) { fail(reason, 'Unable to record payment') } finally { setBusy(false) }
  }
  const changeStatus = async (payment: Payment, status: PaymentStatus) => { setBusy(true); try { await DashboardService.updatePayment(payment.id, { status }); await load() } catch (reason) { fail(reason, 'Unable to update payment') } finally { setBusy(false) } }
  const download = async () => { setBusy(true); try { await DashboardService.downloadPaymentReport(clinicName); setNotice('Payment report downloaded') } catch (reason) { fail(reason, 'Unable to download report') } finally { setBusy(false) } }

  const visitNote = selectedVisit ? `${selectedVisit.appointment_type} · ${appointmentDateKey(selectedVisit.appointment_date)} ${String(selectedVisit.appointment_time).slice(0, 5)}` : 'No completed visit in the last 14 days'

  return <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(135deg,#f4fbfb_0%,#f7f9ff_52%,#fff8f1_100%)] px-4 py-6 pb-24 text-[#172033] sm:px-6 lg:px-8"><div className="mx-auto max-w-[1480px]">
    <header className="mb-6 flex flex-col justify-between gap-4 rounded-[30px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_60px_rgba(30,58,95,0.1)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-7">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#3578e5]"><WalletCards size={16} /> Billing &amp; payments</div>
        <h1 className="text-2xl font-black tracking-tight sm:text-4xl">Collect after consultation</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#637085]">When a visit is marked complete, that patient opens here with treatment plan, medicines, and tests. Doctor, accounts, or any clinic user can collect by UPI, cash, or card.</p>
      </div>
      <button type="button" onClick={() => openCollect(selectedId || '', due || planned, selectedVisit ? chargesDescription(selectedVisit.id, charges) : charges.map((line) => line.label).join('\n'))} className={`${buttonClass} flex items-center justify-center gap-2 bg-[#3578e5] px-5 py-3 text-white shadow-lg`}><Plus size={17} /> Collect payment</button>
    </header>

    {isAdmin && <AdminReport summary={summary} onDownload={download} busy={busy} />}

    <div className="mb-6 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <section className="rounded-[26px] border border-white bg-white/90 p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#8793a5]">Ready to collect</p>
        <p className="mt-1 text-xs text-[#637085]">Completed consultations, newest first.</p>
        <div className="mt-3 max-h-[360px] space-y-1 overflow-y-auto">
          {dueVisits.length ? dueVisits.map((visit) => {
            const active = visit.patient_id === selectedId
            const todayVisit = appointmentDateKey(visit.appointment_date) === localDateKey()
            return (
              <button type="button" key={visit.id} onClick={() => choose(visit.patient_id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${active ? 'bg-[#3578e5] text-white' : 'hover:bg-[#f4f7fd]'}`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${active ? 'bg-white/20' : 'bg-[#e9f1ff] text-[#2864c7]'}`}>{patientInitials({ first_name: visit.first_name, last_name: visit.last_name })}</span>
                <span className="min-w-0">
                  <b className="block truncate text-sm">{patientDisplayName(visit)}</b>
                  <small className={`block truncate text-[11px] ${active ? 'text-white/80' : 'text-[#8793a5]'}`}>{todayVisit ? 'Today' : appointmentDateKey(visit.appointment_date)} · {String(visit.appointment_time).slice(0, 5)}</small>
                </span>
              </button>
            )
          }) : <p className="p-3 text-sm text-[#637085]">No completed visits in the last 14 days.</p>}
        </div>
      </section>

      <section className="rounded-[26px] border border-white bg-white/90 p-5 shadow-sm">
        {selectedId ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#3578e5]">Current patient</p>
                <h2 className="mt-1 text-2xl font-black">{selectedName}</h2>
                <p className="mt-1 text-sm text-[#637085]">{visitNote}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-2xl bg-[#e5f8ef] px-3 py-2 font-bold text-[#168052]">Collected {money(collected)}</span>
                  <span className="rounded-2xl bg-[#fff5df] px-3 py-2 font-bold text-[#ad7400]">Pending {money(pending)}</span>
                  <span className="rounded-2xl bg-[#e9f1ff] px-3 py-2 font-bold text-[#2864c7]">Charges {money(planned)}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-[#f8faff] p-4 lg:min-w-[240px]">
                <p className="text-xs font-bold text-[#637085]">Amount due</p>
                <p className="mt-1 text-3xl font-black text-[#172033]">{money(due)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickMethods.map((method) => (
                    <button type="button" key={method} onClick={() => openCollect(selectedId, due || planned, selectedVisit ? chargesDescription(selectedVisit.id, charges) : charges.map((line) => line.label).join('\n'), method)} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-[#2864c7] shadow-sm">{methodLabel[method]}</button>
                  ))}
                </div>
                <button type="button" onClick={() => openCollect(selectedId, due || planned, selectedVisit ? chargesDescription(selectedVisit.id, charges) : charges.map((line) => line.label).join('\n'))} className={`${buttonClass} mt-4 w-full bg-[#3578e5] text-white`}>Take payment</button>
                <p className="mt-2 text-[11px] leading-4 text-[#8793a5]">Doctor, accounts, and clinic staff can complete this collection.</p>
              </div>
            </div>
            <ChargeSheet lines={charges} />
          </div>
        ) : <p className="text-sm text-[#637085]">Select a completed visit, or search for another patient.</p>}
      </section>
    </div>

    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 w-full rounded-2xl border border-white bg-white px-5 pr-11 text-sm shadow-sm outline-none" placeholder="Search another patient, payment ID, or name…" />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8793a5]" size={18} />
      </div>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PaymentStatus | 'all')} className="h-12 rounded-2xl border border-white bg-white px-4 text-sm font-bold shadow-sm outline-none">
        <option value="all">All statuses</option>
        {statuses.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
      </select>
    </div>
    {matchingPatients.length > 0 && (
      <div className="mb-5 flex flex-wrap gap-2">
        {matchingPatients.map((patient) => (
          <button type="button" key={patient.id} onClick={() => choose(patient.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${patient.id === selectedId ? 'bg-[#3578e5] text-white' : 'bg-white text-[#2864c7] shadow-sm'}`}>
            {patientDisplayName(patient)}
          </button>
        ))}
      </div>
    )}

    <ClinicDataStatus error={error} onRetry={() => void load()} empty={!loading && !error && !payments.length && !dueVisits.length} emptyText="No payments recorded yet." />
    {notice && <div className="mb-5 flex justify-between rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{notice}<button type="button" onClick={() => setNotice(null)}><X size={17} /></button></div>}

    {loading ? <div className="rounded-[26px] bg-white/80 py-20 text-center text-sm text-[#637085]"><RefreshCw className="mx-auto mb-3 animate-spin text-[#3578e5]" />Loading payments…</div>
      : <PaymentTable payments={visiblePayments} nameOf={nameOf} onStatus={changeStatus} busy={busy} emptyText={needle ? 'No payments match that search.' : 'No payments for this patient yet. Collect payment above.'} />}
  </div>
  {modal && <Modal title="Collect payment" close={() => setModal(false)}><form onSubmit={createPayment}><div className="grid gap-4 sm:grid-cols-2">
    <Field label="Patient" required className="sm:col-span-2">
      <select required value={draft.customerId} onChange={(event) => setDraft({ ...draft, customerId: event.target.value })} className={inputClass}>
        <option value="">Select patient</option>
        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patientDisplayName(patient)}</option>)}
      </select>
    </Field>
    <Field label="Amount (₹)" required><input required min="0" step="0.01" type="number" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} className={inputClass} /></Field>
    <Field label="Status"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as PaymentStatus })} className={inputClass}>{statuses.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></Field>
    <Field label="Method" required className="sm:col-span-2">
      <div className="mt-2 mb-2 flex flex-wrap gap-2">
        {quickMethods.map((method) => (
          <button type="button" key={method} onClick={() => setDraft({ ...draft, method })} className={`rounded-full px-3 py-2 text-xs font-black ${draft.method === method ? 'bg-[#3578e5] text-white' : 'bg-[#e9f1ff] text-[#2864c7]'}`}>{methodLabel[method]}</button>
        ))}
      </div>
      <select required={draft.status === 'paid'} value={draft.method} onChange={(event) => setDraft({ ...draft, method: event.target.value as PaymentMethod | '' })} className={inputClass}><option value="">Not selected</option>{methods.map((value) => <option key={value} value={value}>{methodLabel[value]}</option>)}</select>
    </Field>
    <Field label="Description" className="sm:col-span-2"><textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={`${inputClass} h-auto py-3`} placeholder="Visit, treatment plan, medicine, or lab test…" /></Field>
  </div><div className="mt-6 flex justify-end border-t border-[#e2e8f1] pt-5"><button disabled={busy} className={`${buttonClass} bg-[#3578e5] text-white`}>{busy ? 'Saving…' : 'Record payment'}</button></div></form></Modal>}
  </div>
}

function AdminReport({ summary, onDownload, busy }: { summary: PaymentSummary | null; onDownload: () => void; busy: boolean }) {
  const cards: Array<{ label: string; value: string; tone: string }> = summary ? [
    { label: 'Collected', value: money(summary.collected_amount), tone: 'bg-[#e5f8ef] text-[#168052]' },
    { label: 'Pending', value: money(summary.pending_amount), tone: 'bg-[#fff5df] text-[#ad7400]' },
    { label: 'Refunded', value: money(summary.refunded_amount), tone: 'bg-[#e8f1ff] text-[#2864c7]' },
    { label: 'Total payments', value: String(summary.total_payments), tone: 'bg-[#f0ebff] text-[#6848c4]' },
    { label: 'Customers billed', value: String(summary.customers_count), tone: 'bg-[#fff0f2] text-[#c83d68]' },
  ] : []
  return <section className="mb-6 rounded-[26px] border border-[#dbe6f5] bg-white/85 p-5 shadow-sm sm:p-6">
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm font-black"><ShieldCheck size={18} className="text-[#3578e5]" />Admin report &amp; summary<span className="rounded-full bg-[#e9f1ff] px-2.5 py-1 text-[10px] font-black text-[#2864c7]">Client admin only</span></div>
      <div className="flex gap-2"><button type="button" onClick={onDownload} disabled={busy || !summary} className={`${buttonClass} flex items-center gap-2 bg-[#172033] text-white`}><Download size={15} /> Download report</button></div>
    </div>
    {summary ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map((card) => <div key={card.label} className={`rounded-2xl p-4 shadow-sm ${card.tone}`}><div className="flex justify-between text-[10px] font-black uppercase tracking-wider opacity-75">{card.label}<FileText size={16} /></div><p className="mt-3 text-xl font-black sm:text-2xl">{card.value}</p></div>)}</div>
      : <p className="text-sm text-[#637085]">Payment summary could not be loaded. Retry or confirm the backend is running.</p>}
  </section>
}

function ChargeSheet({ lines }: { lines: ReturnType<typeof buildVisitCharges> }) {
  if (!lines.length) return <p className="rounded-2xl bg-[#f8faff] p-4 text-sm text-[#637085]">No visit, treatment plan, medicine, or lab test is attached yet.</p>
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#8793a5]">Visit charges</p>
      <div className="overflow-hidden rounded-2xl border border-[#eef2f8]">
        {lines.map((line) => (
          <div key={`${line.kind}-${line.id}`} className="flex items-start justify-between gap-3 border-b border-[#eef2f8] px-4 py-3 last:border-0">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#8793a5]">{chargeKindLabel[line.kind as ChargeKind]}</p>
              <p className="truncate text-sm font-bold text-[#172033]">{line.label}</p>
              {line.detail && <p className="mt-0.5 text-[11px] text-[#8793a5]">{line.detail}</p>}
            </div>
            <p className="shrink-0 text-sm font-black text-[#172033]">{line.amount ? money(line.amount) : 'At collection'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaymentTable({ payments, nameOf, onStatus, busy, emptyText }: { payments: Payment[]; nameOf: (id: string) => string; onStatus: (payment: Payment, status: PaymentStatus) => void; busy: boolean; emptyText: string }) {
  if (!payments.length) return <div className="rounded-[26px] border border-white bg-white/80 p-8 text-sm text-[#637085]">{emptyText}</div>
  return <div className="overflow-hidden rounded-[26px] border border-white bg-white shadow-sm">
    <div className="hidden grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.9fr_1fr] gap-3 border-b border-[#eef2f8] bg-[#f8faff] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[#8793a5] lg:grid"><span>Payment ID</span><span>Customer / Customer ID</span><span>Amount</span><span>Status</span><span>Date</span><span>Method</span></div>
    <div className="divide-y divide-[#eef2f8]">{payments.map((payment) => <div key={payment.id} className="grid grid-cols-2 gap-3 px-5 py-4 text-sm lg:grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.9fr_1fr] lg:items-center">
      <div><p className="font-black">{payment.payment_number}</p><p className="text-[11px] text-[#8793a5] lg:hidden">{nameOf(payment.customer_id)}</p></div>
      <div><p className="font-bold">{nameOf(payment.customer_id)}</p><p className="font-mono text-[11px] text-[#8793a5]">{payment.customer_id}</p></div>
      <div className="font-black text-[#172033]">{money(payment.amount, payment.currency)}</div>
      <div><select disabled={busy} value={payment.status} onChange={(event) => onStatus(payment, event.target.value as PaymentStatus)} className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone[payment.status]}`}>{statuses.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></div>
      <div className="text-[#637085]">{dateLabel(payment.paid_at || payment.created_at)}</div>
      <div className="text-[#637085]">{payment.method ? methodLabel[payment.method] : '—'}</div>
    </div>)}</div>
  </div>
}

function Field({ label, children, required, className = '' }: { label: string; children: ReactNode; required?: boolean; className?: string }) { return <label className={`block text-[10px] font-black uppercase tracking-wider text-[#637085] ${className}`}>{label}{required && ' *'}{children}</label> }
function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) { return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#172033]/50 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"><div className="mb-5 flex justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[#3578e5]">Billing</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div><button onClick={close} type="button" aria-label="Close modal"><X /></button></div>{children}</div></div> }

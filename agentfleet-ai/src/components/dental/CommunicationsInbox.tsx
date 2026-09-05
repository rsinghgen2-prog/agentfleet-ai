import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { CheckCircle2, Clock3, MessageSquare, Plus, Search, Send, X } from 'lucide-react'
import { DashboardService, type Patient, type SupportChat, type SupportConversationSummary } from '../../services/dashboardService'
import { describeApiError } from '../../utils/apiError'
import { patientDisplayName } from '../../utils/clinicSchedule'

type StatusFilter = 'all' | 'open' | 'closed'
type RangeFilter = 'today' | 'all'

const templates = [
  { id: 'reminder', label: 'Appointment reminder', body: 'This is a reminder of your dental appointment. Please arrive 10 minutes early. Reply if you need to reschedule.' },
  { id: 'confirm', label: 'Confirm visit', body: 'Please confirm if you will attend your upcoming appointment. Reply YES to confirm, or call the clinic to reschedule.' },
  { id: 'followup', label: 'Post-visit follow-up', body: 'Thank you for visiting us today. If you have any discomfort or questions about your treatment or medicines, please reply here.' },
  { id: 'payment', label: 'Payment reminder', body: 'A balance is pending from your recent visit. You can pay at the front desk by UPI, cash, or card. Reply if you have questions.' },
]

const todayKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
const displayTime = (value: string) => new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const initials = (name?: string | null) => (name || 'Inbox').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'IN'
const isClinicSender = (role?: string) => ['client', 'customer', 'admin', 'staff', 'owner', 'client_admin'].includes(role || '')
const threadTitle = (item: SupportConversationSummary, names: Record<string, string>) => {
  if (names[item.id]) return names[item.id]
  const subject = item.subject || ''
  const named = subject.includes(' · ') ? subject.split(' · ')[0].trim() : ''
  return named || subject || 'Clinic thread'
}

export default function CommunicationsInbox() {
  const [conversations, setConversations] = useState<SupportConversationSummary[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [chat, setChat] = useState<SupportChat | null>(null)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [range, setRange] = useState<RangeFilter>('all')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [patientId, setPatientId] = useState('')
  const [opening, setOpening] = useState('')
  const [patientNames, setPatientNames] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const items = await DashboardService.getSupportConversations({
        date: range === 'today' ? todayKey() : undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setConversations(items)
      setError('')
      setSelectedId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id || '')
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to load the clinic inbox.'))
    } finally {
      setLoading(false)
    }
  }, [range, statusFilter])

  useEffect(() => { void DashboardService.getPatients('', 100, 0).then((result) => setPatients(result.data)).catch(() => setPatients([])) }, [])
  useEffect(() => {
    void loadConversations()
    const timer = window.setInterval(() => void loadConversations(true), 20000)
    return () => window.clearInterval(timer)
  }, [loadConversations])
  useEffect(() => {
    if (!selectedId) { setChat(null); return }
    void DashboardService.getSupportConversation(selectedId).then((result) => { setChat(result); setError('') }).catch((reason) => setError(describeApiError(reason, 'Unable to open this conversation.')))
  }, [selectedId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [chat?.messages.length, selectedId])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const ranked = [...conversations].sort((a, b) => {
      const openDelta = Number(b.status === 'open') - Number(a.status === 'open')
      if (openDelta) return openDelta
      return b.updated_at.localeCompare(a.updated_at)
    })
    if (!needle) return ranked
    return ranked.filter((item) => `${threadTitle(item, patientNames)} ${item.subject} ${item.last_message || ''}`.toLowerCase().includes(needle))
  }, [conversations, query, patientNames])
  const openCount = conversations.filter((item) => item.status === 'open').length
  const active = chat?.conversation
  const closed = active?.status === 'closed'
  const selectedSummary = conversations.find((item) => item.id === selectedId)

  const send = async (event?: FormEvent) => {
    event?.preventDefault()
    const body = draft.trim()
    if (!body || !active || sending || closed) return
    setSending(true)
    try {
      const message = await DashboardService.sendSupportMessage(active.id, body)
      setChat((current) => current ? { ...current, messages: [...current.messages, message], conversation: { ...current.conversation!, updated_at: message.created_at } } : current)
      setConversations((current) => current.map((item) => item.id === active.id ? { ...item, last_message: message.body, updated_at: message.created_at } : item))
      setDraft('')
      void loadConversations(true)
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to send this reply.'))
    } finally {
      setSending(false)
    }
  }

  const onComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  const setStatus = async (status: 'open' | 'closed') => {
    if (!active) return
    setUpdating(true)
    try {
      const updated = await DashboardService.updateSupportConversationStatus(active.id, status)
      setChat((current) => current ? { ...current, conversation: { ...current.conversation!, ...updated } } : current)
      void loadConversations(true)
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to update this thread.'))
    } finally {
      setUpdating(false)
    }
  }

  const startConversation = async (event: FormEvent) => {
    event.preventDefault()
    const patient = patients.find((item) => item.id === patientId)
    const name = patient ? patientDisplayName(patient) : ''
    const title = subject.trim() || (name ? `${name} · clinic message` : 'Patient communication')
    try {
      let created = await DashboardService.createSupportConversation(title)
      const conversation = created.conversation
      if (!conversation) throw new Error('Conversation was not created')
      const first = opening.trim()
      if (first) {
        const message = await DashboardService.sendSupportMessage(conversation.id, first)
        created = { conversation: { ...conversation, updated_at: message.created_at }, messages: [message] }
      }
      const summary = {
        ...created.conversation!,
        requester_name: name || conversation.subject,
        last_message: created.messages[created.messages.length - 1]?.body || null,
      }
      if (name) setPatientNames((current) => ({ ...current, [conversation.id]: name }))
      setComposerOpen(false)
      setSubject('')
      setPatientId('')
      setOpening('')
      setConversations((current) => [summary, ...current.filter((item) => item.id !== conversation.id)])
      setSelectedId(conversation.id)
      setChat(created)
      setRange('all')
      setStatusFilter('open')
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to start a conversation.'))
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005db6]">Front desk inbox</p>
          <h1 className="mt-1 text-2xl font-bold text-[#151c23] sm:text-3xl">Communications</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#727783]">Reply to patient threads, send visit reminders, and close conversations after follow-up. Open threads stay at the top of the inbox.</p>
        </div>
        <button type="button" onClick={() => setComposerOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md"><Plus size={16} /> New conversation</button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([
          ['open', `Open (${openCount})`],
          ['all', 'All'],
          ['closed', 'Closed'],
        ] as Array<[StatusFilter, string]>).map(([value, label]) => (
          <button type="button" key={value} onClick={() => setStatusFilter(value)} className={`rounded-full px-4 py-2 text-xs font-bold ${statusFilter === value ? 'bg-[#005db6] text-white' : 'bg-[#dce3ec] text-[#424752]'}`}>{label}</button>
        ))}
        <span className="mx-1 h-4 w-px bg-[#c2c6d4]" />
        {([['today', 'Today'], ['all', 'All dates']] as Array<[RangeFilter, string]>).map(([value, label]) => (
          <button type="button" key={value} onClick={() => setRange(value)} className={`rounded-full px-4 py-2 text-xs font-bold ${range === value ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' : 'bg-white text-[#424752] ring-1 ring-slate-200'}`}>{label}</button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error} <button type="button" onClick={() => void loadConversations()} className="font-bold underline">Retry</button></p>}

      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-[#c2c6d4]/30 bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-[#c2c6d4]/30 lg:border-b-0 lg:border-r">
          <div className="border-b border-[#c2c6d4]/30 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#727783]" size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or subject" className="h-10 w-full rounded-xl border border-[#c2c6d4]/40 bg-[#f7f9ff] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" />
            </div>
          </div>
          <div className="max-h-[520px] flex-1 overflow-y-auto p-2">
            {loading ? <p className="p-4 text-sm text-[#727783]">Loading inbox…</p>
              : visible.length ? visible.map((item) => {
                const activeItem = item.id === selectedId
                const name = threadTitle(item, patientNames)
                return (
                  <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left ${activeItem ? 'bg-[#005db6] text-white' : 'hover:bg-[#edf4fe]'}`}>
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${activeItem ? 'bg-white/20' : 'bg-[#d6e3ff] text-[#005db6]'}`}>{initials(name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <b className="truncate text-sm">{name}</b>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${item.status === 'open' ? (activeItem ? 'bg-white/20' : 'bg-emerald-50 text-emerald-700') : (activeItem ? 'bg-white/15' : 'bg-slate-100 text-slate-500')}`}>{item.status}</span>
                      </span>
                      <span className={`mt-0.5 block truncate text-xs ${activeItem ? 'text-white/80' : 'text-[#424752]'}`}>{item.last_message || item.subject}</span>
                      <span className={`mt-1 flex items-center gap-1 text-[10px] ${activeItem ? 'text-white/65' : 'text-[#9aa5b5]'}`}><Clock3 size={10} />{displayTime(item.updated_at)}</span>
                    </span>
                  </button>
                )
              }) : <p className="p-4 text-sm text-[#727783]">{range === 'today' ? 'No conversations today. Switch to All dates or start a new thread.' : 'No conversations match these filters.'}</p>}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col">
          {active ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c2c6d4]/30 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-bold text-[#151c23]">{selectedSummary ? threadTitle(selectedSummary, patientNames) : active.subject}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${closed ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{active.status}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[#727783]">{active.subject}</p>
                </div>
                <button type="button" disabled={updating} onClick={() => void setStatus(closed ? 'open' : 'closed')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">
                  {updating ? 'Updating…' : closed ? 'Reopen' : 'Mark resolved'}
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#edf4fe]/40 p-4">
                {chat?.messages.length ? chat.messages.map((message) => {
                  const mine = isClinicSender(message.sender_role)
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'rounded-br-md bg-[#005db6] text-white' : 'rounded-bl-md bg-white text-[#151c23] shadow-sm'}`}>
                        <p className={`mb-1 text-[10px] font-semibold ${mine ? 'text-white/80' : 'text-slate-400'}`}>{message.sender_name || (mine ? 'Clinic' : 'Patient')}</p>
                        <p className="whitespace-pre-wrap leading-5">{message.body}</p>
                        <time className="mt-1 block text-[9px] opacity-70">{displayTime(message.created_at)}</time>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[#727783]">
                    <MessageSquare size={22} />
                    No messages yet. Use a template or type the first reply.
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {closed ? (
                <div className="flex items-center justify-between gap-3 border-t border-[#c2c6d4]/30 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" /> This thread is resolved.</span>
                  <button type="button" onClick={() => void setStatus('open')} className="text-xs font-bold text-sky-700">Reopen to reply</button>
                </div>
              ) : (
                <form onSubmit={(event) => void send(event)} className="border-t border-[#c2c6d4]/30 bg-white p-3">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {templates.map((item) => (
                      <button type="button" key={item.id} onClick={() => setDraft(item.body)} className="rounded-full bg-[#edf4fe] px-2.5 py-1 text-[10px] font-bold text-[#005db6] hover:bg-[#d6e3ff]">{item.label}</button>
                    ))}
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onComposerKey} maxLength={5000} rows={2} placeholder="Write a reply…" className="min-h-11 flex-1 resize-none rounded-xl border border-[#c2c6d4]/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" />
                    <button type="submit" disabled={!draft.trim() || sending} className="rounded-xl bg-[#005db6] p-3 text-white disabled:opacity-40" aria-label="Send reply"><Send size={16} /></button>
                  </div>
                  <p className="mt-2 text-[10px] text-[#727783]">Enter to send · Shift+Enter for a new line</p>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4fe] text-[#005db6]"><MessageSquare size={22} /></span>
              <p className="text-sm font-semibold text-[#151c23]">Select a conversation</p>
              <p className="max-w-sm text-sm text-[#727783]">Open a thread from the inbox, or start a new conversation for a patient reminder or follow-up.</p>
            </div>
          )}
        </section>
      </div>

      {composerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={(event) => void startConversation(event)} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inbox</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">New conversation</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => { setComposerOpen(false); setOpening('') }} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <label className="block text-xs font-semibold text-slate-500">Patient
              <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">General clinic thread</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patientDisplayName(patient)}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-semibold text-slate-500">Subject
              <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={patientId ? 'Follow-up, reminder, billing…' : 'Patient communication'} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {templates.map((item) => (
                <button type="button" key={item.id} onClick={() => { setOpening(item.body); if (!subject.trim()) setSubject(item.label) }} className="rounded-full bg-[#edf4fe] px-2.5 py-1 text-[10px] font-bold text-[#005db6] hover:bg-[#d6e3ff]">{item.label}</button>
              ))}
            </div>
            <label className="mt-3 block text-xs font-semibold text-slate-500">First message
              <textarea value={opening} onChange={(event) => setOpening(event.target.value)} rows={3} maxLength={5000} placeholder="Optional. Send a reminder or follow-up when the thread starts." className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setComposerOpen(false); setOpening('') }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600">Cancel</button>
              <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white">Start thread</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { MessageSquare, Plus, Send } from 'lucide-react'
import { DashboardService, type SupportChat, type SupportConversationSummary } from '../../services/dashboardService'

const todayKey = () => new Date().toISOString().slice(0, 10)
const displayDate = (value: string) => new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function CommunicationsInbox() {
  const [conversations, setConversations] = useState<SupportConversationSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [chat, setChat] = useState<SupportChat | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadConversations = async () => {
    try { setConversations(await DashboardService.getSupportConversations({ date: todayKey() })); setError('') }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load today's communications") }
    finally { setLoading(false) }
  }
  useEffect(() => { void loadConversations(); const timer = window.setInterval(() => void loadConversations(), 15000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (selectedId) void DashboardService.getSupportConversation(selectedId).then(setChat).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load conversation')) }, [selectedId])

  const todayConversations = useMemo(() => conversations.filter((item) => item.updated_at.slice(0, 10) === todayKey()), [conversations])
  const active = chat?.conversation
  const send = async (event: FormEvent) => {
    event.preventDefault(); const body = draft.trim(); if (!body || !active || sending) return
    setSending(true)
    try { const message = await DashboardService.sendSupportMessage(active.id, body); setChat((current) => current ? { ...current, messages: [...current.messages, message], conversation: { ...current.conversation!, updated_at: message.created_at } } : current); setDraft(''); void loadConversations() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send message') }
    finally { setSending(false) }
  }
  const newConversation = async () => { try { const created = await DashboardService.createSupportConversation('Patient communication'); setConversations((current) => [created.conversation!, ...current]); setSelectedId(created.conversation!.id); setChat(created) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create conversation') } }

  return <section className="dental-stitch-card p-5 sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-[#151c23]">Today's Communications</h2><button onClick={() => void newConversation()} className="flex items-center gap-1 text-xs font-bold text-[#005db6]"><Plus size={15} /> New message</button></div>
    {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <div className="grid min-h-[430px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"><div className="rounded-xl bg-[#f7f9ff] p-2"><div className="mb-2 flex items-center justify-between px-2"><p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">Today</p><span className="text-[10px] text-[#727783]">{todayConversations.length} threads</span></div>{loading ? <p className="p-3 text-xs text-[#727783]">Loading communications...</p> : todayConversations.length ? <div className="space-y-1">{todayConversations.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl p-3 text-left ${item.id === selectedId ? 'bg-[#005db6] text-white' : 'hover:bg-white'}`}><p className="truncate text-sm font-semibold">{item.requester_name || 'Patient communication'}</p><p className={`mt-1 truncate text-xs ${item.id === selectedId ? 'text-white/75' : 'text-[#727783]'}`}>{item.subject}</p><p className={`mt-1 text-[10px] ${item.id === selectedId ? 'text-white/70' : 'text-[#9aa5b5]'}`}>{displayDate(item.updated_at)}</p></button>)}</div> : <p className="p-3 text-xs text-[#727783]">No patient communications today.</p>}</div><div className="flex min-h-[430px] flex-col rounded-xl border border-[#c2c6d4]/30 bg-white">{active ? <><div className="border-b border-[#c2c6d4]/30 px-4 py-3"><p className="text-sm font-bold text-[#151c23]">{active.subject}</p><p className="mt-1 text-xs text-[#727783]">{active.subject}</p></div><div className="flex-1 space-y-3 overflow-y-auto bg-[#edf4fe]/40 p-4">{chat?.messages.length ? chat.messages.map((message) => <div key={message.id} className={`flex ${message.sender_role === 'client' || message.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.sender_role === 'client' || message.sender_role === 'customer' ? 'bg-[#005db6] text-white' : 'bg-white text-[#151c23] shadow-sm'}`}><p className="whitespace-pre-wrap">{message.body}</p><time className="mt-1 block text-[9px] opacity-70">{displayDate(message.created_at)}</time></div></div>) : <div className="flex h-full items-center justify-center text-xs text-[#727783]"><MessageSquare size={16} className="mr-2" /> No messages in this thread.</div>}</div><form onSubmit={send} className="flex gap-2 border-t border-[#c2c6d4]/30 p-3"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} placeholder="Reply to selected patient..." className="min-h-10 flex-1 resize-none rounded-xl border border-[#c2c6d4]/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" /><button disabled={!draft.trim() || sending} className="rounded-xl bg-[#005db6] p-3 text-white disabled:opacity-40" aria-label="Send reply"><Send size={16} /></button></form></> : <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-[#727783]">Select a patient communication to open the live chat.</div>}</div></div>
  </section>
}

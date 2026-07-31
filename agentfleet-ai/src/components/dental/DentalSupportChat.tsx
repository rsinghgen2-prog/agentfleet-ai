import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, Send, ShieldCheck, X } from 'lucide-react'
import { DashboardService, type SupportChat, type SupportMessage } from '../../services/dashboardService'

export default function DentalSupportChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [chat, setChat] = useState<SupportChat | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadChat = useCallback(async () => {
    setLoading(true)
    try { setChat(await DashboardService.getSupportChat()); setError(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load support chat') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    void loadChat()
    const timer = window.setInterval(() => { void loadChat() }, 15000)
    return () => window.clearInterval(timer)
  }, [loadChat, open])

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      let current = chat
      if (!current?.conversation) current = await DashboardService.createSupportConversation()
      const message = await DashboardService.sendSupportMessage(current.conversation!.id, body)
      setChat({ ...current, messages: [...current.messages, message], conversation: { ...current.conversation!, updated_at: message.created_at } })
      setDraft('')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send support message') }
    finally { setSending(false) }
  }

  if (!open) return null
  const messages: SupportMessage[] = chat?.messages || []
  return <aside className="fixed bottom-4 right-4 z-[80] flex h-[min(680px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-[#c2c6d4]/40" aria-label="Hospital support chat">
    <header className="flex items-center justify-between bg-[#005db6] px-5 py-4 text-white"><div><h2 className="text-base font-bold">Hospital support</h2><p className="mt-1 text-[10px] text-white/80">Live help for your dental workspace</p></div><button onClick={onClose} className="rounded-full p-2 hover:bg-white/15" aria-label="Close support chat"><X size={19} /></button></header>
    <div className="flex items-start gap-2 border-b border-[#c2c6d4]/30 bg-[#f7f9ff] px-5 py-3 text-[10px] leading-4 text-[#424752]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#005db6]" /><span>Secure, tenant-scoped history is retained so support can trace and follow up on your request.</span></div>
    <div className="flex-1 space-y-3 overflow-y-auto bg-[#edf4fe]/45 p-4">{loading && !chat ? <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#727783]"><LoaderCircle className="animate-spin" size={16} /> Loading conversation…</div> : !messages.length ? <div className="rounded-2xl bg-white p-5 text-center text-xs leading-5 text-[#727783]">Start a conversation with hospital support. Your messages and replies will remain available here for future reference.</div> : messages.map((message) => <div key={message.id} className={`flex ${message.sender_role === 'client' || message.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.sender_role === 'client' || message.sender_role === 'customer' ? 'rounded-br-md bg-[#005db6] text-white' : 'rounded-bl-md bg-white text-[#151c23] shadow-sm'}`}><p className="whitespace-pre-wrap">{message.body}</p><time className="mt-1 block text-[9px] opacity-70">{new Date(message.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></div></div>)}</div>
    {error && <p className="bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}
    <div className="border-t border-[#c2c6d4]/30 bg-white p-3"><div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} maxLength={5000} rows={2} placeholder="Write to hospital support…" className="min-h-11 flex-1 resize-none rounded-xl border border-[#c2c6d4]/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" /><button onClick={() => void send()} disabled={!draft.trim() || sending} className="rounded-xl bg-[#005db6] p-3 text-white disabled:opacity-40" aria-label="Send support message"><Send size={17} /></button></div><p className="mt-2 text-[9px] text-[#727783]">Press Enter to send · Shift+Enter for a new line</p></div>
  </aside>
}
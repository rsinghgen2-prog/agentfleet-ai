import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, Mail, MessageCircle, PhoneCall } from 'lucide-react'
import { DashboardService, type NotificationAlert } from '../../services/dashboardService'

const formatAlertDate = (value: string) => new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function DentalNotificationCenter() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])
  const loadAlerts = useCallback(() => { void DashboardService.getClientAlerts().then(setAlerts).catch(() => undefined) }, [])

  useEffect(() => {
    loadAlerts()
    const timer = window.setInterval(loadAlerts, 30000)
    return () => window.clearInterval(timer)
  }, [loadAlerts])

  const markRead = async (alert: NotificationAlert) => {
    if (alert.is_read) return
    try {
      await DashboardService.markClientAlertRead(alert.id)
      setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, is_read: true } : item))
    } catch { /* Keep the alert unread when the server update fails. */ }
  }

  const unreadCount = alerts.filter((alert) => !alert.is_read).length
  return <div className="relative"><button aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onClick={() => setOpen((value) => !value)} className="relative rounded-full bg-white p-2.5 text-[#424752] shadow-sm hover:bg-[#e2e9f2]"><Bell size={18} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e77c6c] px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{open && <div className="absolute right-0 top-12 z-[60] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#cde9e4] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#e5edf1] px-4 py-3"><div><b className="text-sm text-[#12394b]">Customer alerts</b><p className="text-[10px] text-[#6b8087]">Messages, emails and calls</p></div>{unreadCount > 0 && <span className="rounded-full bg-[#e0f4ef] px-2 py-1 text-[10px] font-bold text-[#007f86]">{unreadCount} new</span>}</div><div className="max-h-80 space-y-1 overflow-y-auto p-2">{alerts.length ? alerts.map((alert) => <button type="button" key={alert.id} onClick={() => void markRead(alert)} className={`flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-[#f3faf8] ${!alert.is_read ? 'bg-[#f0faf7]' : ''}`}><span className="mt-0.5 text-[#007f86]">{alert.kind === 'message' ? <MessageCircle size={16} /> : alert.kind === 'email' ? <Mail size={16} /> : <PhoneCall size={16} />}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs text-[#12394b]">{alert.title}</b><span className="mt-1 block text-xs leading-4 text-[#6b8087]">{alert.body}</span><time className="mt-1 block text-[10px] text-[#91a2a8]">{formatAlertDate(alert.created_at)}</time></span>{alert.is_read && <CheckCheck size={14} className="mt-1 shrink-0 text-[#8ba0a7]" />}</button>) : <p className="p-6 text-center text-xs text-[#6b8087]">No customer alerts yet.</p>}</div></div>}</div>
}
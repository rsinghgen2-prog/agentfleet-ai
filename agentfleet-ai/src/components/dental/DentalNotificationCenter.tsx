import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Mail, MessageCircle, PhoneCall } from 'lucide-react'
import { DashboardService, type NotificationAlert } from '../../services/dashboardService'
import { useDentalDashboardData } from '../../hooks/useDentalDashboardData'

const formatAlertDate = (value: string) => new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function DentalNotificationCenter() {
  const { settings } = useDentalDashboardData()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])
  const loadAlerts = useCallback(() => { void DashboardService.getClientAlerts().then(setAlerts).catch(() => undefined) }, [])
  const prefs = settings?.notifications || {}

  useEffect(() => {
    loadAlerts()
    const timer = window.setInterval(loadAlerts, 30000)
    return () => window.clearInterval(timer)
  }, [loadAlerts])

  const visible = useMemo(() => alerts.filter((alert) => {
    if (alert.kind === 'message') return prefs.messageAlerts !== false
    if (alert.kind === 'email') return prefs.emailAlerts !== false
    if (alert.kind === 'call') return prefs.callAlerts !== false
    return prefs.smsReminders !== false
  }), [alerts, prefs])

  const markRead = async (alert: NotificationAlert) => {
    if (alert.is_read) return
    try {
      await DashboardService.markClientAlertRead(alert.id)
      setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, is_read: true } : item))
    } catch { /* Keep the alert unread when the server update fails. */ }
  }

  const unreadCount = visible.filter((alert) => !alert.is_read).length
  return (
    <div className="relative">
      <button aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onClick={() => setOpen((value) => !value)} className="relative rounded-full bg-white p-2.5 text-[#424752] shadow-sm hover:bg-[#e2e9f2]">
        <Bell size={18} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e77c6c] px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-[60] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#c2c6d4]/40 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#c2c6d4]/30 px-4 py-3">
            <div>
              <b className="text-sm text-[#151c23]">Clinic alerts</b>
              <p className="text-[10px] text-[#727783]">Inbox, reminders, and callbacks</p>
            </div>
            {unreadCount > 0 && <span className="rounded-full bg-[#edf4fe] px-2 py-1 text-[10px] font-bold text-[#005db6]">{unreadCount} new</span>}
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto p-2">
            {visible.length ? visible.map((alert) => (
              <button type="button" key={alert.id} onClick={() => void markRead(alert)} className={`flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-[#edf4fe] ${!alert.is_read ? 'bg-[#f7f9ff]' : ''}`}>
                <span className="mt-0.5 text-[#005db6]">{alert.kind === 'message' ? <MessageCircle size={16} /> : alert.kind === 'email' ? <Mail size={16} /> : <PhoneCall size={16} />}</span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-xs text-[#151c23]">{alert.title}</b>
                  <span className="mt-1 block text-xs leading-4 text-[#727783]">{alert.body}</span>
                  <time className="mt-1 block text-[10px] text-[#9aa5b5]">{formatAlertDate(alert.created_at)}</time>
                </span>
                {alert.is_read && <CheckCheck size={14} className="mt-1 shrink-0 text-[#9aa5b5]" />}
              </button>
            )) : <p className="p-6 text-center text-xs text-[#727783]">No clinic alerts yet.</p>}
          </div>
          <div className="flex justify-between border-t border-[#c2c6d4]/30 px-4 py-2 text-[10px] font-bold">
            <Link to="/dental-client/communications" onClick={() => setOpen(false)} className="text-[#005db6]">Communications</Link>
            <Link to="/dental-client/settings" onClick={() => setOpen(false)} className="text-[#727783]">Alert settings</Link>
          </div>
        </div>
      )}
    </div>
  )
}

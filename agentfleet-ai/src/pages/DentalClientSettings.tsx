import { useEffect, useState, type ReactNode } from 'react'
import { Bell, CalendarDays, Check, ChevronDown, LockKeyhole, Mail, Moon, Save, Search, ShieldCheck, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useDentalDashboardData } from '../hooks/useDentalDashboardData'
import { DashboardService } from '../services/dashboardService'

export default function DentalClientSettings() {
  const { theme, toggleTheme } = useTheme()
  const { client, settings, refresh } = useDentalDashboardData()
  const [clinicName, setClinicName] = useState('V.P.S. Dental & Oral Care')
  const [clinicEmail, setClinicEmail] = useState('')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsReminders, setSmsReminders] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setClinicName(settings?.clinic_name || client?.brandName || 'V.P.S. Dental & Oral Care')
    setClinicEmail(settings?.clinic_email || '')
    setEmailAlerts(settings?.notifications?.emailAlerts ?? true)
    setSmsReminders(settings?.notifications?.smsReminders ?? true)
  }, [client, settings])

  const saveProfile = async () => {
    setSaving(true); setSaved(false); setError(null)
    try {
      await DashboardService.updateSettings({ clinicName, clinicEmail, notifications: { emailAlerts, smsReminders } })
      setSaved(true)
      await refresh()
      window.setTimeout(() => setSaved(false), 1800)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save clinic settings') } finally { setSaving(false) }
  }

  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <div className="mb-7 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-[#005db6] sm:text-3xl">Settings</h1><p className="mt-1 text-sm text-[#424752]">Manage tenant branding, clinic profile, and workspace preferences.</p></div><div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-[#727783] shadow-sm sm:flex"><Search size={16} /> Search clinic data...</div></div>
    {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <section className="dental-stitch-card mb-5 flex flex-col gap-6 p-5 md:flex-row md:items-center md:p-7"><div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[#edf4fe] text-5xl shadow-inner">{settings?.branding?.logo || client?.logo || '🦷'}</div><div className="flex-1"><h2 className="text-xl font-semibold text-[#005db6]">{client?.clientName || 'Clinic administrator'}</h2><p className="text-sm text-[#424752]">Tenant-controlled clinic workspace</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[#727783]">Clinic Name<input value={clinicName} onChange={(event) => setClinicName(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#c2c6d4]/40 bg-[#edf4fe] px-3 text-sm font-normal text-[#151c23] outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label><label className="text-xs font-bold text-[#727783]">Clinic Email<input value={clinicEmail} onChange={(event) => setClinicEmail(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#c2c6d4]/40 bg-[#edf4fe] px-3 text-sm font-normal text-[#151c23] outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label></div></div><button disabled={saving} onClick={saveProfile} className="flex items-center justify-center gap-2 rounded-full bg-[#5897f4] px-5 py-2.5 text-xs font-bold text-[#002e60] disabled:opacity-60">{saved ? <Check size={16} /> : <Save size={16} />}{saving ? 'Saving…' : saved ? 'Saved' : 'Update Profile'}</button></section>
    <div className="grid gap-5 lg:grid-cols-3"><section className="dental-stitch-card p-5 lg:col-span-2"><h2 className="mb-5 flex items-center gap-3 border-b border-[#c2c6d4]/20 pb-4 text-xl font-semibold"><CalendarDays className="text-[#005db6]" size={21} /> Appointment Settings</h2><div className="grid gap-5 md:grid-cols-2"><div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#424752]">Clinic working hours</p><div className="space-y-3"><div className="flex items-center justify-between rounded-xl border border-[#c2c6d4]/30 bg-[#f7f9ff] p-3 text-sm"><span>Mon - Fri</span><b className="text-[#005db6]">09:00 AM - 06:00 PM</b></div><div className="flex items-center justify-between rounded-xl border border-[#c2c6d4]/30 bg-[#f7f9ff] p-3 text-sm"><span>Saturday</span><b className="text-[#005db6]">10:00 AM - 02:00 PM</b></div></div></div><div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#424752]">Session configuration</p><div className="space-y-3"><button className="flex w-full items-center justify-between rounded-xl border border-[#c2c6d4]/30 bg-[#f7f9ff] p-3 text-sm"><span>Default duration</span><b className="text-[#005db6]">45 mins <ChevronDown size={15} className="ml-2 inline" /></b></button><button className="flex w-full items-center justify-between rounded-xl border border-[#c2c6d4]/30 bg-[#f7f9ff] p-3 text-sm"><span>Buffer time</span><b className="text-[#005db6]">10 mins <ChevronDown size={15} className="ml-2 inline" /></b></button></div></div></div><div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#ffdad6]/60 p-4 text-[#761538]"><ShieldCheck size={27} /><div><b className="block text-sm">Emergency slot management</b><span className="text-xs">Auto-reserve 2 slots daily for urgent care</span></div><span className="ml-auto h-6 w-11 rounded-full bg-[#005db6] p-1"><span className="ml-5 block h-4 w-4 rounded-full bg-white" /></span></div></section><section className="dental-stitch-card p-5"><h2 className="mb-5 flex items-center gap-3 border-b border-[#c2c6d4]/20 pb-4 text-xl font-semibold"><Bell className="text-[#005db6]" size={21} /> Notifications</h2><ToggleRow label="Email Alerts" description="Appointment confirmations" checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} /><ToggleRow label="SMS Reminders" description="Sent 24h before visits" checked={smsReminders} onChange={() => setSmsReminders(!smsReminders)} /><ToggleRow label="Theme" description={theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'} checked={theme === 'dark'} onChange={toggleTheme} icon={theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />} /></section></div>
    <section className="dental-stitch-card mt-5 p-5"><h2 className="mb-5 flex items-center gap-3 border-b border-[#c2c6d4]/20 pb-4 text-xl font-semibold"><LockKeyhole className="text-[#005db6]" size={21} /> Security &amp; Privacy</h2><div className="grid gap-5 md:grid-cols-2"><div className="space-y-3"><input type="password" placeholder="Current Password" className="h-11 w-full rounded-xl border border-[#c2c6d4]/30 px-4 text-sm outline-none" /><input type="password" placeholder="New Password" className="h-11 w-full rounded-xl border border-[#c2c6d4]/30 px-4 text-sm outline-none" /><button className="w-full rounded-xl bg-[#005db6] py-3 text-xs font-bold text-white">Update Password</button></div><div className="rounded-2xl bg-[#edf4fe] p-5"><div className="flex items-center gap-3"><Mail className="text-[#005db6]" /><div><b className="block text-sm">Two-Factor Authentication (2FA)</b><p className="mt-1 text-xs leading-5 text-[#424752]">Secure your account with an extra layer of protection.</p><button className="mt-3 text-xs font-bold text-[#005db6]">Enable Protection →</button></div></div></div></div></section>
  </div>
}

function ToggleRow({ label, description, checked, onChange, icon }: { label: string; description: string; checked: boolean; onChange: () => void; icon?: ReactNode }) { return <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3">{icon || <Bell size={18} className="text-[#005db6]" />}<div><b className="block text-sm">{label}</b><span className="text-xs text-[#727783]">{description}</span></div></div><button aria-label={`Toggle ${label}`} onClick={onChange} className={`h-6 w-11 rounded-full p-1 transition ${checked ? 'bg-[#005db6]' : 'bg-[#dce3ec]'}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? 'ml-5' : ''}`} /></button></div> }
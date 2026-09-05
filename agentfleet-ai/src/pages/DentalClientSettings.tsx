import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Building2, CalendarDays, Check, CheckCheck, Clock3, LockKeyhole, Mail, MapPin, MessageCircle, Moon, PhoneCall, Save, Search, ShieldCheck, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useDentalDashboardData } from '../hooks/useDentalDashboardData'
import { DashboardService, type HospitalDirectory, type NotificationAlert } from '../services/dashboardService'
import { describeApiError } from '../utils/apiError'
import { WEEKDAY_KEYS, appointmentBuffer, appointmentDuration, parseDayHours, serializeDayHours, type DayHours } from '../utils/clinicSchedule'

const weekdayLabels: Record<(typeof WEEKDAY_KEYS)[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}
const editorDays: Array<(typeof WEEKDAY_KEYS)[number]> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const defaultHours = (): Record<(typeof WEEKDAY_KEYS)[number], DayHours> => ({
  monday: { open: true, start: '09:00', end: '18:00' },
  tuesday: { open: true, start: '09:00', end: '18:00' },
  wednesday: { open: true, start: '09:00', end: '18:00' },
  thursday: { open: true, start: '09:00', end: '18:00' },
  friday: { open: true, start: '09:00', end: '18:00' },
  saturday: { open: true, start: '10:00', end: '14:00' },
  sunday: { open: false, start: '09:00', end: '18:00' },
})

const inputClass = 'mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/50 bg-white px-3 text-sm text-[#151c23] outline-none focus:ring-2 focus:ring-[#005db6]/20'
const formatAlertDate = (value: string) => new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function DentalClientSettings() {
  const { theme, toggleTheme } = useTheme()
  const { client, settings, refresh } = useDentalDashboardData()
  const [clinicName, setClinicName] = useState('')
  const [clinicEmail, setClinicEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [hours, setHours] = useState(defaultHours)
  const [duration, setDuration] = useState(30)
  const [bufferMinutes, setBufferMinutes] = useState(0)
  const [emergencySlots, setEmergencySlots] = useState(2)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsReminders, setSmsReminders] = useState(true)
  const [messageAlerts, setMessageAlerts] = useState(true)
  const [callAlerts, setCallAlerts] = useState(true)
  const [hospitals, setHospitals] = useState<HospitalDirectory[]>([])
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setClinicName(settings?.clinic_name || client?.brandName || '')
    setClinicEmail(settings?.clinic_email || '')
    setPhone(settings?.phone || '')
    setLine1(String(settings?.address?.line1 || settings?.address?.address || ''))
    setCity(String(settings?.address?.city || ''))
    setState(String(settings?.address?.state || ''))
    setPostalCode(String(settings?.address?.postalCode || settings?.address?.postal_code || ''))
    setTimezone(settings?.timezone || 'Asia/Kolkata')
    const next = defaultHours()
    if (settings?.working_hours && Object.keys(settings.working_hours).length) {
      for (const day of WEEKDAY_KEYS) {
        if (Object.prototype.hasOwnProperty.call(settings.working_hours, day)) next[day] = parseDayHours(settings.working_hours[day])
      }
    }
    setHours(next)
    setDuration(appointmentDuration(settings))
    setBufferMinutes(appointmentBuffer(settings))
    setEmergencySlots(Number(settings?.appointment_settings?.emergencySlots) || 2)
    setEmailAlerts(settings?.notifications?.emailAlerts ?? true)
    setSmsReminders(settings?.notifications?.smsReminders ?? true)
    setMessageAlerts(settings?.notifications?.messageAlerts ?? true)
    setCallAlerts(settings?.notifications?.callAlerts ?? true)
  }, [client, settings])

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      DashboardService.getHospitalDirectory(hospitalSearch).then((result) => { if (active) setHospitals(result) }).catch((reason) => { if (active) setError(describeApiError(reason, 'Unable to load referral facilities.')) })
    }, 300)
    return () => { active = false; window.clearTimeout(timer) }
  }, [hospitalSearch])

  useEffect(() => {
    let active = true
    const loadAlerts = () => DashboardService.getClientAlerts().then((result) => { if (active) setAlerts(result) }).catch((reason) => { if (active) setError(describeApiError(reason, 'Unable to load clinic alerts.')) })
    void loadAlerts()
    const timer = window.setInterval(loadAlerts, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const visibleAlerts = useMemo(() => alerts.filter((alert) => {
    if (alert.kind === 'message') return messageAlerts
    if (alert.kind === 'email') return emailAlerts
    if (alert.kind === 'call') return callAlerts
    return smsReminders
  }), [alerts, messageAlerts, emailAlerts, callAlerts, smsReminders])

  const unreadCount = visibleAlerts.filter((alert) => !alert.is_read).length

  const setDay = (day: (typeof WEEKDAY_KEYS)[number], patch: Partial<DayHours>) => {
    setHours((current) => ({ ...current, [day]: { ...current[day], ...patch } }))
  }

  const save = async () => {
    if (!clinicName.trim()) { setError('Clinic name is required.'); return }
    setSaving(true); setSaved(false); setError('')
    try {
      const workingHours = Object.fromEntries(WEEKDAY_KEYS.map((day) => [day, serializeDayHours(hours[day])]))
      await DashboardService.updateSettings({
        clinicName: clinicName.trim(),
        clinicEmail: clinicEmail.trim(),
        phone: phone.trim(),
        timezone,
        address: { line1: line1.trim(), city: city.trim(), state: state.trim(), postalCode: postalCode.trim(), country: settings?.address?.country || 'India' },
        branding: settings?.branding || {},
        workingHours,
        appointmentSettings: { duration, bufferMinutes, emergencySlots },
        notifications: { emailAlerts, smsReminders, messageAlerts, callAlerts },
      })
      setSaved(true)
      await refresh()
      window.setTimeout(() => setSaved(false), 1800)
    } catch (reason) {
      setError(describeApiError(reason, 'Unable to save clinic settings.'))
    } finally {
      setSaving(false)
    }
  }

  const markRead = async (alert: NotificationAlert) => {
    if (alert.is_read) return
    try { await DashboardService.markClientAlertRead(alert.id); setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, is_read: true } : item)) }
    catch (reason) { setError(describeApiError(reason, 'Unable to update alert.')) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005db6]">Clinic workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-[#151c23] sm:text-3xl">Settings</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#727783]">Clinic name, hours, and visit length used by Appointments, billing, and Communications.</p>
        </div>
        <button type="button" disabled={saving} onClick={() => void save()} className="flex items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md disabled:opacity-60">
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save settings'}
        </button>
      </header>

      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <section className="dental-stitch-card p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005db6]">Clinic profile</p>
            <h2 className="mt-1 text-lg font-bold text-[#151c23]">How this clinic appears</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#727783]">Clinic name<input value={clinicName} onChange={(event) => setClinicName(event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-[#727783]">Clinic email<input type="email" value={clinicEmail} onChange={(event) => setClinicEmail(event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-[#727783]">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-[#727783]">Timezone
                <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={inputClass}>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[#727783] sm:col-span-2">Address<input value={line1} onChange={(event) => setLine1(event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-[#727783]">City<input value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-[#727783]">State / PIN
                <div className="grid grid-cols-2 gap-2">
                  <input value={state} onChange={(event) => setState(event.target.value)} placeholder="State" className={inputClass} />
                  <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="PIN" className={inputClass} />
                </div>
              </label>
            </div>
          </section>

          <section className="dental-stitch-card p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005db6]">Appointments</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#151c23]"><CalendarDays size={18} className="text-[#005db6]" />Hours and visit length</h2>
            <p className="mt-1 text-xs text-[#727783]">These hours drive booking and reschedule slots. Closed days have no times.</p>
            <div className="mt-4 space-y-2">
              {editorDays.map((day) => {
                const row = hours[day]
                return (
                  <div key={day} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#c2c6d4]/30 bg-[#f7f9ff] px-3 py-2">
                    <span className="w-24 text-sm font-semibold text-[#151c23]">{weekdayLabels[day]}</span>
                    <button type="button" onClick={() => setDay(day, { open: !row.open })} className={`rounded-full px-3 py-1 text-[10px] font-bold ${row.open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.open ? 'Open' : 'Closed'}</button>
                    {row.open && (
                      <>
                        <input type="time" value={row.start} onChange={(event) => setDay(day, { start: event.target.value })} className="h-9 rounded-lg border border-[#c2c6d4]/50 px-2 text-sm" />
                        <span className="text-xs text-[#727783]">to</span>
                        <input type="time" value={row.end} onChange={(event) => setDay(day, { end: event.target.value })} className="h-9 rounded-lg border border-[#c2c6d4]/50 px-2 text-sm" />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-[#727783]">Visit length (minutes)<input type="number" min={5} max={180} step={5} value={duration} onChange={(event) => setDuration(Number(event.target.value) || 30)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-[#727783]">Buffer (minutes)<input type="number" min={0} max={60} step={5} value={bufferMinutes} onChange={(event) => setBufferMinutes(Number(event.target.value) || 0)} className={inputClass} /></label>
              <label className="text-xs font-semibold text-[#727783]">Urgent slots / day<input type="number" min={0} max={12} value={emergencySlots} onChange={(event) => setEmergencySlots(Number(event.target.value) || 0)} className={inputClass} /></label>
            </div>
          </section>

          <section className="dental-stitch-card p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005db6]">Referrals</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#151c23]"><Building2 size={18} className="text-[#005db6]" />Labs and partner facilities</h2>
                <p className="mt-1 text-xs text-[#727783]">Used when sending lab work or referring a patient outside this clinic.</p>
              </div>
              <span className="rounded-full bg-[#edf4fe] px-3 py-1.5 text-xs font-bold text-[#005db6]">{hospitals.length}</span>
            </div>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#727783]" size={15} />
              <input value={hospitalSearch} onChange={(event) => setHospitalSearch(event.target.value)} placeholder="Search labs or hospitals" className="h-10 w-full rounded-xl border border-[#c2c6d4]/40 bg-[#f7f9ff] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" />
            </div>
            {hospitals.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {hospitals.map((hospital) => (
                  <article key={hospital.id} className="rounded-xl border border-[#c2c6d4]/30 bg-[#f7f9ff] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#151c23]">{hospital.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${hospital.relationship === 'own' ? 'bg-[#d6e3ff] text-[#005db6]' : 'bg-[#fff0d8] text-[#8a5a00]'}`}>{hospital.relationship === 'own' ? 'Own' : 'Partner'}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#005db6]">{hospital.specialty}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-[#727783]"><MapPin size={12} />{hospital.address}, {hospital.city}</p>
                    {hospital.contact_phone && <p className="mt-1 flex items-center gap-1 text-xs text-[#727783]"><PhoneCall size={12} />{hospital.contact_name || 'Desk'} · {hospital.contact_phone}</p>}
                  </article>
                ))}
              </div>
            ) : <p className="rounded-xl bg-[#f7f9ff] p-5 text-sm text-[#727783]">{hospitalSearch ? `No facilities match “${hospitalSearch}”.` : 'No referral facilities are listed for this clinic yet.'}</p>}
          </section>
        </div>

        <div className="space-y-5">
          <section className="dental-stitch-card p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005db6]">Alerts</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#151c23]"><Bell size={18} className="text-[#005db6]" />How the clinic is notified</h2>
                <p className="mt-1 text-xs text-[#727783]">Matches Communications, visit reminders, and billing follow-up.</p>
              </div>
              {unreadCount > 0 && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700">{unreadCount} new</span>}
            </div>
            <ToggleRow label="Communications" description="Patient inbox threads" checked={messageAlerts} onChange={() => setMessageAlerts(!messageAlerts)} icon={<MessageCircle size={17} className="text-[#005db6]" />} />
            <ToggleRow label="Visit reminders" description="SMS / appointment reminders" checked={smsReminders} onChange={() => setSmsReminders(!smsReminders)} icon={<Clock3 size={17} className="text-[#005db6]" />} />
            <ToggleRow label="Billing notices" description="Balance and payment emails" checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} icon={<Mail size={17} className="text-[#005db6]" />} />
            <ToggleRow label="Callback requests" description="Missed calls and phone follow-up" checked={callAlerts} onChange={() => setCallAlerts(!callAlerts)} icon={<PhoneCall size={17} className="text-[#005db6]" />} />
            <div className="mt-4 flex items-center justify-between border-t border-[#c2c6d4]/30 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#727783]">Recent alerts</p>
              <Link to="/dental-client/communications" className="text-[10px] font-bold text-[#005db6]">Open inbox</Link>
            </div>
            <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto">
              {visibleAlerts.length ? visibleAlerts.map((alert) => (
                <button type="button" key={alert.id} onClick={() => void markRead(alert)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${alert.is_read ? 'border-[#c2c6d4]/30 bg-white' : 'border-sky-200 bg-[#edf4fe]'}`}>
                  <span className="mt-0.5 text-[#005db6]">{alert.kind === 'message' ? <MessageCircle size={15} /> : alert.kind === 'email' ? <Mail size={15} /> : <PhoneCall size={15} />}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-xs text-[#151c23]">{alert.title}</b>
                    <span className="mt-1 block text-xs text-[#727783]">{alert.body}</span>
                    <time className="mt-1 block text-[10px] text-[#9aa5b5]">{formatAlertDate(alert.created_at)}{!alert.is_read && <span className="ml-2 font-bold text-[#005db6]">New</span>}</time>
                  </span>
                  {alert.is_read && <CheckCheck size={15} className="mt-1 shrink-0 text-[#9aa5b5]" />}
                </button>
              )) : <p className="rounded-xl bg-[#f7f9ff] p-5 text-center text-xs text-[#727783]">No alerts for the channels that are switched on.</p>}
            </div>
          </section>

          <section className="dental-stitch-card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#151c23]"><LockKeyhole size={18} className="text-[#005db6]" />Security and appearance</h2>
            <div className="rounded-xl bg-[#edf4fe] p-4">
              <p className="text-sm font-bold text-[#151c23]">Account security</p>
              <p className="mt-1 text-xs leading-5 text-[#727783]">Passwords and two-factor authentication are managed by the clinic administrator through sign-in. This screen does not store passwords.</p>
            </div>
            <div className="mt-4">
              <ToggleRow label="Theme" description={theme === 'dark' ? 'Dark mode on' : 'Light mode on'} checked={theme === 'dark'} onChange={toggleTheme} icon={theme === 'dark' ? <Moon size={17} className="text-[#005db6]" /> : <Sun size={17} className="text-[#005db6]" />} />
            </div>
            <p className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-[#727783]"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#005db6]" />Settings apply to this clinic workspace for every authorized user.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange, icon }: { label: string; description: string; checked: boolean; onChange: () => void; icon: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <b className="block text-sm text-[#151c23]">{label}</b>
          <span className="text-xs text-[#727783]">{description}</span>
        </div>
      </div>
      <button type="button" aria-label={`Toggle ${label}`} onClick={onChange} className={`h-6 w-11 rounded-full p-1 transition ${checked ? 'bg-[#005db6]' : 'bg-[#dce3ec]'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? 'ml-5' : ''}`} />
      </button>
    </div>
  )
}

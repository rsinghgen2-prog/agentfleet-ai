import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Appointment, Patient } from '../../services/dashboardService'
import { useDentalDashboardData } from '../../hooks/useDentalDashboardData'
import { appointmentBuffer, appointmentDateKey, appointmentDuration, clinicTimeSlots, localDateKey, patientDisplayName } from '../../utils/clinicSchedule'

const cancelReasons = ['Patient requested', 'Patient no-show', 'Emergency / medical', 'Doctor unavailable', 'Clinic closed', 'Other']
const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export type VisitChangeIntent = { kind: 'reschedule'; date: string; time: string } | { kind: 'cancel'; reason: string }

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00`)
}

function MiniCalendar({ value, min, onChange }: { value: string; min: string; onChange: (date: string) => void }) {
  const selected = dateFromKey(value)
  const [cursor, setCursor] = useState(monthStart(selected))
  const cells = useMemo(() => {
    const start = monthStart(cursor)
    const firstWeekday = start.getDay()
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const blanks = Array.from({ length: firstWeekday }, () => null as string | null)
    const days = Array.from({ length: daysInMonth }, (_, index) => localDateKey(new Date(start.getFullYear(), start.getMonth(), index + 1)))
    return [...blanks, ...days]
  }, [cursor])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft size={16} /></button>
        <p className="text-sm font-semibold text-slate-800">{cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">{weekdayLabels.map((label) => <span key={label}>{label}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />
          const disabled = day < min
          const active = day === value
          return (
            <button type="button" key={day} disabled={disabled} onClick={() => onChange(day)} className={`h-8 rounded-lg text-xs ${active ? 'bg-sky-600 font-semibold text-white' : disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-sky-50'}`}>
              {Number(day.slice(-2))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function VisitChangeModal({ patient, visit, saving, error, onClose, onConfirm }: {
  patient: Patient
  visit: Appointment
  saving: boolean
  error?: string
  onClose: () => void
  onConfirm: (intent: VisitChangeIntent) => void
}) {
  const { settings } = useDentalDashboardData()
  const today = localDateKey()
  const currentTime = String(visit.appointment_time).slice(0, 5)
  const visitDate = appointmentDateKey(visit.appointment_date) || today
  const [mode, setMode] = useState<'reschedule' | 'cancel'>('reschedule')
  const [date, setDate] = useState(visitDate < today ? today : visitDate)
  const timeSlots = useMemo(() => clinicTimeSlots(settings?.working_hours, date, appointmentDuration(settings), appointmentBuffer(settings)), [settings, date])
  const [time, setTime] = useState(currentTime || '09:00')
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  useEffect(() => {
    if (timeSlots.length && !timeSlots.includes(time)) setTime(timeSlots[0])
  }, [timeSlots, time])
  const canReschedule = Boolean(date && time && date >= today && timeSlots.length > 0)
  const canCancel = Boolean(reason.trim() && (reason !== 'Other' || detail.trim()))

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="visit-change-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Visit action</p>
            <h2 id="visit-change-title" className="mt-1 text-xl font-bold text-slate-900">Cancel or reschedule</h2>
            <p className="mt-1 text-sm text-slate-500">{patientDisplayName(patient)} · {appointmentDateKey(visit.appointment_date)} {currentTime} · {visit.appointment_type}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMode('reschedule')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === 'reschedule' ? 'bg-sky-600 text-white' : 'border border-slate-200 text-slate-600'}`}>Reschedule</button>
          <button type="button" onClick={() => setMode('cancel')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === 'cancel' ? 'bg-rose-600 text-white' : 'border border-slate-200 text-slate-600'}`}>Cancel visit</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {mode === 'reschedule' ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">Pick a new date on the calendar, then a time. The visit stays booked for this patient.</p>
            <MiniCalendar value={date} min={today} onChange={setDate} />
            <label className="block text-xs font-semibold text-slate-500">Time
              <select value={time} onChange={(event) => setTime(event.target.value)} disabled={!timeSlots.length} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50">
                {!timeSlots.length && <option value="">Clinic closed</option>}
                {time && !timeSlots.includes(time) && <option value={time}>{time}</option>}
                {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </label>
            {!timeSlots.length && <p className="text-xs text-rose-600">The clinic is closed on this day. Pick another date or update hours in Settings.</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600">Back</button>
              <button type="button" disabled={saving || !canReschedule} onClick={() => onConfirm({ kind: 'reschedule', date, time: time.slice(0, 5) })} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Confirm reschedule'}</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">If you are not rescheduling, confirm the cancellation with a reason. This visit will be removed from today’s chair list.</p>
            <label className="block text-xs font-semibold text-slate-500">Reason
              <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <option value="">Select a reason</option>
                {cancelReasons.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-500">{reason === 'Other' ? 'Details (required)' : 'Notes (optional)'}
              <textarea value={detail} onChange={(event) => setDetail(event.target.value)} className="mt-1 h-20 w-full rounded-lg border border-slate-200 p-2 text-sm" placeholder="Why is this visit being cancelled?" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600">Back</button>
              <button type="button" disabled={saving || !canCancel} onClick={() => onConfirm({ kind: 'cancel', reason: detail.trim() ? `${reason}: ${detail.trim()}` : reason })} className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Confirm cancel'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

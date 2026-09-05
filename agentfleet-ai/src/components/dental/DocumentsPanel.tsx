import { useState, type ChangeEvent } from 'react'
import { Download, FileText, FlaskConical, Upload } from 'lucide-react'
import { DashboardService, type PatientProfile } from '../../services/dashboardService'
import { describeApiError } from '../../utils/apiError'
import { patientDisplayName } from '../../utils/clinicSchedule'

const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded'

export function DocumentsPanel({ profile, onUpdated }: { profile: PatientProfile; onUpdated: (profile: PatientProfile) => void }) {
  const patient = profile.patient
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const reports = [...profile.reports].sort((left, right) => right.uploaded_at.localeCompare(left.uploaded_at))
  const labs = profile.lab_orders

  const refresh = async () => onUpdated(await DashboardService.getPatientProfile(patient.id))

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Files must be 2 MB or smaller.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setUploading(true)
      setError('')
      setNotice('')
      void DashboardService.createMedicalReport({
        patientId: patient.id,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataBase64: result.includes(',') ? result.slice(result.indexOf(',') + 1) : result,
        description: 'Uploaded from consultation documents.',
      }).then(async () => {
        setNotice(`${file.name} saved to this patient’s record.`)
        await refresh()
      }).catch((reason) => setError(describeApiError(reason, 'Unable to upload this document.'))).finally(() => setUploading(false))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="dental-stitch-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Patient documents</h2>
            <p className="mt-1 text-xs text-slate-500">Showing files for {patientDisplayName(patient)}, the patient in this consultation.</p>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white">
            <Upload size={14} />{uploading ? 'Uploading…' : 'Upload'}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx" onChange={upload} className="sr-only" />
          </label>
        </div>
        {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        {notice && <p role="status" className="mb-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</p>}
        {reports.length ? (
          <div className="space-y-2">
            {reports.map((report) => (
              <article key={report.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="mt-0.5 rounded-lg bg-white p-2 text-sky-700 shadow-sm"><FileText size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{report.file_name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatBytes(report.file_size)} · {dateLabel(report.uploaded_at)} · {report.uploaded_by}</p>
                  <p className="mt-1 text-xs text-slate-500">{report.description || 'Clinical document'}</p>
                </div>
                <button type="button" aria-label={`Download ${report.file_name}`} onClick={() => void DashboardService.downloadMedicalReport(patient.id, report.id, report.file_name).catch((reason) => setError(describeApiError(reason, 'Unable to download this document.')))} className="shrink-0 rounded-lg bg-white p-2 text-sky-700 shadow-sm">
                  <Download size={15} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-400">No documents are attached to this patient yet. Upload a report, consent form, or scan to store it on their record.</p>
        )}
      </section>
      <section className="dental-stitch-card p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><FlaskConical size={15} className="text-sky-700" /> Associated lab orders</h2>
        {labs.length ? (
          <div className="space-y-2">
            {labs.map((order) => (
              <article key={order.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{order.order_number}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{order.lab_name} · {dateLabel(order.ordered_at)}</p>
                    <p className="mt-1 text-xs text-slate-500">{order.tests || 'Laboratory order'}</p>
                  </div>
                  <button type="button" aria-label={`Download ${order.order_number}`} onClick={() => void DashboardService.downloadLabOrder(patient.id, order.id, `${order.order_number}.pdf`).catch((reason) => setError(describeApiError(reason, 'Unable to download this lab order.')))} className="shrink-0 rounded-lg bg-white p-2 text-sky-700 shadow-sm">
                    <Download size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No lab orders are linked to this patient.</p>
        )}
      </section>
    </div>
  )
}

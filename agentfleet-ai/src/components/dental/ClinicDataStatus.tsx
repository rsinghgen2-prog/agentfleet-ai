export function ClinicDataStatus({
  error,
  onRetry,
  empty = false,
  emptyText = 'No records yet.',
}: {
  error?: string | null
  onRetry?: () => void
  empty?: boolean
  emptyText?: string
}) {
  if (error) {
    return (
      <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#a23858]/20 bg-[#fe81a1]/10 p-4 text-sm text-[#761538] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <b className="block">Clinic data could not be loaded.</b>
          <span>{error}</span>
        </div>
        {onRetry && <button type="button" onClick={onRetry} className="shrink-0 rounded-xl bg-[#a23858] px-4 py-2 text-xs font-bold text-white">Retry</button>}
      </div>
    )
  }
  if (!empty) return null
  return <div className="mb-5 rounded-2xl border border-dashed border-[#c2c6d4]/60 bg-[#f7f9ff] p-8 text-center text-sm text-[#727783]">{emptyText}</div>
}

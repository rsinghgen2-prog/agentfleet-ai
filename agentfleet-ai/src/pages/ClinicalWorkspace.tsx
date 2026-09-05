import DentistNotes from '../components/DentistNotes'

export default function ClinicalWorkspace() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005db6]">Provider workspace</p>
      <h1 className="mt-1 text-2xl font-bold text-[#151c23] sm:text-3xl">Clinical notes</h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-[#727783]">Internal notes for the clinic team. Charting, history, and documents live on the consultation.</p>
      <DentistNotes />
    </div>
  )
}

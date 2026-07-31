import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Edit3, Plus, Save, Trash2, X } from 'lucide-react'
import { DashboardService, type DentistNote, type DentistNoteInput } from '../services/dashboardService'

type NoteDraft = Pick<DentistNote, 'title' | 'content'> & { expiresAt: string }

const emptyDraft: NoteDraft = { title: '', content: '', expiresAt: '' }
const formatNoteDate = (value: string) => new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const toDateTimeLocal = (value: string) => { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16) }

export default function DentistNotes() {
  const [notes, setNotes] = useState<DentistNote[]>([])
  const [draft, setDraft] = useState<NoteDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setNotes(await DashboardService.getDentistNotes())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load dentist notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadNotes() }, [loadNotes])
  useEffect(() => {
    const timer = window.setInterval(() => { void loadNotes() }, 60_000)
    return () => window.clearInterval(timer)
  }, [loadNotes])

  const openNewNote = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setError(null)
    setEditorOpen(true)
  }

  const openEditNote = (note: DentistNote) => {
    setEditingId(note.id)
    setDraft({ title: note.title, content: note.content, expiresAt: toDateTimeLocal(note.expires_at) })
    setError(null)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId(null)
    setDraft(emptyDraft)
  }

  const saveNote = async (event: FormEvent) => {
    event.preventDefault()
    const title = draft.title.trim() || 'Clinical note'
    const content = draft.content.trim()
    if (!content) {
      setError('Note content is required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const input: DentistNoteInput = { title, content, expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null }
      const saved = editingId
        ? await DashboardService.updateDentistNote(editingId, input)
        : await DashboardService.createDentistNote(input)
      setNotes((current) => editingId ? current.map((note) => note.id === saved.id ? saved : note) : [saved, ...current])
      closeEditor()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save dentist note')
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (note: DentistNote) => {
    if (!window.confirm(`Delete “${note.title}”?`)) return
    setDeletingId(note.id)
    setError(null)
    try {
      await DashboardService.deleteDentistNote(note.id)
      setNotes((current) => current.filter((item) => item.id !== note.id))
      if (editingId === note.id) closeEditor()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete dentist note')
    } finally {
      setDeletingId(null)
    }
  }

  return <section className="dental-stitch-card min-h-40 p-5">
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Dentist Notes</h2><p className="mt-1 text-xs text-[#727783]">Clinical reminders and follow-ups for your practice.</p></div>
      <button type="button" onClick={openNewNote} className="flex shrink-0 items-center gap-1 rounded-full bg-[#e8eef8] px-3 py-2 text-xs font-bold text-[#005db6]"><Plus size={16} /> Add note</button>
    </div>
    {error && <div role="alert" className="mt-4 rounded-xl border border-[#a23858]/20 bg-[#fe81a1]/10 p-3 text-xs text-[#761538]">{error}</div>}
    {editorOpen && <form onSubmit={saveNote} className="mt-4 space-y-3 rounded-2xl border border-[#5897f4]/30 bg-[#f7f9ff] p-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#151c23]">{editingId ? 'Edit note' : 'Add note'}</h3><button type="button" onClick={closeEditor} aria-label="Close note editor" className="rounded-full p-1 text-[#727783] hover:bg-white"><X size={16} /></button></div>
      <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} maxLength={160} placeholder="Note title" className="h-10 w-full rounded-xl border border-[#c2c6d4]/40 bg-white px-3 text-sm text-[#151c23] outline-none focus:ring-2 focus:ring-[#005db6]/20" />
      <textarea value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} maxLength={10000} required rows={4} placeholder="Write a clinical note, reminder, or follow-up..." className="w-full resize-y rounded-xl border border-[#c2c6d4]/40 bg-white px-3 py-2 text-sm text-[#151c23] outline-none focus:ring-2 focus:ring-[#005db6]/20" />
      <label className="block text-xs font-bold text-[#424752]">Expiration date and time <span className="font-normal text-[#727783]">(optional; defaults to one month)</span><input type="datetime-local" value={draft.expiresAt} onChange={(event) => setDraft((current) => ({ ...current, expiresAt: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[#c2c6d4]/40 bg-white px-3 text-sm font-normal text-[#151c23] outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={closeEditor} className="rounded-xl px-3 py-2 text-xs font-bold text-[#424752] hover:bg-white">Cancel</button><button type="submit" disabled={saving} className="flex items-center gap-1 rounded-xl bg-[#005db6] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Save size={14} />{saving ? 'Saving…' : 'Save note'}</button></div>
    </form>}
    <div className="mt-4 space-y-3">
      {loading && <p className="text-sm text-[#727783]">Loading notes…</p>}
      {!loading && notes.length === 0 && <p className="rounded-2xl bg-[#f7f9ff] p-4 text-sm text-[#727783]">No dentist notes yet. Add your first note to keep clinical reminders together.</p>}
      {!loading && notes.map((note) => <article key={note.id} className="rounded-2xl border border-[#c2c6d4]/30 bg-[#f7f9ff] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-bold text-[#151c23]">{note.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#424752]">{note.content}</p><time className="mt-2 block text-[10px] text-[#727783]">Updated {formatNoteDate(note.updated_at)} · Expires {formatNoteDate(note.expires_at)}</time></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => openEditNote(note)} aria-label={`Edit ${note.title}`} className="rounded-full p-2 text-[#005db6] hover:bg-white"><Edit3 size={15} /></button><button type="button" onClick={() => void deleteNote(note)} disabled={deletingId === note.id} aria-label={`Delete ${note.title}`} className="rounded-full p-2 text-[#a23858] hover:bg-white disabled:opacity-50"><Trash2 size={15} /></button></div></div></article>)}
    </div>
  </section>
}
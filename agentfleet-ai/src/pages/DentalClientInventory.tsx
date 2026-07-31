import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, ArrowUpToLine, Edit3, History, Package, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react'
import { DashboardService, type InventoryInput, type InventoryItem } from '../services/dashboardService'

const emptyDraft: InventoryInput = { name: '', category: '', quantity: 0, reorderLevel: 0, unit: 'units' }

export default function DentalClientInventory() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<InventoryInput>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [history, setHistory] = useState<InventoryItem[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setItems(await DashboardService.getInventory(query)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load inventory') }
    finally { setLoading(false) }
  }, [query])

  useEffect(() => { void loadItems() }, [loadItems])

  const openAdd = (prefill?: InventoryItem) => {
    setEditingId(null)
    setDraft(prefill ? { name: prefill.name, category: prefill.category, quantity: prefill.quantity, reorderLevel: prefill.reorder_level, unit: prefill.unit } : { ...emptyDraft })
    setModalOpen(true)
    setHistoryOpen(false)
  }

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setDraft({ name: item.name, category: item.category, quantity: item.quantity, reorderLevel: item.reorder_level, unit: item.unit })
    setModalOpen(true)
  }

  const saveInventory = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editingId) await DashboardService.updateInventory(editingId, draft)
      else await DashboardService.createInventory(draft)
      setModalOpen(false)
      await loadItems()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save inventory item')
    } finally { setSaving(false) }
  }

  const deleteItem = async (item: InventoryItem) => {
    if (!window.confirm(`Disable ${item.name}? It will remain in inventory history.`)) return
    setDeletingId(item.id)
    setError(null)
    try { await DashboardService.deleteInventory(item.id); await loadItems() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to disable inventory item') }
    finally { setDeletingId(null) }
  }

  const loadHistory = async () => {
    try {
      setError(null)
      setHistory(await DashboardService.getInventoryHistory(query))
      setHistoryOpen(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load inventory history') }
  }

  const lowStock = items.filter((item) => item.low_stock || item.quantity <= item.reorder_level)
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)

  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold text-[#151c23] sm:text-3xl">Inventory Management</h1><p className="mt-1 text-sm text-[#424752]">Track dental supplies and reorder before you run out.</p></div><button onClick={() => openAdd()} className="flex items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md"><Plus size={17} /> Add inventory</button></div>
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Summary label="Total items" value={items.length} icon={<Package className="text-[#5897f4]" />} /><Summary label="Units available" value={totalUnits} icon={<ArrowUpToLine className="text-green-600" />} /><div className="rounded-3xl bg-[#ffdad6]/60 p-5"><p className="text-xs font-bold uppercase tracking-widest text-[#a23858]">Low stock alerts</p><div className="mt-3 flex items-center justify-between"><b className="text-3xl text-[#a23858]">{lowStock.length}</b><AlertTriangle className="text-[#a23858]" /></div></div></div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 w-full rounded-xl border-0 bg-white px-5 pr-10 text-sm shadow-sm outline-none" placeholder="Search inventory..." /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727783]" size={18} /></div><div className="flex gap-2"><button onClick={() => setShowAll((value) => !value)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#424752] shadow-sm"><ShoppingCart size={16} /> {showAll ? 'Hide details' : 'View all'}</button><button onClick={() => void loadHistory()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#424752] shadow-sm"><History size={16} /> History</button></div></div>
    {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading ? <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">Loading inventory…</div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.slice(0, showAll ? items.length : 3).map((item) => { const isLow = item.low_stock || item.quantity <= item.reorder_level; return <article key={item.id} className="dental-stitch-card group overflow-hidden p-5"><div className="mb-5 flex h-32 items-center justify-center rounded-2xl bg-[#edf4fe]"><Package size={66} strokeWidth={1.2} className="text-[#005db6] transition group-hover:scale-110" /></div><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#727783]">{item.category}</p><h2 className="mt-1 text-lg font-semibold text-[#151c23]">{item.name}</h2></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isLow ? 'bg-[#fe81a1]/20 text-[#761538]' : 'bg-[#5897f4]/20 text-[#00468b]'}`}>{isLow ? 'Low Stock' : 'In Stock'}</span></div><div className="mt-5 flex items-end justify-between border-t border-[#c2c6d4]/30 pt-4"><span><b className="text-2xl text-[#005db6]">{item.quantity}</b><small className="ml-1 text-xs text-[#727783]">{item.unit}</small></span><div className="flex gap-2"><button onClick={() => openEdit(item)} className="rounded-xl bg-[#e2e9f2] p-2 text-[#005db6] hover:bg-[#d6e3ff]" aria-label={`Edit ${item.name}`}><Edit3 size={17} /></button><button onClick={() => void deleteItem(item)} disabled={deletingId === item.id} className="rounded-xl bg-[#fff0f5] p-2 text-[#a23858] hover:bg-[#ffd5e2] disabled:opacity-50" aria-label={`Disable ${item.name}`}><Trash2 size={17} /></button></div></div></article> })}</div>}
    {showAll && !loading && <section className="dental-stitch-card mt-6 overflow-x-auto p-5"><h2 className="mb-4 text-lg font-bold text-[#151c23]">All active inventory</h2><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#c2c6d4]/40 text-xs uppercase tracking-wider text-[#727783]"><tr><th className="pb-3">Product</th><th className="pb-3">Category</th><th className="pb-3">Quantity</th><th className="pb-3">Reorder at</th><th className="pb-3 text-right">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[#c2c6d4]/20 last:border-0"><td className="py-3 font-bold text-[#151c23]">{item.name}<span className="ml-2 text-xs font-normal text-[#727783]">({item.unit})</span></td><td className="py-3 text-[#424752]">{item.category}</td><td className="py-3 text-[#005db6]">{item.quantity}</td><td className="py-3 text-[#424752]">{item.reorder_level}</td><td className="py-3 text-right"><button onClick={() => openEdit(item)} className="mr-2 text-[#005db6]" aria-label={`Edit ${item.name}`}><Edit3 size={16} /></button><button onClick={() => void deleteItem(item)} className="text-[#a23858]" aria-label={`Disable ${item.name}`}><Trash2 size={16} /></button></td></tr>)}</tbody></table></section>}
    {historyOpen && <section className="dental-stitch-card mt-6 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#151c23]">Inventory history</h2><p className="text-xs text-[#727783]">Disabled products are retained and can prefill a new inventory entry.</p></div><button onClick={() => setHistoryOpen(false)} className="rounded-full p-2 text-[#727783] hover:bg-[#edf4fe]" aria-label="Close inventory history"><X size={18} /></button></div>{history.length ? <div className="space-y-2">{history.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-[#f7f9ff] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#151c23]">{item.name}</p><p className="text-xs text-[#727783]">{item.category} · {item.quantity} {item.unit} · disabled</p></div><button onClick={() => openAdd(item)} className="rounded-lg bg-[#d6e3ff] px-3 py-2 text-xs font-bold text-[#005db6]">Use as template</button></div>)}</div> : <p className="text-sm text-[#727783]">No disabled inventory items found.</p>}</section>}
    {!loading && items.length === 0 && <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">No inventory items match your search.</div>}
    {modalOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#151c23]/45 p-4"><form onSubmit={saveInventory} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold text-[#151c23]">{editingId ? 'Update inventory' : 'Add inventory'}</h2><p className="mt-1 text-xs text-[#727783]">Save quantities and reorder thresholds for your clinic.</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded-full p-2 text-[#727783] hover:bg-[#edf4fe]" aria-label="Close inventory form"><X size={19} /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#424752] sm:col-span-2">Product name<input required maxLength={255} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/50 px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label><label className="text-xs font-bold text-[#424752]">Category<input required maxLength={100} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/50 px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label><label className="text-xs font-bold text-[#424752]">Unit<input required maxLength={50} value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/50 px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label><label className="text-xs font-bold text-[#424752]">Quantity<input required min="0" type="number" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })} className="mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/50 px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label><label className="text-xs font-bold text-[#424752]">Reorder level<input required min="0" type="number" value={draft.reorderLevel} onChange={(event) => setDraft({ ...draft, reorderLevel: Number(event.target.value) })} className="mt-1 h-11 w-full rounded-xl border border-[#c2c6d4]/50 px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-[#005db6]/20" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-3 text-xs font-bold text-[#424752]">Cancel</button><button disabled={saving} className="rounded-xl bg-[#005db6] px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add inventory'}</button></div></form></div>}
  </div>
}

function Summary({ label, value, icon }: { label: string; value: number; icon: ReactNode }) { return <div className="dental-stitch-card p-5"><p className="text-xs font-bold uppercase tracking-widest text-[#424752]">{label}</p><div className="mt-3 flex items-center justify-between"><b className="text-3xl text-[#005db6]">{value}</b>{icon}</div></div> }
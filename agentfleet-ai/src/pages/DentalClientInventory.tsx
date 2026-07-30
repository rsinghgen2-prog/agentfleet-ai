import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowUpToLine, Package, Plus, Search, ShoppingCart } from 'lucide-react'
import { DashboardService, type InventoryItem } from '../services/dashboardService'

export default function DentalClientInventory() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    DashboardService.getInventory(query)
      .then((result) => { if (active) setItems(result) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load inventory') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  const lowStock = items.filter((item) => item.low_stock || item.quantity <= item.reorder_level)
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)

  return <div className="min-h-[calc(100vh-4rem)] px-4 py-6 pb-24 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold text-[#151c23] sm:text-3xl">Inventory Management</h1><p className="mt-1 text-sm text-[#424752]">Track dental supplies and reorder before you run out.</p></div><button className="flex items-center justify-center gap-2 rounded-xl bg-[#005db6] px-4 py-3 text-xs font-bold text-white shadow-md"><Plus size={17} /> Add inventory</button></div>
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Summary label="Total items" value={items.length} icon={<Package className="text-[#5897f4]" />} /><Summary label="Units available" value={totalUnits} icon={<ArrowUpToLine className="text-green-600" />} /><div className="rounded-3xl bg-[#ffdad6]/60 p-5"><p className="text-xs font-bold uppercase tracking-widest text-[#a23858]">Low stock alerts</p><div className="mt-3 flex items-center justify-between"><b className="text-3xl text-[#a23858]">{lowStock.length}</b><AlertTriangle className="text-[#a23858]" /></div></div></div>
    <div className="mb-5 flex gap-3"><div className="relative flex-1"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 w-full rounded-xl border-0 bg-white px-5 pr-10 text-sm shadow-sm outline-none" placeholder="Search inventory..." /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727783]" size={18} /></div><button className="hidden items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#424752] shadow-sm sm:flex"><ShoppingCart size={16} /> Reorder list</button></div>
    {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading ? <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">Loading inventory…</div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => { const isLow = item.low_stock || item.quantity <= item.reorder_level; return <article key={item.id} className="dental-stitch-card group overflow-hidden p-5"><div className="mb-5 flex h-32 items-center justify-center rounded-2xl bg-[#edf4fe]"><Package size={66} strokeWidth={1.2} className="text-[#005db6] transition group-hover:scale-110" /></div><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#727783]">{item.category}</p><h2 className="mt-1 text-lg font-semibold text-[#151c23]">{item.name}</h2></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isLow ? 'bg-[#fe81a1]/20 text-[#761538]' : 'bg-[#5897f4]/20 text-[#00468b]'}`}>{isLow ? 'Low Stock' : 'In Stock'}</span></div><div className="mt-5 flex items-end justify-between border-t border-[#c2c6d4]/30 pt-4"><span><b className="text-2xl text-[#005db6]">{item.quantity}</b><small className="ml-1 text-xs text-[#727783]">{item.unit}</small></span><button className="rounded-xl bg-[#e2e9f2] p-2 text-[#005db6] hover:bg-[#d6e3ff]" aria-label={`Adjust ${item.name}`}><ArrowDownToLine size={17} /></button></div></article> })}</div>}
    {!loading && items.length === 0 && <div className="dental-stitch-card py-12 text-center text-sm text-[#727783]">No inventory items match your search.</div>}
  </div>
}

function Summary({ label, value, icon }: { label: string; value: number; icon: ReactNode }) { return <div className="dental-stitch-card p-5"><p className="text-xs font-bold uppercase tracking-widest text-[#424752]">{label}</p><div className="mt-3 flex items-center justify-between"><b className="text-3xl text-[#005db6]">{value}</b>{icon}</div></div> }
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, type CSSProperties } from 'react'
import { Calendar, CalendarDays, CircleHelp, FolderOpen, Grid2X2, LogOut, Menu, MessageSquare, Moon, Package, Receipt, Search, Settings, Smile, Sun, Users } from 'lucide-react'
import { useDentalDashboardData, clearDentalDashboardCache } from '../../hooks/useDentalDashboardData'
import { useTheme } from '../../context/ThemeContext'
import DentalSupportChat from './DentalSupportChat'
import DentalNotificationCenter from './DentalNotificationCenter'

const navItems = [
  { label: 'Dashboard', to: '/dental-client', icon: Grid2X2, end: true },
  { label: 'Appointments', to: '/dental-client/schedule', icon: CalendarDays },
  { label: 'Patients', to: '/dental-client/patients', icon: Users },
  { label: 'Inventory', to: '/dental-client/inventory', icon: Package },
  { label: 'Billing & Payments', to: '/dental-client/payments', icon: Receipt },
  { label: 'Documents', to: '/dental-client/documents', icon: FolderOpen },
  { label: 'Communications', to: '/dental-client/communications', icon: MessageSquare },
  { label: 'Settings', to: '/dental-client/settings', icon: Settings },
]

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
    isActive ? 'bg-sky-600 font-medium text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
  }`

const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'v1.0.0'

export default function DentalClientShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { client, settings } = useDentalDashboardData()
  const [supportOpen, setSupportOpen] = useState(false)
  const [search, setSearch] = useState('')
  const clientName = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('clientData') || '{}').clientName
      return stored && stored !== 'undefined' ? stored : 'Dr. Rajeev Pratap Singh'
    } catch { return 'Dr. Rajeev Pratap Singh' }
  })()
  const clinicName = settings?.clinic_name || client?.brandName || 'Dental Clinic'
  const primaryColor = settings?.branding?.primaryColor || client?.primaryColor || '#005db6'
  const initials = clientName.split(' ').map((part: string) => part[0]).join('').slice(0, 2)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSearch(location.pathname.startsWith('/dental-client/patients') ? params.get('search') || '' : '')
  }, [location.pathname, location.search])

  const submitSearch = () => {
    const query = search.trim()
    navigate(query ? `/dental-client/patients?search=${encodeURIComponent(query)}` : '/dental-client/patients')
  }

  const logout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('clientData')
    localStorage.removeItem('userType')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isSuperAdmin')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.clear()
    clearDentalDashboardCache()
    navigate('/login')
  }

  return (
    <div className="dental-stitch-app flex min-h-screen" style={{ '--tenant-primary': primaryColor } as CSSProperties}>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-56 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white"><Smile size={20} /></div>
          <div className="leading-tight"><p className="text-sm font-bold text-sky-700">{clinicName}</p><p className="text-[11px] text-slate-400">Dental Clinic</p></div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {navItems.map(({ label, to, icon: Icon, end }) => <NavLink key={`${label}-${to}`} to={to} end={end} className={navClass}><Icon size={17} />{label}</NavLink>)}
        </nav>
        <div className="m-3 rounded-xl border border-sky-100 bg-sky-50 p-4">
          <p className="mb-2 text-[11px] font-medium text-sky-700">Next Appointment</p><div className="flex items-start gap-2"><Calendar size={16} className="mt-0.5 text-sky-600" /><div><p className="text-sm font-semibold text-slate-800">View schedule</p><p className="text-xs text-slate-500">Upcoming clinic visit</p></div></div>
          <button onClick={() => navigate('/dental-client/schedule')} className="mt-3 w-full rounded-lg border border-sky-200 bg-white py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100">View Appointments</button>
        </div>
        <div className="space-y-0.5 border-t border-slate-200 px-3 py-3">
          <button onClick={() => setSupportOpen(true)} className={navClass({ isActive: supportOpen })}><CircleHelp size={17} />Help</button>
          <button onClick={logout} className={navClass({ isActive: false })}><LogOut size={17} />Logout</button>
        </div>
      </aside>

      <main className="min-h-screen flex-1 md:pl-56">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Menu className="text-[#005db6] md:hidden" size={22} />
            <div className="relative hidden w-full max-w-md sm:block">
              <input aria-label="Search patients or appointments" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitSearch() }} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="Search patient, appointments..." />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <button type="button" aria-label="Search" onClick={submitSearch} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#727783] hover:bg-[#e2e9f2] hover:text-[#005db6]"><Search size={18} /></button>
            </div>
            <span className="truncate text-lg font-bold text-[#005db6] sm:hidden">{clinicName}</span>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} className="rounded-full bg-white p-2.5 text-[#424752] shadow-sm hover:bg-[#e2e9f2] dark:bg-[#172235] dark:text-slate-200 dark:hover:bg-[#24334a]">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <DentalNotificationCenter />
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{initials}</div><span className="hidden max-w-32 truncate text-xs font-medium text-slate-800 lg:block">{clientName}</span></div>
          </div>
        </header>
        <Outlet />
        <footer className="border-t border-[#c2c6d4]/30 px-4 py-3 text-center text-[11px] text-[#727783] sm:px-6 lg:px-8">
          Powered by <span className="font-semibold text-[#424752]">Avighana Technology Pvt Ltd</span><span className="mx-2">·</span>{APP_VERSION}
        </footer>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-start gap-1 overflow-x-auto border-t border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md md:hidden">
        {navItems.map(({ label, to, icon: Icon, end }) => <NavLink key={`${label}-${to}`} to={to} end={end} className={({ isActive }) => `flex min-w-[68px] shrink-0 flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-bold ${isActive ? 'bg-sky-600 text-white' : 'text-slate-600'}`}><Icon size={18} /><span>{label}</span></NavLink>)}
      </nav>
      <DentalSupportChat open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
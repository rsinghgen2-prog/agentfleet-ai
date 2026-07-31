import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, type CSSProperties } from 'react'
import { CalendarDays, CircleHelp, Grid2X2, LogOut, Menu, Moon, Package, Search, Settings, Sun, Users } from 'lucide-react'
import { useDentalDashboardData } from '../../hooks/useDentalDashboardData'
import { useTheme } from '../../context/ThemeContext'
import DentalSupportChat from './DentalSupportChat'
import DentalNotificationCenter from './DentalNotificationCenter'

const navItems = [
  { label: 'Dashboard', to: '/dental-client', icon: Grid2X2, end: true },
  { label: 'Patients', to: '/dental-client/patients', icon: Users },
  { label: 'Schedule', to: '/dental-client/schedule', icon: CalendarDays },
  { label: 'Inventory', to: '/dental-client/inventory', icon: Package },
  { label: 'Settings', to: '/dental-client/settings', icon: Settings },
]

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold tracking-wide transition-colors ${
    isActive ? 'bg-[var(--tenant-primary)] text-white shadow-md' : 'text-[#424752] hover:bg-[#e2e9f2]'
  }`

export default function DentalClientShell() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { client, settings } = useDentalDashboardData()
  const [supportOpen, setSupportOpen] = useState(false)
  const clientName = (() => {
    try { return JSON.parse(localStorage.getItem('clientData') || '{}').clientName || 'Dr. Rajeev Pratap Singh' } catch { return 'Dr. Rajeev Pratap Singh' }
  })()
  const clinicName = settings?.clinic_name || client?.brandName || 'Dental Clinic'
  const logo = settings?.branding?.logo || client?.logo || '🦷'
  const primaryColor = settings?.branding?.primaryColor || client?.primaryColor || '#005db6'
  const initials = clientName.split(' ').map((part: string) => part[0]).join('').slice(0, 2)

  const logout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('clientData')
    localStorage.removeItem('userType')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isSuperAdmin')
    sessionStorage.clear()
    navigate('/login')
  }

  return (
    <div className="dental-stitch-app flex min-h-screen" style={{ '--tenant-primary': primaryColor } as CSSProperties}>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-20 flex-col bg-[#edf4fe] px-3 py-7 shadow-sm md:flex lg:w-64 lg:px-5">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005db6] text-xl text-white">{logo}</div>
          <div className="hidden lg:block">
            <p className="text-lg font-bold leading-tight text-[#005db6]">{clinicName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#424752]">Dental workspace</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={navClass}><Icon size={20} /><span className="hidden lg:block">{label}</span></NavLink>)}
        </nav>
        <div className="space-y-2 border-t border-[#c2c6d4]/40 pt-4">
          <button onClick={() => setSupportOpen(true)} className={navClass({ isActive: supportOpen })}><CircleHelp size={20} /><span className="hidden lg:block">Help</span></button>
          <button onClick={logout} className={navClass({ isActive: false })}><LogOut size={20} /><span className="hidden lg:block">Logout</span></button>
        </div>
      </aside>

      <main className="min-h-screen flex-1 md:pl-20 lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-[#c2c6d4]/30 bg-[#f7f9ff]/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Menu className="text-[#005db6] md:hidden" size={22} />
            <div className="relative hidden w-full max-w-xl sm:block">
              <input aria-label="Search patients or appointments" className="h-11 w-full rounded-2xl border-0 bg-white px-5 pr-12 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#005db6]/20" placeholder="Find Patients or Appointments" />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727783]" size={18} />
            </div>
            <span className="truncate text-lg font-bold text-[#005db6] sm:hidden">{clinicName}</span>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} className="rounded-full bg-white p-2.5 text-[#424752] shadow-sm hover:bg-[#e2e9f2] dark:bg-[#172235] dark:text-slate-200 dark:hover:bg-[#24334a]">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <DentalNotificationCenter />
            <div className="flex items-center gap-2 rounded-full bg-white p-1 pr-3 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6e3ff] text-xs font-bold text-[#005db6]">{initials}</div><span className="hidden max-w-32 truncate text-xs font-bold text-[#151c23] lg:block">{clientName}</span></div>
          </div>
        </header>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#c2c6d4]/30 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md md:hidden">
        {navItems.slice(0, 5).map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-bold ${isActive ? 'bg-[#2a3138] text-white' : 'text-[#424752]'}`}><Icon size={18} /><span>{label}</span></NavLink>)}
      </nav>
      <DentalSupportChat open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
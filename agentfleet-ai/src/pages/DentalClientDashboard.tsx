import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Grid,
  MoreHorizontal,
  Smile,
  Sparkles,
  Moon,
  Sun,
  Settings,
  LogOut
} from 'lucide-react'
import { DashboardService, type DashboardData, type Appointment } from '../services/dashboardService'
import { BookingModal, type BookingFormData } from '../components/BookingModal'
import { useTheme } from '../context/ThemeContext'

const DentalClientDashboard = () => {
  const navigate = useNavigate()
  const [clientData, setClientData] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('Today')
  const filterOptions = ['Today', 'Tomorrow', 'Next three days', 'Next seven days']
  const { toggleTheme, isDark } = useTheme()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    const client = localStorage.getItem('clientData')
    if (client) setClientData(JSON.parse(client))
    loadDashboardData()
  }, [navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const data = await DashboardService.getDashboardData()
      setDashboardData(data)
      setCurrentDate(new Date(data.currentDate.year, data.currentDate.month - 1, 1))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookingSubmit = async (bookingData: BookingFormData) => {
    try {
      const result = await DashboardService.createBooking(bookingData)
      if (result) {
        await loadDashboardData()
        setIsBookingModalOpen(false)
      }
    } catch (error) {
      console.error(error)
      alert('Unable to create booking. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('clientData')
    navigate('/login')
  }

  const handleSettings = () => {
    setIsUserMenuOpen(false)
    navigate('/settings')
  }

  const patients =
    dashboardData?.todaysAppointments.map((apt: Appointment) => ({
      id: apt.id,
      name: `${apt.first_name} ${apt.last_name}`,
      type: apt.appointment_type,
      time: apt.appointment_time.substring(0, 5),
      date: apt.appointment_date,
      badge: apt.appointment_type.includes('Routine') ? 'Routine' : 'Follow-up',
      gender: apt.gender
    })) || []

  const selectedFilterPatients = patients.filter((patient) => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const appointmentDate = new Date(`${patient.date}T00:00:00`)
    const msPerDay = 24 * 60 * 60 * 1000
    const diff = Math.floor((appointmentDate.getTime() - todayStart.getTime()) / msPerDay)

    switch (bookingFilter) {
      case 'Tomorrow':
        return diff === 1
      case 'Next three days':
        return diff >= 0 && diff < 3
      case 'Next seven days':
        return diff >= 0 && diff < 7
      default:
        return diff === 0
    }
  })

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const currentMonthName = monthNames[currentDate.getMonth()]

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = [] as Array<number | null>

    for (let i = 0; i < firstDay; i += 1) days.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) days.push(day)

    return days
  }

  const hasAppointments = (day: number | null) => {
    if (day === null || !dashboardData?.calendarData) return false
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dashboardData.calendarData.some(item => item.appointment_date === dateString)
  }

  const isToday = (day: number | null) => {
    if (day === null) return false
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  if (!clientData) return null
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--body-bg)] text-[var(--body-text)] transition-colors duration-300">
        <div className="text-xl font-semibold">Loading dashboard…</div>
      </div>
    )
  }

  const doctorName = clientData.clientName || 'Dr. Rajeev Pratap Singh'
  const clinicAddress = clientData.address || '128/31, F Block Kidwai Nagar, Kanpur, Near Matadeen HP Petrol Pump, Geeta Park, Kidwai Nagar, Kanpur-208011, Uttar Pradesh, India'
  const todayVisits = dashboardData?.stats.todayVisits ?? 790
  const newPatients = dashboardData?.stats.newPatientsToday ?? 750
  const returningPatients = dashboardData?.stats.totalAppointmentsToday ?? 40
  const upcomingAppointment = dashboardData?.todaysAppointments?.[0]
    ? {
        title: dashboardData.todaysAppointments[0].appointment_type,
        date: dashboardData.todaysAppointments[0].appointment_date,
        time: dashboardData.todaysAppointments[0].appointment_time.substring(0, 5)
      }
    : {
        title: 'No upcoming appointments',
        date: '—',
        time: '—'
      }

  return (
    <div className="min-h-screen bg-[var(--body-bg)] text-[var(--body-text)] transition-colors duration-300">
      <div className="mx-auto max-w-[1480px] px-4 py-6 lg:px-8 lg:py-8">
        <div className="rounded-[32px] bg-[var(--surface)] border border-[var(--border)] px-5 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] mb-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">V.P.S.</span>
              <span className="text-xl font-bold tracking-tight text-[var(--body-text)]">V.P.S. Dental & Oral Care</span>
            </div>
            <div className="flex flex-1 items-center justify-end text-right text-sm text-[var(--text-muted)] xl:text-right">
              <div>
                <p className="font-semibold text-[var(--body-text)]">Dr. {doctorName.split(' ')[0]}</p>
                <p>Here’s your schedule and active bookings for today.</p>
              </div>
            </div>
            <div className="relative flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--body-text)] shadow-sm transition hover:bg-[var(--surface)]"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[rgba(56,189,248,0.2)] transition hover:bg-[var(--primary-strong)]" onClick={() => setIsUserMenuOpen((prev) => !prev)}>
                S
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-16 z-10 w-48 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                  <button onClick={handleSettings} className="flex w-full items-center gap-2 rounded-3xl px-4 py-3 text-left text-sm text-[var(--body-text)] transition hover:bg-[var(--surface-strong)]">
                    <Settings className="h-4 w-4 text-[var(--primary)]" />
                    Settings
                  </button>
                  <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-3xl px-4 py-3 text-left text-sm text-[var(--body-text)] transition hover:bg-[var(--surface-strong)]">
                    <LogOut className="h-4 w-4 text-[var(--primary)]" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.75fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[40px] bg-[var(--surface)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] transition-colors overflow-hidden">
              <div className="grid gap-6 xl:grid-cols-[1.5fr_auto] xl:items-center">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">Today's Patient Visits</p>
                    <div className="flex items-end gap-3">
                      <span className="text-[4.5rem] font-semibold leading-none text-[var(--body-text)]">{todayVisits}</span>
                      <span className="text-sm text-[var(--text-muted)]">/person</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">Updated for Dr. {doctorName.split(' ')[0]}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[28px] bg-[#E0F2FE] p-5 shadow-sm border border-[#bae6fd] transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-[var(--text-muted)]">New Patients</p>
                          <p className="mt-3 text-3xl font-semibold text-[var(--body-text)]">{newPatients}</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                          <ArrowUpRight className="h-4 w-4" />
                          51%
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[28px] bg-[#FEE2E2] p-5 shadow-sm border border-[#fecaca] transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-[var(--text-muted)]">Returning Patients</p>
                          <p className="mt-3 text-3xl font-semibold text-[var(--body-text)]">{returningPatients}</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                          <ArrowDownRight className="h-4 w-4" />
                          51%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[36px] bg-[var(--surface-strong)] shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1611470985607-1f168365b5c6?auto=format&fit=crop&w=800&q=80"
                    alt="Dental graphic"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-[var(--surface)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-colors">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--body-text)]">Patient List</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--body-text)] shadow-sm">
                  <span className="text-[var(--text-muted)]">{bookingFilter}</span>
                  <select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="bg-transparent text-sm text-[var(--body-text)] outline-none"
                  >
                    {filterOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {selectedFilterPatients.length > 0 ? (
                  selectedFilterPatients.slice(0, 4).map(patient => (
                    <div key={patient.id} className="flex items-center justify-between gap-4 rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-lg font-semibold text-[var(--primary)]">
                          {patient.name.split(' ').map((part: string) => part[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[var(--body-text)]">{patient.name}</p>
                          <p className="text-sm font-medium text-emerald-600">{patient.badge}</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-[var(--body-bg)] px-4 py-2 text-sm font-semibold text-[var(--body-text)] shadow-sm">{patient.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[28px] bg-[var(--surface-strong)] p-6 text-center text-sm text-[var(--text-muted)]">No bookings match this filter.</div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] bg-[var(--surface)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--body-text)]">Consultation</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Guy Hawkins • Male • 28 Years old</p>
                </div>
                <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text-muted)] transition hover:bg-[var(--surface)]">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 flex items-center gap-4 rounded-[28px] bg-[var(--surface-strong)] p-4 shadow-sm transition-colors">
                <div className="h-16 w-16 rounded-full border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
                  <img
                    src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=200&q=80"
                    alt="Guy Hawkins"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-[var(--body-text)]">Guy Hawkins</p>
                  <p className="text-sm text-[var(--text-muted)]">Male - 28 Years old</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-[28px] bg-[var(--surface-strong)] p-4 shadow-sm transition-colors">
                  <Sparkles className="mx-auto mb-2 h-5 w-5 text-[var(--primary)]" />
                  <p className="text-sm font-semibold text-[var(--body-text)]">Braces</p>
                </div>
                <div className="rounded-[28px] bg-[var(--surface-strong)] p-4 shadow-sm transition-colors">
                  <Smile className="mx-auto mb-2 h-5 w-5 text-[var(--primary)]" />
                  <p className="text-sm font-semibold text-[var(--body-text)]">Whitening</p>
                </div>
                <div className="rounded-[28px] bg-[var(--surface-strong)] p-4 shadow-sm transition-colors">
                  <Grid className="mx-auto mb-2 h-5 w-5 text-[var(--primary)]" />
                  <p className="text-sm font-semibold text-[var(--body-text)]">Cavity</p>
                </div>
              </div>
              <div className="mt-6 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-muted)]">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                  <span className="font-semibold text-[var(--body-text)]">Last Checked</span>
                  <span>Dr Smith on 10 October 2023 • Prescription <span className="text-[var(--primary)]">#9C672QA1</span></span>
                  <span className="font-semibold text-[var(--body-text)]">Observation</span>
                  <span>Multiple cavities detected in molars; slight enamel erosion observed.</span>
                  <span className="font-semibold text-[var(--body-text)]">Prescription</span>
                  <span>Fluoride toothpaste • Use twice daily • Dental filling appointment scheduled for 20 October 2023.</span>
                </div>
              </div>
            </div>
          </div>
          <aside className="space-y-6 xl:sticky xl:top-6">
            <div className="rounded-[32px] bg-[var(--surface)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-colors">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-[var(--body-text)]">Your Schedule</h2>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface-strong)] p-3 text-[var(--text-muted)]">
                <span>{currentMonthName} {currentDate.getFullYear()}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="rounded-full p-2 transition hover:bg-[var(--surface)]"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="rounded-full p-2 transition hover:bg-[var(--surface)]"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(day => <div key={day}>{day}</div>)}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2 text-center text-sm">
                {getDaysInMonth().map((day, idx) => {
                  const isBlank = day === null
                  const today = isToday(day)
                  const appointment = hasAppointments(day)
                  return (
                    <div
                      key={idx}
                      className={`flex h-10 items-center justify-center rounded-2xl ${isBlank ? 'invisible' : 'transition'} ${appointment ? 'bg-[var(--primary)] text-white shadow-lg shadow-[rgba(56,189,248,0.15)]' : today ? 'border border-[var(--primary)] bg-[var(--surface-muted)] text-[var(--body-text)] font-semibold' : 'bg-[var(--surface-strong)] text-[var(--text-muted)]'}`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 rounded-[28px] bg-[var(--surface-strong)] p-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--body-text)]">{upcomingAppointment.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{upcomingAppointment.date} • {upcomingAppointment.time}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] bg-[var(--surface)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-colors">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-[var(--body-text)]">Dentist Notes</h2>
                <button className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface)]">+ Add new note</button>
              </div>
              <div className="mt-6 rounded-[28px] bg-[var(--surface-strong)] p-4 text-center transition-colors">
                <img
                  src="https://images.unsplash.com/photo-1606813902373-2fa7d690c5d2?auto=format&fit=crop&w=500&q=80"
                  alt="Tooth illustration"
                  className="mx-auto h-36 w-full max-w-[220px] rounded-[28px] object-cover"
                />
              </div>
            </div>
          </aside>
        </div>
        <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} onSubmit={handleBookingSubmit} />
        <footer className="mt-10 rounded-[32px] bg-[var(--surface)] p-6 text-[var(--text-muted)] shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-colors">
          <div className="grid gap-4 md:grid-cols-[1.2fr_auto] md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--primary)]">Clinic details</p>
              <p className="mt-3 text-base font-semibold text-[var(--body-text)]">Dr. Rajeev Pratap Singh</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{clinicAddress}</p>
            </div>
            <div className="rounded-[28px] bg-[var(--surface-strong)] px-5 py-4 text-sm text-[var(--text-muted)] transition-colors">
              <p className="font-semibold text-[var(--body-text)]">Clinic Management Dashboard</p>
              <p className="mt-2 text-[var(--text-muted)]">Keep patient appointments, schedule follow-ups, and review daily performance at a glance.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DentalClientDashboard

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home,
  Calendar as CalendarIcon,
  MessageSquare,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { DashboardService, type DashboardData, type Appointment } from '../services/dashboardService'

const DentalClientDashboard = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme, isDark } = useTheme()
  const [clientData, setClientData] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date()) // Current date
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    const client = localStorage.getItem('clientData')
    if (client) {
      setClientData(JSON.parse(client))
    }

    // Load dashboard data from backend/mock
    loadDashboardData()
  }, [navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const data = await DashboardService.getDashboardData()
      setDashboardData(data)
      // Set current date based on backend data
      setCurrentDate(new Date(data.currentDate.year, data.currentDate.month - 1, 1))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }



  // Get patients from dashboard data or use empty array
  const patients = dashboardData?.todaysAppointments.map((apt: Appointment) => ({
    id: apt.id,
    name: `${apt.first_name} ${apt.last_name}`,
    time: apt.appointment_time.substring(0, 5), // Format HH:MM
    type: apt.appointment_type,
    avatar: apt.gender === 'Male' ? '👨' : '👩',
    color: apt.appointment_type.includes('Routine') ? 'text-orange-500' : 'text-green-500'
  })) || []

  const selectedPatient = {
    name: 'Guy Hawkins',
    gender: 'Male',
    age: 28,
    services: [
      { name: 'Braces', icon: '🦷' },
      { name: 'Whitening', icon: '🦷' },
      { name: 'Cavity', icon: '🦷' }
    ],
    lastChecked: { doctor: 'Dr Smith', date: '10 October 2023', prescription: '#9C672QA1' },
    observation: 'Multiple cavities detected in molars; slight enamel erosion observed.',
    prescription: 'Fluoride Toothpaste - Use twice daily\nDental Filling Appointment - Scheduled for 20 October 2023'
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  // Check if a day has appointments
  const hasAppointments = (day: number) => {
    if (!dashboardData?.calendarData) return false
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dashboardData.calendarData.some(apt => apt.appointment_date === dateStr)
  }

  // Check if day is today
  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear()
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  if (!clientData) return null
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-2xl font-semibold text-gray-600 dark:text-gray-300">Loading dashboard...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🦷</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-sky-600">{clientData.brandName}</h1>
                <p className="text-xs text-gray-500">Professional Dental Care</p>
              </div>
            </div>
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Find Patients or Appointments"
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 mr-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">{clientData.clientName}</div>
                <div className="text-xs text-gray-500">Dental Surgeon</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {clientData.clientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
              </div>
            </div>
            <button className="relative hover:bg-gray-100 p-2 rounded-lg transition">
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-20 bg-white border-r border-gray-200 min-h-screen flex flex-col items-center py-8 gap-6 shadow-sm">
          <button className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all">
            <Home size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-sky-50 rounded-2xl flex items-center justify-center text-gray-600 hover:text-sky-600 transition-all">
            <CalendarIcon size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-sky-50 rounded-2xl flex items-center justify-center text-gray-600 hover:text-sky-600 transition-all">
            <MessageSquare size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-sky-50 rounded-2xl flex items-center justify-center text-gray-600 hover:text-sky-600 transition-all">
            <Users size={24} />
          </button>
          <div className="flex-1"></div>
          <button className="w-12 h-12 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all">
            <Settings size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all">
            <HelpCircle size={24} />
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Greeting */}
          <div className="mb-8">
            <h2 className="text-3xl mb-2">
              Good Morning <span className="text-sky-600 font-bold">{clientData.clientName}</span> 👋
            </h2>
            <p className="text-sm text-gray-500">{clientData.address}</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Patient Visits */}
            <div className="col-span-2 space-y-6">
              {/* Today's Patient Visits Card */}
              <div className="bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 rounded-3xl p-8 shadow-lg border border-sky-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Today's Patient Visits</h3>
                    <div className="text-7xl font-bold mb-2 bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">790</div>
                    <div className="text-gray-600 text-sm font-medium">/person</div>

                    <div className="flex gap-4 mt-6">
                      <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl px-6 py-4 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white text-sm font-medium">New Patients</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white text-4xl font-bold">750</span>
                          <span className="bg-white text-green-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                            51% 📈
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl px-6 py-4 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white text-sm font-medium">Returning Patients</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white text-4xl font-bold">40</span>
                          <span className="bg-white text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                            51% 📉
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-64 h-64 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-cyan-200 rounded-full opacity-30 blur-2xl"></div>
                    <div className="relative text-9xl">🦷</div>
                  </div>
                </div>
              </div>

              {/* Patient List and Consultation */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Patient List</h3>
                  <select className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium hover:border-sky-300 transition focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                  <h3 className="text-xl font-semibold text-gray-800">Consultation</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Patient List */}
                  <div className="space-y-3">
                    {patients.map(patient => (
                      <div key={patient.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-2xl hover:border-sky-300 hover:bg-sky-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full flex items-center justify-center text-2xl shadow-sm">
                            {patient.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{patient.name}</div>
                            <div className={`text-sm font-medium ${patient.color || 'text-green-600'}`}>{patient.type}</div>
                          </div>
                        </div>
                        <div className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl text-sm font-semibold shadow-md">
                          {patient.time}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Consultation Details */}
                  <div>
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                        👨
                      </div>
                      <div>
                        <div className="font-bold text-lg">{selectedPatient.name}</div>
                        <div className="text-gray-500 text-sm">{selectedPatient.gender} - {selectedPatient.age} Years old</div>
                      </div>
                      <button className="ml-auto">
                        <MoreHorizontal className="text-gray-400" />
                      </button>
                    </div>

                    <div className="flex gap-4 mb-6 justify-center">
                      {selectedPatient.services.map((service, idx) => (
                        <div key={idx} className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-2">
                            {service.icon}
                          </div>
                          <div className="text-xs text-gray-600">{service.name}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Last Checked</div>
                        <div className="font-medium">{selectedPatient.lastChecked.doctor} on {selectedPatient.lastChecked.date}</div>
                        <div className="text-blue-500">Prescription {selectedPatient.lastChecked.prescription}</div>
                      </div>

                      <div>
                        <div className="text-gray-500 mb-1">Observation</div>
                        <div className="text-gray-700">{selectedPatient.observation}</div>
                      </div>

                      <div>
                        <div className="text-gray-500 mb-1">Prescription</div>
                        <div className="text-gray-700 whitespace-pre-line">{selectedPatient.prescription}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Schedule & Notes */}
            <div className="space-y-6">
              {/* Calendar */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Your Schedule</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                <div className="text-base font-semibold text-gray-700 mb-4">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>

                <div className="grid grid-cols-7 gap-2 mb-3">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs text-gray-600 font-semibold py-2">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth().map((day, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square flex items-center justify-center text-sm rounded-xl font-medium transition-all
                        ${day === null ? 'invisible' : 'hover:bg-sky-50 cursor-pointer border border-gray-100'}
                        ${day === 12 || day === 15 || day === 23 ? 'bg-gradient-to-br from-sky-600 to-cyan-600 text-white font-bold shadow-md hover:shadow-lg border-0' : 'text-gray-700'}
                      `}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">Upcoming</h4>
                    <button className="text-sky-600 text-sm font-medium hover:text-sky-700">View All</button>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-xl border border-sky-200 hover:shadow-md transition-shadow">
                    <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                      <CalendarIcon size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">Monthly doctor's meet</div>
                      <div className="text-xs text-gray-600 mt-0.5">12 October, 2025 | 08:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dentist Notes */}
              <div className="bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 rounded-3xl p-6 shadow-md border border-sky-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Dentist Notes</h3>
                  <button className="text-sm bg-white border-2 border-sky-500 text-sky-600 px-4 py-2 rounded-lg font-medium hover:bg-sky-50 transition shadow-sm">+ Add new note</button>
                </div>
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-300 to-cyan-300 rounded-full opacity-20 blur-2xl"></div>
                    <div className="relative text-8xl">😊🦷</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DentalClientDashboard

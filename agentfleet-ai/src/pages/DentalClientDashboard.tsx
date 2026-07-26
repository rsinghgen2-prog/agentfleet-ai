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
  MoreHorizontal
} from 'lucide-react'

const DentalClientDashboard = () => {
  const navigate = useNavigate()
  const [clientData, setClientData] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)) // October 2025

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
  }, [navigate])



  const patients = [
    { id: 1, name: 'Guy Hawkins', time: '08:00 AM', type: 'Weekly Visit', avatar: '👨' },
    { id: 2, name: 'Jane Cooper', time: '10:00 AM', type: 'Weekly Visit', avatar: '👩' },
    { id: 3, name: 'Leslie Alexander', time: '14:00 PM', type: 'Weekly Visit', avatar: '👨' },
    { id: 4, name: 'Jenny Wilson', time: '16:00 PM', type: 'Routine Checkup', avatar: '👩', color: 'text-orange-500' }
  ]

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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  if (!clientData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-blue-500">MintDen</h1>
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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              S
            </div>
            <button className="relative">
              <Bell size={24} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-20 bg-white border-r border-gray-200 min-h-screen flex flex-col items-center py-8 gap-6">
          <button className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Home size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
            <CalendarIcon size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
            <MessageSquare size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
            <Users size={24} />
          </button>
          <div className="flex-1"></div>
          <button className="w-12 h-12 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
            <Settings size={24} />
          </button>
          <button className="w-12 h-12 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
            <HelpCircle size={24} />
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Greeting */}
          <h2 className="text-3xl mb-8">
            Good Morning <span className="text-blue-500 font-bold">{clientData.clientName}</span> 👋
          </h2>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Patient Visits */}
            <div className="col-span-2 space-y-6">
              {/* Today's Patient Visits Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Today's Patient Visits</h3>
                    <div className="text-7xl font-bold mb-2">790</div>
                    <div className="text-gray-600 text-sm">/person</div>
                    
                    <div className="flex gap-4 mt-6">
                      <div className="bg-blue-400 rounded-2xl px-6 py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white text-sm">New Patients</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white text-4xl font-bold">750</span>
                          <span className="bg-white text-green-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            51% 📈
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-pink-400 rounded-2xl px-6 py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white text-sm">Returning Patients</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white text-4xl font-bold">40</span>
                          <span className="bg-white text-red-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            51% 📉
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-64 h-64">
                    <img src="https://via.placeholder.com/256x256/E0E7FF/4F46E5?text=🦷" alt="Dental" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Patient List and Consultation */}
              <div className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Patient List</h3>
                  <select className="px-4 py-2 border border-gray-200 rounded-lg">
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                  <h3 className="text-xl font-semibold">Consultation</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Patient List */}
                  <div className="space-y-3">
                    {patients.map(patient => (
                      <div key={patient.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                            {patient.avatar}
                          </div>
                          <div>
                            <div className="font-semibold">{patient.name}</div>
                            <div className={`text-sm ${patient.color || 'text-green-500'}`}>{patient.type}</div>
                          </div>
                        </div>
                        <div className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium">
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
              <div className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Your Schedule</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                      <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                      <ChevronRight size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs text-gray-500 font-medium">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth().map((day, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square flex items-center justify-center text-sm rounded-lg
                        ${day === null ? '' : 'hover:bg-gray-100 cursor-pointer'}
                        ${day === 12 || day === 15 || day === 23 ? 'bg-gray-900 text-white font-bold' : ''}
                      `}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Upcoming</h4>
                    <button className="text-blue-500 text-sm">View All</button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CalendarIcon size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Monthly doctor's meet</div>
                      <div className="text-xs text-gray-500">12 October, 2025 | 08:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dentist Notes */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Dentist Notes</h3>
                  <button className="text-sm border border-gray-900 px-3 py-1 rounded-lg">+ Add new note</button>
                </div>
                <div className="flex items-center justify-center py-8">
                  <img src="https://via.placeholder.com/200x200/BFDBFE/1E40AF?text=😊🦷" alt="Dental Mascot" className="w-48 h-48 object-contain" />
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

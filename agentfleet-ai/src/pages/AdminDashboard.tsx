import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  BarChart3,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bell,
  Search,
  Menu,
  Settings,
  LogOut,
  Sun,
  Moon,
  ShoppingBag
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState<any>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    const registration = localStorage.getItem('userRegistration')
    if (registration) {
      setUserData(JSON.parse(registration))
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userRegistration')
    navigate('/login')
  }

  const metrics = [
    { title: 'Total Patients', value: 180, change: '↑ 10%', trend: 'up', icon: Users, color: 'bg-blue-500' },
    { title: 'Consultation', value: 80, change: '↑ 15%', trend: 'up', icon: Calendar, color: 'bg-blue-400' },
    { title: 'Procedure', value: 50, change: '↓ 8%', trend: 'down', icon: FileText, color: 'bg-blue-300' },
    { title: 'Payment', value: '$1,500', change: '↑ 10%', trend: 'up', icon: DollarSign, color: 'bg-blue-400' }
  ]

  const approvalRequests = [
    { id: '1', name: 'Sophia', treatment: 'Root Canal Treatment', date: '05.12.2024', status: 'pending' },
    { id: '2', name: 'Mason', treatment: 'Consultation', date: '02.12.2024', status: 'pending' },
    { id: '3', name: 'Emily', treatment: 'Scaling', date: '04.12.2024', status: 'pending' },
    { id: '4', name: 'Natalie', treatment: 'Checkup', date: '01.12.2024', status: 'pending' }
  ]

  if (!userData) return null

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={24} className={darkMode ? 'text-gray-300' : 'text-gray-700'} />
            </button>
            
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <MessageSquare size={22} className="text-purple-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Mail size={22} className="text-pink-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <ShoppingBag size={22} className="text-green-500" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 rounded-lg">
              {darkMode ? <Sun size={22} className="text-yellow-500" /> : <Moon size={22} className="text-gray-600" />}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={22} className="text-blue-500" />
            </button>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {userData.fullName?.charAt(0) || 'A'}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={22} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-20 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r border-gray-200 h-screen sticky top-16 flex flex-col items-center py-6 gap-6`}>
          <button className="p-3 bg-blue-500 text-white rounded-lg">
            <BarChart3 size={24} />
          </button>
          <button className="p-3 hover:bg-gray-100 rounded-lg">
            <Clock size={24} className="text-gray-600" />
          </button>
          <button className="p-3 hover:bg-gray-100 rounded-lg">
            <Calendar size={24} className="text-gray-600" />
          </button>
          <button className="p-3 hover:bg-gray-100 rounded-lg">
            <Users size={24} className="text-gray-600" />
          </button>
          <button className="p-3 hover:bg-gray-100 rounded-lg">
            <FileText size={24} className="text-gray-600" />
          </button>
          <button className="p-3 hover:bg-gray-100 rounded-lg">
            <MessageSquare size={24} className="text-gray-600" />
          </button>
          <div className="flex-1"></div>
          <button onClick={handleLogout} className="p-3 hover:bg-red-100 rounded-lg">
            <LogOut size={24} className="text-red-600" />
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Welcome Back, {userData.fullName || 'Doctor'}!
            </h1>
            <select className="px-4 py-2 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50">
              <option>Weekly</option>
              <option selected>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border border-gray-100`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">{metric.title}</span>
                    <div className={`${metric.color} p-2 rounded-lg`}>
                      <Icon size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-2">{metric.value}</div>
                  <div className="flex items-center gap-2">
                    <span className={metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}>{metric.change}</span>
                    <button className="text-sm text-blue-500 border border-blue-500 px-3 py-1 rounded hover:bg-blue-50">
                      View report
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Chart Section */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm mb-8`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Appointment Trends</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span className="text-sm">Net Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <span className="text-sm">Revenue</span>
                </div>
              </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-2">
              {[750, 820, 860, 920, 980, 1040, 1100, 1150, 1200].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex gap-1 items-end" style={{ height: '200px' }}>
                    <div className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(value / 1200) * 100}%` }}></div>
                    <div className="flex-1 bg-green-500 rounded-t" style={{ height: `${((value + 50) / 1250) * 100}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][index]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section - Approvals */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
            <h2 className="text-xl font-bold mb-6">Approval requests</h2>
            <div className="space-y-4">
              {approvalRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {request.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold">{request.name}</div>
                      <div className="text-sm text-gray-500">{request.treatment}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mr-4">{request.date}</div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-green-100 hover:bg-green-200 rounded-lg">
                      <CheckCircle size={18} className="text-green-600" />
                    </button>
                    <button className="p-2 bg-red-100 hover:bg-red-200 rounded-lg">
                      <XCircle size={18} className="text-red-600" />
                    </button>
                    <button className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg">
                      <Mail size={18} className="text-blue-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Plus,
  TrendingUp,
  Activity,
  DollarSign,
  CheckCircle
} from 'lucide-react'

interface UserData {
  fullName: string
  email: string
  businessName: string
  category: string
  subcategory: string
  plan: string
  isSubscribed: boolean
}

interface CurrencyInfo {
  code: string
  symbol: string
  rate: number
}

const IndustryDashboard = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [currency, setCurrency] = useState<CurrencyInfo>({
    code: 'USD',
    symbol: '$',
    rate: 1
  })

  // Auto logout after 30 minutes
  useEffect(() => {
    const loginTime = localStorage.getItem('loginTime')
    if (!loginTime) {
      localStorage.setItem('loginTime', Date.now().toString())
    }

    const checkSessionTimeout = () => {
      const loginTimeStamp = parseInt(localStorage.getItem('loginTime') || '0')
      const currentTime = Date.now()
      const thirtyMinutes = 30 * 60 * 1000

      if (currentTime - loginTimeStamp > thirtyMinutes) {
        handleLogout()
      }
    }

    const interval = setInterval(checkSessionTimeout, 60000)
    return () => clearInterval(interval)
  }, [])

  // Detect currency
  useEffect(() => {
    const cachedCurrency = localStorage.getItem('userCurrency')
    if (cachedCurrency) {
      setCurrency(JSON.parse(cachedCurrency))
    }
  }, [])

  // Load user data
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    const registration = localStorage.getItem('userRegistration')
    if (registration) {
      const data = JSON.parse(registration)
      setUserData(data)
    }

    window.history.pushState(null, '', window.location.href)
    window.onpopstate = function () {
      window.history.pushState(null, '', window.location.href)
    }
  }, [navigate])

  const handleLogout = () => {
    const savedEmail = localStorage.getItem('savedEmail')
    const savedPassword = localStorage.getItem('savedPassword')
    
    localStorage.clear()
    sessionStorage.clear()
    
    if (savedEmail && savedPassword) {
      localStorage.setItem('savedEmail', savedEmail)
      localStorage.setItem('savedPassword', savedPassword)
    }
    
    navigate('/')
  }

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${(amount * currency.rate).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Get dashboard configuration based on category and subcategory
  const getDashboardConfig = () => {
    const category = userData.category
    const subcategory = userData.subcategory

    // Healthcare configurations
    if (category === 'Healthcare') {
      if (subcategory === 'Dental Clinic') {
        return {
          title: 'Dental Practice Dashboard',
          menuItems: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'billing', label: 'Billing & Claims', icon: DollarSign },
            { id: 'treatments', label: 'Treatments', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ]
        }
      }
      // Other healthcare subcategories
      return {
        title: `${subcategory} Dashboard`,
        menuItems: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ]
      }
    }

    // Education configurations
    if (category === 'Education') {
      return {
        title: `${subcategory} Dashboard`,
        menuItems: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'classes', label: 'Classes', icon: Calendar },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
        ]
      }
    }

    // Default configuration
    return {
      title: `${userData.businessName} Dashboard`,
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'contacts', label: 'Contacts', icon: Users },
        { id: 'campaigns', label: 'Campaigns', icon: MessageSquare },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    }
  }

  const config = getDashboardConfig()

  // Get metrics based on industry
  const getMetrics = () => {
    if (userData.category === 'Healthcare' && userData.subcategory === 'Dental Clinic') {
      return [
        { title: 'Patient Enrolled', value: '550', change: '+10%', icon: Users, color: 'blue' },
        { title: 'Non-Complex', value: '500', change: '+8%', icon: Activity, color: 'green' },
        { title: 'Complex', value: '50', change: '+7%', icon: FileText, color: 'orange' },
        { title: 'Compliance', value: '75%', change: '+4%', icon: CheckCircle, color: 'purple' },
        { title: 'Improvement', value: '84%', change: '+28%', icon: TrendingUp, color: 'green' }
      ]
    }

    return [
      { title: 'Total Contacts', value: '1,248', change: '+12%', icon: Users, color: 'blue' },
      { title: 'Campaigns', value: '24', change: '+8%', icon: MessageSquare, color: 'green' },
      { title: 'Revenue', value: formatCurrency(12450), change: '+15%', icon: DollarSign, color: 'purple' }
    ]
  }

  const metrics = getMetrics()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">{userData.businessName}</h1>
          <p className="text-xs text-gray-500 mt-1">{userData.subcategory}</p>
        </div>

        <div className="p-4 border-b bg-blue-50">
          <div className="text-sm font-medium text-gray-800">{userData.fullName}</div>
          <div className="text-xs text-gray-600">{userData.email}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {config.menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id
            return (
              <button key={item.id} onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings size={20} /><span className="text-sm">Settings</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut size={20} /><span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {userData.fullName.split(' ')[0]}</p>
            </div>

            <div className="flex items-center gap-4">
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>January 2025</option>
              </select>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600">
                <Plus size={20} />
                <span className="text-sm font-medium">
                  {userData.category === 'Healthcare' ? 'New Patient' : 'New Contact'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                orange: 'bg-orange-100 text-orange-600',
                purple: 'bg-purple-100 text-purple-600'
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">{metric.title}</span>
                    <div className={`p-2 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-2">{metric.value}</div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp size={16} className="text-green-500" />
                    <span className="text-green-500">{metric.change}</span>
                    <span className="text-gray-500">Since last month</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Healthcare Dental Dashboard */}
          {userData.category === 'Healthcare' && userData.subcategory === 'Dental Clinic' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Program</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'New Enrollments', value: '200' },
                    { label: 'Initial Interview', value: '180' },
                    { label: 'Devices Supplied', value: '150' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">{item.label}</div>
                      <div className="text-2xl font-bold text-gray-800">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90 mb-2">Total Revenue</div>
                <div className="text-3xl font-bold mb-4">{formatCurrency(156873)}</div>
                <div className="text-xs opacity-90">Monthly Performance</div>
              </div>
            </div>
          )}

          {/* Generic Dashboard for other industries */}
          {!(userData.category === 'Healthcare' && userData.subcategory === 'Dental Clinic') && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
              <p className="text-gray-600">Your {userData.subcategory} dashboard content will appear here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default IndustryDashboard

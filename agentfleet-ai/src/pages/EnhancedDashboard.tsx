import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Activity,
  DollarSign,
  ArrowUpRight,
  Bot,
  Zap,
  Send
} from 'lucide-react'

interface UserData {
  fullName: string
  email: string
  plan: string
  isSubscribed: boolean
}

interface CurrencyInfo {
  code: string
  symbol: string
  rate: number
  country: string
}

const EnhancedDashboard = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [currency, setCurrency] = useState<CurrencyInfo>({
    code: 'USD',
    symbol: '$',
    rate: 1,
    country: 'Unknown'
  })

  // Detect user location and set currency
  useEffect(() => {
    const detectCurrencyFromLocation = async () => {
      try {
        // Check if currency is already cached
        const cachedCurrency = localStorage.getItem('userCurrency')
        if (cachedCurrency) {
          setCurrency(JSON.parse(cachedCurrency))
          return
        }

        // Fetch user's location from IP
        const locationResponse = await fetch('https://ipapi.co/json/')
        const locationData = await locationResponse.json()

        const countryCode = locationData.country_code
        const countryName = locationData.country_name

        let currencyInfo: CurrencyInfo = {
          code: 'USD',
          symbol: '$',
          rate: 1,
          country: countryName
        }

        // If India, use INR with live exchange rate
        if (countryCode === 'IN') {
          // Fetch live USD to INR rate
          const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
          const rateData = await rateResponse.json()

          currencyInfo = {
            code: 'INR',
            symbol: '₹',
            rate: rateData.rates.INR,
            country: 'India'
          }
        }
        // Add more countries as needed
        else if (countryCode === 'GB') {
          const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
          const rateData = await rateResponse.json()
          currencyInfo = {
            code: 'GBP',
            symbol: '£',
            rate: rateData.rates.GBP,
            country: 'United Kingdom'
          }
        }
        else if (countryCode === 'EU' || ['DE', 'FR', 'IT', 'ES'].includes(countryCode)) {
          const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
          const rateData = await rateResponse.json()
          currencyInfo = {
            code: 'EUR',
            symbol: '€',
            rate: rateData.rates.EUR,
            country: countryName
          }
        }

        // Cache the currency info for 24 hours
        localStorage.setItem('userCurrency', JSON.stringify(currencyInfo))
        localStorage.setItem('currencyFetchTime', Date.now().toString())

        setCurrency(currencyInfo)
      } catch (error) {
        console.error('Error detecting location/currency:', error)
        // Fallback to USD
        setCurrency({
          code: 'USD',
          symbol: '$',
          rate: 1,
          country: 'United States'
        })
      }
    }

    // Check if currency data is stale (older than 24 hours)
    const currencyFetchTime = localStorage.getItem('currencyFetchTime')
    const twentyFourHours = 24 * 60 * 60 * 1000

    if (!currencyFetchTime || Date.now() - parseInt(currencyFetchTime) > twentyFourHours) {
      detectCurrencyFromLocation()
    } else {
      const cachedCurrency = localStorage.getItem('userCurrency')
      if (cachedCurrency) {
        setCurrency(JSON.parse(cachedCurrency))
      }
    }
  }, [])

  // Auto logout after 30 minutes
  useEffect(() => {
    const loginTime = localStorage.getItem('loginTime')
    if (!loginTime) {
      localStorage.setItem('loginTime', Date.now().toString())
    }

    const checkSessionTimeout = () => {
      const loginTimeStamp = parseInt(localStorage.getItem('loginTime') || '0')
      const currentTime = Date.now()
      const thirtyMinutes = 30 * 60 * 1000 // 30 minutes in milliseconds

      if (currentTime - loginTimeStamp > thirtyMinutes) {
        handleLogout()
      }
    }

    // Check every minute
    const interval = setInterval(checkSessionTimeout, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    // Check if super admin
    const superAdminFlag = localStorage.getItem('isSuperAdmin') === 'true'
    setIsSuperAdmin(superAdminFlag)

    // Load user data
    const registration = localStorage.getItem('userRegistration')
    if (registration) {
      const data = JSON.parse(registration)
      setUserData(data)
    }

    // Disable browser back button
    window.history.pushState(null, '', window.location.href)
    window.onpopstate = function () {
      window.history.pushState(null, '', window.location.href)
    }
  }, [navigate])

  const handleLogout = () => {
    // Save credentials if they exist (don't clear on logout)
    const savedEmail = localStorage.getItem('savedEmail')
    const savedPassword = localStorage.getItem('savedPassword')

    // Clear all localStorage
    localStorage.clear()

    // Clear session storage
    sessionStorage.clear()

    // Restore saved credentials if they existed
    if (savedEmail && savedPassword) {
      localStorage.setItem('savedEmail', savedEmail)
      localStorage.setItem('savedPassword', savedPassword)
    }

    // Redirect to home
    navigate('/')
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const getPlanDetails = () => {
    if (isSuperAdmin) {
      return {
        name: 'Super Admin',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        features: ['All Features', 'Unlimited Access', 'Full Control']
      }
    }

    switch (userData.plan) {
      case 'free':
        return {
          name: 'Free Plan',
          color: 'text-gray-400',
          features: ['100 messages/day', 'Basic analytics', 'Email support']
        }
      case 'starter':
        return {
          name: 'Starter Plan',
          color: 'text-blue-400',
          features: ['1,000 messages/day', 'Advanced analytics', 'Priority support']
        }
      case 'growth':
        return {
          name: 'Growth Plan',
          color: 'text-purple-400',
          features: ['10,000 messages/day', 'API access', 'Custom integrations']
        }
      case 'scale':
        return {
          name: 'Scale Plan',
          color: 'text-yellow-400',
          features: ['Unlimited messages', 'White label', 'Dedicated support']
        }
      default:
        return {
          name: 'Free Plan',
          color: 'text-gray-400',
          features: ['100 messages/day', 'Basic analytics']
        }
    }
  }

  const planDetails = getPlanDetails()

  // Format currency based on location
  const formatCurrency = (amountInUSD: number) => {
    const convertedAmount = amountInUSD * currency.rate
    return `${currency.symbol}${convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }

  const sidebarMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-white">AgentFleet AI</span>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Account</span>
            <div className={`px-2 py-1 rounded text-xs ${planDetails.color} bg-opacity-20`}>
              {planDetails.name}
            </div>
          </div>
          <div className="text-white font-semibold truncate">{userData.fullName}</div>
          <div className="text-gray-500 text-sm truncate">{userData.email}</div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarMenu.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all">
            <Settings size={20} />
            <span>Settings</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-gray-950 border-b border-gray-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back, {userData.fullName.split(' ')[0]}</p>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors relative">
                <Bell className="text-gray-400" size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <HelpCircle className="text-gray-400" size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-900">
          {/* Stats Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Performance Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Revenue</span>
                    <span className="text-xs text-gray-500">({currency.code})</span>
                  </div>
                  <DollarSign className="text-green-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{formatCurrency(2450)}</div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <ArrowUpRight size={16} />
                  <span>+12.5%</span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </motion.div>

              {/* Messages Sent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Messages Sent</span>
                  <MessageSquare className="text-blue-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {userData.plan === 'free' ? '45/100' : '2,459'}
                </div>
                <div className="flex items-center gap-1 text-blue-400 text-sm">
                  <Activity size={16} />
                  <span>{userData.plan === 'free' ? '45% used' : '+8.2%'}</span>
                  <span className="text-gray-500">
                    {userData.plan === 'free' ? 'this month' : 'vs last month'}
                  </span>
                </div>
              </motion.div>

              {/* Active Contacts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Active Contacts</span>
                  <Users className="text-purple-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">1,248</div>
                <div className="flex items-center gap-1 text-purple-400 text-sm">
                  <ArrowUpRight size={16} />
                  <span>+5.3%</span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </motion.div>

              {/* Campaigns */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Active Campaigns</span>
                  <Send className="text-orange-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">8</div>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Activity size={16} />
                  <span>3 running now</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Engagement Metrics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Message Performance */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Message Performance</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Delivery Rate</span>
                      <span className="text-green-400 font-semibold">98.5%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Open Rate</span>
                      <span className="text-blue-400 font-semibold">67.3%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67.3%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Click Rate</span>
                      <span className="text-purple-400 font-semibold">23.8%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '23.8%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Benefits */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Your Plan Benefits</h3>

                <div className="space-y-3">
                  {planDetails.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${
                        isSuperAdmin ? 'bg-red-500/20' :
                        userData.plan === 'free' ? 'bg-gray-700' : 'bg-blue-500/20'
                      } flex items-center justify-center`}>
                        <Zap className={`${planDetails.color}`} size={16} />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {userData.plan === 'free' && (
                  <button
                    onClick={() => navigate('/payment')}
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="space-y-4">
                {[
                  { action: 'Campaign sent', detail: 'Monthly Newsletter - 1,250 recipients', time: '2 hours ago', color: 'text-green-400' },
                  { action: 'New contacts added', detail: '45 contacts imported from CSV', time: '5 hours ago', color: 'text-blue-400' },
                  { action: 'Campaign created', detail: 'Summer Sale Announcement', time: '1 day ago', color: 'text-purple-400' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-700 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${activity.color} mt-2`}></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{activity.action}</div>
                      <div className="text-gray-400 text-sm">{activity.detail}</div>
                    </div>
                    <div className="text-gray-500 text-sm">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EnhancedDashboard

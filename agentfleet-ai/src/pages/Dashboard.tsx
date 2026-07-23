import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  Crown,
  Zap,
  CheckCircle,
  Lock,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Send,
  FileText,
  Target
} from 'lucide-react'

interface UserData {
  fullName: string
  email: string
  phone: string
  businessName: string
  industry: string
  plan: string
  registeredAt: string
  isSubscribed: boolean
  paymentCompleted: boolean
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [stats] = useState({
    messagesSent: 245,
    messagesLimit: 100,
    campaignsActive: 3,
    contactsTotal: 1250,
    deliveryRate: 98.5,
    openRate: 67.3
  })

  useEffect(() => {
    // Prevent browser back button
    window.history.pushState(null, '', window.location.href)
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href)
    }

    return () => {
      window.onpopstate = null
    }
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
    if (!registration) {
      navigate('/register')
      return
    }

    const data = JSON.parse(registration)
    setUserData(data)
  }, [navigate])

  if (!userData) return null

  // Get plan details
  const getPlanDetails = () => {
    // Super Admin override
    if (isSuperAdmin) {
      return {
        name: 'Super Admin',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        icon: Crown,
        features: ['Full System Access', 'All Permissions', 'User Management']
      }
    }

    switch (userData.plan) {
      case 'free':
        return {
          name: 'Free Plan',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          icon: User,
          features: ['Basic', 'Limited Access']
        }
      case 'starter':
        return {
          name: 'Starter Plan',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          icon: Zap,
          features: ['Standard', 'Full Access']
        }
      case 'growth':
        return {
          name: 'Growth Plan',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          icon: TrendingUp,
          features: ['Advanced', 'Premium Access']
        }
      case 'scale':
        return {
          name: 'Scale Plan',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          icon: Crown,
          features: ['Enterprise', 'Unlimited Access']
        }
      default:
        return {
          name: 'Free Plan',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          icon: User,
          features: ['Basic', 'Limited Access']
        }
    }
  }

  const planDetails = getPlanDetails()
  const PlanIcon = planDetails.icon

  // Service availability based on plan
  const services = [
    {
      id: 'automation',
      name: 'Message Automation',
      description: 'Send WhatsApp & SMS campaigns',
      icon: MessageSquare,
      path: '/automation',
      enabled: true, // All plans
      highlight: false
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Deep insights & reporting',
      icon: BarChart3,
      path: '/analytics',
      enabled: isSuperAdmin || userData.plan !== 'free',
      highlight: userData.plan === 'growth' || userData.plan === 'scale' || isSuperAdmin
    },
    {
      id: 'contacts',
      name: 'Contact Management',
      description: 'Organize & segment contacts',
      icon: Users,
      path: '/contacts',
      enabled: true,
      highlight: false
    },
    {
      id: 'campaigns',
      name: 'Campaign Builder',
      description: 'Create multi-channel campaigns',
      icon: Send,
      path: '/campaigns',
      enabled: isSuperAdmin || userData.plan !== 'free',
      highlight: false
    },
    {
      id: 'templates',
      name: 'Message Templates',
      description: 'Pre-built message templates',
      icon: FileText,
      path: '/templates',
      enabled: isSuperAdmin || userData.plan === 'growth' || userData.plan === 'scale',
      highlight: userData.plan === 'growth' || userData.plan === 'scale' || isSuperAdmin
    },
    {
      id: 'api',
      name: 'API Access',
      description: 'Integrate with your systems',
      icon: Target,
      path: '/api-docs',
      enabled: isSuperAdmin || userData.plan === 'scale',
      highlight: userData.plan === 'scale' || isSuperAdmin
    }
  ]

  const handleServiceClick = (service: typeof services[0]) => {
    if (!service.enabled) {
      alert(`This feature is available in ${userData.plan === 'free' ? 'Starter' : 'Growth'} plan and above. Please upgrade!`)
      return
    }
    navigate(service.path)
  }

  const handleUpgrade = () => {
    navigate('/pricing')
  }

  return (
    <div className="min-h-screen bg-background px-4 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
                Welcome back, <span className="gradient-text">{userData.fullName.split(' ')[0]}</span>
                {isSuperAdmin && (
                  <span className="px-4 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-sm font-semibold flex items-center gap-2">
                    <Crown size={16} />
                    SUPER ADMIN
                  </span>
                )}
              </h1>
              <p className="text-gray-400">
                {isSuperAdmin
                  ? 'Full system access with administrator privileges'
                  : "Here's what's happening with your account today."
                }
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - User Info & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Account Information</h2>
                  <p className="text-gray-400 text-sm">Your profile details</p>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 glass-card rounded-lg hover:border-primary/50 transition-all"
                >
                  <Settings size={20} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <User className="text-primary" size={20} />
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="font-semibold">{userData.fullName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <Mail className="text-primary" size={20} />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-semibold text-sm">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <Phone className="text-primary" size={20} />
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-semibold">{userData.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <Building2 className="text-primary" size={20} />
                  <div>
                    <p className="text-xs text-gray-400">Business</p>
                    <p className="font-semibold">{userData.businessName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <Calendar className="text-primary" size={20} />
                  <div>
                    <p className="text-xs text-gray-400">Member Since</p>
                    <p className="font-semibold">
                      {new Date(userData.registeredAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <Target className="text-primary" size={20} />
                  <div>
                    <p className="text-xs text-gray-400">Industry</p>
                    <p className="font-semibold">{userData.industry}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="text-blue-400" size={20} />
                  <p className="text-sm text-gray-400">Messages Sent</p>
                </div>
                <p className="text-3xl font-bold text-blue-400">{stats.messagesSent}</p>
                {userData.plan === 'free' && (
                  <p className="text-xs text-gray-500 mt-1">of {stats.messagesLimit} limit</p>
                )}
              </div>

              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="text-green-400" size={20} />
                  <p className="text-sm text-gray-400">Active Campaigns</p>
                </div>
                <p className="text-3xl font-bold text-green-400">{stats.campaignsActive}</p>
              </div>

              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-purple-400" size={20} />
                  <p className="text-sm text-gray-400">Total Contacts</p>
                </div>
                <p className="text-3xl font-bold text-purple-400">{stats.contactsTotal.toLocaleString()}</p>
              </div>

              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-400" size={20} />
                  <p className="text-sm text-gray-400">Delivery Rate</p>
                </div>
                <p className="text-3xl font-bold text-green-400">{stats.deliveryRate}%</p>
              </div>

              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="text-orange-400" size={20} />
                  <p className="text-sm text-gray-400">Open Rate</p>
                </div>
                <p className="text-3xl font-bold text-orange-400">{stats.openRate}%</p>
              </div>

              <div className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all" onClick={handleUpgrade}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-primary" size={20} />
                  <p className="text-sm text-gray-400">Upgrade</p>
                </div>
                <p className="text-lg font-bold text-primary">Get More</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Subscription Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Subscription Status */}
            <div className={`glass-card rounded-2xl p-6 border-2 ${userData.isSubscribed ? 'border-primary/50' : 'border-yellow-500/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 ${planDetails.bgColor} rounded-xl`}>
                  <PlanIcon className={planDetails.color} size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Plan</p>
                  <h3 className={`text-xl font-bold ${planDetails.color}`}>{planDetails.name}</h3>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {planDetails.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={16} />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {userData.plan === 'free' ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpgrade}
                  className="w-full py-3 bg-gradient-primary rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
                >
                  Upgrade Now
                </motion.button>
              ) : (
                <div className="space-y-2">
                  {userData.paymentCompleted ? (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        Active Subscription
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm mb-2">Payment Pending</p>
                      <button
                        onClick={() => navigate('/payment')}
                        className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm font-semibold transition-all"
                      >
                        Complete Payment
                      </button>
                    </div>
                  )}
                  <button
                    className="w-full py-2 glass-card rounded-lg text-sm hover:border-primary/50 transition-all"
                    onClick={() => navigate('/subscription')}
                  >
                    Manage Subscription
                  </button>
                </div>
              )}
            </div>

            {/* Payment Info */}
            {userData.paymentCompleted && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="text-primary" size={20} />
                  <h3 className="font-bold">Payment Method</h3>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Method</p>
                  <p className="font-semibold capitalize">{userData.paymentCompleted ? 'Active' : 'None'}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Services Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-1">Your Services</h2>
              <p className="text-gray-400">Access your tools and features</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => {
              const ServiceIcon = service.icon
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  onClick={() => handleServiceClick(service)}
                  className={`glass-card rounded-2xl p-6 cursor-pointer transition-all group relative overflow-hidden ${
                    service.enabled
                      ? 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20'
                      : 'opacity-50 cursor-not-allowed'
                  } ${service.highlight ? 'border-primary/30' : ''}`}
                >
                  {!service.enabled && (
                    <div className="absolute top-4 right-4">
                      <Lock className="text-gray-500" size={20} />
                    </div>
                  )}

                  {service.highlight && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-primary rounded-bl-xl text-xs font-bold">
                      PREMIUM
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    service.enabled ? 'bg-primary/20' : 'bg-gray-500/20'
                  }`}>
                    <ServiceIcon className={service.enabled ? 'text-primary' : 'text-gray-500'} size={24} />
                  </div>

                  <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{service.description}</p>

                  {service.enabled ? (
                    <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                      <span className="text-sm font-semibold">Access Now</span>
                      <ArrowRight size={16} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Lock size={14} />
                      <span className="text-sm">Upgrade Required</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Upgrade Banner for Free Users */}
        {!isSuperAdmin && userData.plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 glass-card rounded-2xl p-8 border-2 border-primary/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-2">
                    Unlock More Features with <span className="gradient-text">Premium</span>
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-2xl">
                    Upgrade to Starter plan and get unlimited messages, advanced analytics, and priority support.
                    Start sending unlimited campaigns today!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUpgrade}
                    className="px-8 py-4 bg-gradient-primary rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-primary/50 transition-all inline-flex items-center gap-2"
                  >
                    <Crown size={20} />
                    Upgrade to Starter - $299/month
                  </motion.button>
                </div>
                <Zap className="text-primary opacity-20" size={120} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

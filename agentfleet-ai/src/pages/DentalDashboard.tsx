import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Phone,
  Stethoscope,
  Pill,
  FileText,
  Settings,
  Bell,
  Search,
  Filter,
  Edit,
  Eye,
  UserCheck,
  Sparkles,
  Smile
} from 'lucide-react'

interface Appointment {
  id: string
  patientName: string
  time: string
  type: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  doctor: string
}

interface Patient {
  id: string
  name: string
  age: number
  lastVisit: string
  nextAppointment: string
  status: string
  phone: string
}

const DentalDashboard = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Mock data
  const stats = {
    todayAppointments: 24,
    todayCompleted: 12,
    waitingPatients: 5,
    totalPatients: 1247,
    monthlyRevenue: 125480,
    revenueGrowth: 12.5,
    satisfactionRate: 98.5,
    avgWaitTime: 15
  }

  const todayAppointments: Appointment[] = [
    {
      id: '1',
      patientName: 'Sarah Johnson',
      time: '09:00 AM',
      type: 'Root Canal',
      status: 'completed',
      doctor: 'Dr. Smith'
    },
    {
      id: '2',
      patientName: 'Michael Brown',
      time: '09:30 AM',
      type: 'Cleaning',
      status: 'in-progress',
      doctor: 'Dr. Davis'
    },
    {
      id: '3',
      patientName: 'Emily Davis',
      time: '10:00 AM',
      type: 'Consultation',
      status: 'scheduled',
      doctor: 'Dr. Smith'
    },
    {
      id: '4',
      patientName: 'James Wilson',
      time: '10:30 AM',
      type: 'Filling',
      status: 'scheduled',
      doctor: 'Dr. Johnson'
    },
    {
      id: '5',
      patientName: 'Lisa Anderson',
      time: '11:00 AM',
      type: 'Crown Placement',
      status: 'scheduled',
      doctor: 'Dr. Smith'
    }
  ]

  const recentPatients: Patient[] = [
    {
      id: 'P001',
      name: 'John Smith',
      age: 45,
      lastVisit: '2026-07-20',
      nextAppointment: '2026-08-20',
      status: 'Active',
      phone: '+1 234-567-8901'
    },
    {
      id: 'P002',
      name: 'Emma Wilson',
      age: 32,
      lastVisit: '2026-07-19',
      nextAppointment: '2026-07-25',
      status: 'Active',
      phone: '+1 234-567-8902'
    },
    {
      id: 'P003',
      name: 'Robert Brown',
      age: 58,
      lastVisit: '2026-07-18',
      nextAppointment: 'Not Scheduled',
      status: 'Follow-up Needed',
      phone: '+1 234-567-8903'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />
      case 'in-progress':
        return <Activity size={16} className="animate-pulse" />
      case 'scheduled':
        return <Clock size={16} />
      case 'cancelled':
        return <XCircle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  const quickActions = [
    {
      id: 'new-appointment',
      label: 'New Appointment',
      icon: Calendar,
      color: 'bg-blue-500',
      action: () => navigate('/dental/appointments/new')
    },
    {
      id: 'add-patient',
      label: 'Add Patient',
      icon: UserCheck,
      color: 'bg-green-500',
      action: () => navigate('/dental/patients/new')
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      icon: Pill,
      color: 'bg-purple-500',
      action: () => navigate('/dental/prescriptions')
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      color: 'bg-orange-500',
      action: () => navigate('/dental/reports')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Hospital Name */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Smile className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SmileCare Dental</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Advanced Dental Care Center</p>
              </div>
            </div>

            {/* Current Time & Date */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Notifications */}
              <button className="relative p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all">
                <Bell className="text-gray-600 dark:text-gray-300" size={22} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {/* Settings */}
              <button className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all">
                <Settings className="text-gray-600 dark:text-gray-300" size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="text-blue-500" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                Today
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.todayAppointments}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Appointments Scheduled</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.todayCompleted / stats.todayAppointments) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{stats.todayCompleted}/{stats.todayAppointments}</span>
            </div>
          </motion.div>

          {/* Waiting Patients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Users className="text-orange-500" size={24} />
              </div>
              <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full animate-pulse">
                Live
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.waitingPatients}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Patients Waiting</p>
            <div className="mt-4 flex items-center gap-1 text-sm text-orange-600">
              <Clock size={14} />
              <span>Avg wait: {stats.avgWaitTime} min</span>
            </div>
          </motion.div>

          {/* Total Patients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="text-green-500" size={24} />
              </div>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalPatients.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
            <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={14} />
              <span>+{stats.revenueGrowth}% this month</span>
            </div>
          </motion.div>

          {/* Monthly Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="text-white" size={24} />
              </div>
              <Sparkles className="text-white/80" size={20} />
            </div>
            <h3 className="text-3xl font-bold mb-1">
              ${(stats.monthlyRevenue / 1000).toFixed(1)}K
            </h3>
            <p className="text-sm text-white/80">Monthly Revenue</p>
            <div className="mt-4 flex items-center gap-1 text-sm text-white/90">
              <TrendingUp size={14} />
              <span>+{stats.revenueGrowth}% from last month</span>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={20} />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  onClick={action.action}
                  className={`${action.color} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group`}
                >
                  <Icon className="mb-3 group-hover:scale-110 transition-transform" size={32} />
                  <p className="font-semibold">{action.label}</p>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="text-blue-500" size={24} />
                    Today's Appointments
                  </h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                      <Filter size={18} className="text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Appointments List */}
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {todayAppointments.map((appointment, idx) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center justify-center bg-blue-500/10 rounded-lg px-3 py-2 min-w-[70px]">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                          {appointment.time.split(' ')[1]}
                        </span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {appointment.time.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{appointment.patientName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.type}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <Stethoscope size={12} className="inline mr-1" />
                          {appointment.doctor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status.replace('-', ' ').toUpperCase()}
                      </span>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-blue-500/10 rounded-lg transition-all">
                          <Eye size={16} className="text-blue-500" />
                        </button>
                        <button className="p-2 hover:bg-green-500/10 rounded-lg transition-all">
                          <Edit size={16} className="text-green-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Patients */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="text-green-500" size={20} />
                Recent Patients
              </h3>
              <div className="space-y-3">
                {recentPatients.map((patient, idx) => (
                  <motion.div
                    key={patient.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + idx * 0.1 }}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{patient.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {patient.id} • Age: {patient.age}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <Phone size={10} className="inline mr-1" />
                          {patient.phone}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        patient.status === 'Active'
                          ? 'bg-green-500/20 text-green-600'
                          : 'bg-orange-500/20 text-orange-600'
                      }`}>
                        {patient.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all">
                View All Patients
              </button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity size={20} />
                Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Patient Satisfaction</span>
                    <span className="text-lg font-bold">{stats.satisfactionRate}%</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: `${stats.satisfactionRate}%` }} />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{stats.todayCompleted}</p>
                      <p className="text-xs text-white/70">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.avgWaitTime}m</p>
                      <p className="text-xs text-white/70">Avg Wait</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DentalDashboard

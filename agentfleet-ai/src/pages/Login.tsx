import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowLeft, Sparkles, AlertCircle, Check } from 'lucide-react'
import { SUPER_ADMIN, validateSuperAdmin } from '../config/superAdmin'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')
    const savedPassword = localStorage.getItem('savedPassword')

    if (savedEmail && savedPassword) {
      setFormData({
        email: savedEmail,
        password: savedPassword
      })
      setRememberMe(true)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Save or clear credentials based on Remember Me checkbox
    if (rememberMe) {
      localStorage.setItem('savedEmail', formData.email)
      localStorage.setItem('savedPassword', formData.password)
    } else {
      localStorage.removeItem('savedEmail')
      localStorage.removeItem('savedPassword')
    }

    // Check if super admin login
    if (validateSuperAdmin(formData.email, formData.password)) {
      // Create super admin session
      localStorage.setItem('userRegistration', JSON.stringify(SUPER_ADMIN))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('currentUser', formData.email)
      localStorage.setItem('isSuperAdmin', 'true')

      // Redirect to dashboard
      navigate('/dashboard')
      return
    }

    // Regular user login
    const storedRegistration = localStorage.getItem('userRegistration')

    if (!storedRegistration) {
      setError('No account found. Please register first.')
      return
    }

    const userData = JSON.parse(storedRegistration)

    // Validate credentials
    if (formData.email !== userData.email) {
      setError('Invalid email or password')
      return
    }

    if (formData.password !== userData.password) {
      setError('Invalid email or password')
      return
    }

    // Set login session
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('currentUser', formData.email)
    localStorage.removeItem('isSuperAdmin') // Ensure not super admin

    // Check if payment is pending
    if (!userData.paymentCompleted && userData.plan !== 'free') {
      // Redirect to payment page
      navigate('/payment')
      return
    }

    // Determine dashboard based on industry
    let dashboardRoute = '/dashboard'

    if (userData.industry === 'Dental' || userData.industry === 'Healthcare') {
      dashboardRoute = '/dental-dashboard'
    } else if (userData.industry === 'School' || userData.industry === 'Education') {
      dashboardRoute = '/school-dashboard'  // Create this later
    } else {
      dashboardRoute = '/dashboard'
    }

    // Redirect to appropriate dashboard (NOT homepage)
    navigate(dashboardRoute)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="text-primary" size={32} />
            <h1 className="text-4xl md:text-5xl font-bold">
              Welcome <span className="gradient-text">Back</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Sign in to your SMS Automation account
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="text-red-400" size={20} />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                  required
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    rememberMe
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-600 hover:border-blue-500'
                  }`}
                >
                  {rememberMe && <Check size={14} className="text-white" />}
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Remember my credentials
                </span>
              </label>

              {/* Forgot Password */}
              <button
                type="button"
                onClick={() => alert('Password reset feature coming soon!')}
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-primary rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Sign In
            </motion.button>
          </form>
        </motion.div>

        {/* Register Link */}
        <p className="text-center mt-6 text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-primary hover:underline font-semibold"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login

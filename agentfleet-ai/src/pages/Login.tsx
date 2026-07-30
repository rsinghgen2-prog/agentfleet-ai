import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowLeft, Sparkles, AlertCircle, Check, Moon, Sun } from 'lucide-react'
import { SUPER_ADMIN, validateSuperAdmin } from '../config/superAdmin'
import { getClientByEmail, validateClient } from '../config/clients'
import { useTheme } from '../context/ThemeContext'

const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')

const getAuthErrorMessage = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : 'Unable to reach authentication service'
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Authentication service is unreachable. Configure VITE_AUTH_API_URL for this deployment and verify the auth service is online.'
  }
  return message
}

const Login = () => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')
    localStorage.removeItem('savedPassword')

    if (savedEmail) {
      setFormData({
        email: savedEmail,
        password: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    // Do not let a previous tenant's token authorize this login attempt.
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    // Save or clear credentials based on Remember Me checkbox
    if (rememberMe) {
      localStorage.setItem('savedEmail', email)
    } else {
      localStorage.removeItem('savedEmail')
    }

    // 1. Check if Super Admin
    if (validateSuperAdmin(email, password)) {
      localStorage.setItem('userRegistration', JSON.stringify(SUPER_ADMIN))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('currentUser', email)
      localStorage.setItem('isSuperAdmin', 'true')
      localStorage.setItem('userType', 'super-admin')
      navigate('/dashboard')
      return
    }

    // 2. Check if Client (Multi-tenant)
    const client = getClientByEmail(email)
    if (client) {
      let authenticated = false
      try {
        if (!AUTH_API_URL) {
          throw new Error('Authentication service URL is not configured')
        }
        const authResponse = await fetch(`${AUTH_API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, tenantSlug: client.tenantSlug }),
        })
        const authBody = await authResponse.json().catch(() => ({}))
        if (authResponse.ok && authBody.data?.tokens?.accessToken) {
          localStorage.setItem('accessToken', authBody.data.tokens.accessToken)
          if (authBody.data.tokens.refreshToken) localStorage.setItem('refreshToken', authBody.data.tokens.refreshToken)
          authenticated = true
        } else if (!DEMO_MODE) {
          throw new Error(authBody.message || 'Authentication service rejected the login')
        }
      } catch (authError) {
        if (!DEMO_MODE) {
          setError(getAuthErrorMessage(authError))
          return
        }
      }
      if (!authenticated && !validateClient(email, password)) {
        setError('Invalid email or password')
        return
      }
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userType', 'client')
      localStorage.setItem('clientData', JSON.stringify(client))
      localStorage.setItem('currentUser', email)

      // Route to appropriate client dashboard based on dashboard type
      const dashboardRoute = client.dashboardType === 'dental' ? '/dental-client' : '/admin-dashboard'
      navigate(dashboardRoute)
      return
    }

    // 3. Regular user login
    const storedRegistration = localStorage.getItem('userRegistration')

    if (!storedRegistration) {
      setError('No account found. Please register first.')
      return
    }

    const userData = JSON.parse(storedRegistration)

    // Validate credentials
    if (email !== String(userData.email).trim().toLowerCase()) {
      setError('Invalid email or password')
      return
    }

    if (password !== userData.password) {
      setError('Invalid email or password')
      return
    }

    // Set login session
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('currentUser', email)
    localStorage.setItem('userType', 'registered-user')
    localStorage.removeItem('isSuperAdmin')

    // Check if payment is pending
    if (!userData.paymentCompleted && userData.plan !== 'free') {
      navigate('/payment')
      return
    }

    // Redirect to admin dashboard for registered users
    navigate('/admin-dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--body-bg)] text-[var(--body-text)] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[var(--text-muted)] transition-colors hover:text-[var(--body-text)]"
          >
            <ArrowLeft size={20} /> Back to Home
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--body-text)] shadow-sm transition hover:border-[var(--primary)]"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

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
          <p className="text-[var(--text-muted)] text-lg">
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
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 pl-12 pr-4 text-[var(--body-text)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 pl-12 pr-4 text-[var(--body-text)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
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
                <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--body-text)] transition-colors">
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
        <p className="text-center mt-6 text-[var(--text-muted)]">
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

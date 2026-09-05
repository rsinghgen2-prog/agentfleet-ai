import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowLeft, Sparkles, AlertCircle, Check, Moon, Sun } from 'lucide-react'
import { SUPER_ADMIN, validateSuperAdmin } from '../config/superAdmin'
import { getClientByEmail, validateClient } from '../config/clients'
import { useTheme } from '../context/ThemeContext'
import { decodeJWT, jwtToUserRegistration } from '../utils/jwtUtils'
import { AUTH_API_URL } from '../config/api'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

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
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [resetTenant, setResetTenant] = useState('vps-dental')
  const [resetMessage, setResetMessage] = useState('')
  const [resetting, setResetting] = useState(false)

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

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault(); setResetMessage(''); setError('')
    if (resetPassword !== resetConfirmation) { setResetMessage('Passwords do not match.'); return }
    setResetting(true)
    try {
      const response = await fetch(`${AUTH_API_URL}/api/v1/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail.trim().toLowerCase(), tenantSlug: resetTenant, newPassword: resetPassword }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Unable to reset password')
      setResetMessage('Password reset successfully. You can sign in now.'); setResetPassword(''); setResetConfirmation(''); setFormData((current) => ({ ...current, email: resetEmail.trim().toLowerCase() }))
    } catch (reason) { setResetMessage(getAuthErrorMessage(reason)) } finally { setResetting(false) }
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

    // 2. Check if Client (Pre-configured)
    const client = getClientByEmail(email)
    if (client) {
      let authenticated = false
      let accessToken: string = ''
      let authFullName = ''
      try {
        if (!import.meta.env.DEV && !AUTH_API_URL) {
          throw new Error('Authentication service URL is not configured')
        }
        const authResponse = await fetch(`${AUTH_API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, tenantSlug: client.tenantSlug }),
        })
        const authBody = await authResponse.json().catch(() => ({}))
        if (authResponse.ok && authBody.data?.tokens?.accessToken) {
          accessToken = authBody.data.tokens.accessToken || ''
          authFullName = authBody.data?.user?.fullName || ''
          localStorage.setItem('accessToken', accessToken)
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
      
      // Extract user data from JWT token
      if (accessToken) {
        const payload = decodeJWT(accessToken)
        if (payload) {
          const userRegistration = jwtToUserRegistration(payload)
          localStorage.setItem('userRegistration', JSON.stringify(userRegistration))
          authFullName = authFullName || userRegistration.fullName || ''
        }
      }
      
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userType', 'client')
      localStorage.setItem('clientData', JSON.stringify({
        ...client,
        clientName: client.clientName || authFullName || 'Doctor',
      }))
      localStorage.setItem('currentUser', email)

      // Route to appropriate client dashboard based on dashboard type
      const dashboardRoute = client.dashboardType === 'dental' ? '/dental-client' : '/admin-dashboard'
      navigate(dashboardRoute)
      return
    }

    // 3. Try tenant user login (from database, not pre-configured)
    try {
      if (!import.meta.env.DEV && !AUTH_API_URL) {
        throw new Error('Authentication service URL is not configured')
      }
      
      // Determine tenant slug from known tenants or try common ones
      const knownTenants = ['vps-dental', 'abc-dental']
      let authenticated = false
      let accessToken: string = ''
      let lastError: string = ''
      
      for (const tenantSlug of knownTenants) {
        try {
          const authResponse = await fetch(`${AUTH_API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, tenantSlug }),
          })
          const authBody = await authResponse.json().catch(() => ({}))
          
          if (authResponse.ok && authBody.data?.tokens?.accessToken) {
            accessToken = authBody.data.tokens.accessToken || ''
            localStorage.setItem('accessToken', accessToken)
            if (authBody.data.tokens.refreshToken) localStorage.setItem('refreshToken', authBody.data.tokens.refreshToken)
            authenticated = true
            break
          } else if (authResponse.status !== 404) {
            lastError = authBody.message || 'Login failed'
          }
        } catch {
          // Try next tenant
          continue
        }
      }
      
      if (!authenticated) {
        if (lastError) {
          setError(lastError)
        } else {
          setError('Invalid email or password')
        }
        return
      }
      
      // Extract user data from JWT token
      if (accessToken) {
        const payload = decodeJWT(accessToken)
        if (payload) {
          const userRegistration = jwtToUserRegistration(payload)
          localStorage.setItem('userRegistration', JSON.stringify(userRegistration))
        }
      }
      
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userType', 'client')
      localStorage.setItem('currentUser', email)
      const matchedClient = getClientByEmail(email)
      if (matchedClient) localStorage.setItem('clientData', JSON.stringify(matchedClient))
      navigate('/dental-client')
      return
    } catch (authError) {
      if (!DEMO_MODE) {
        setError(getAuthErrorMessage(authError))
        return
      }
    }

    // 4. Regular user login (fallback to stored registration)
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
                onClick={() => { setResetOpen(true); setResetMessage('') }}
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

        {resetOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold">Reset password</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Enter your tenant, email, and matching new password.</p></div><button type="button" onClick={() => setResetOpen(false)} className="text-sm text-[var(--text-muted)] hover:text-[var(--body-text)]">Close</button></div><form onSubmit={handlePasswordReset} className="space-y-4"><label className="block text-sm font-semibold">Tenant<select value={resetTenant} onChange={(event) => setResetTenant(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-[var(--body-text)]"><option value="vps-dental">V.P.S. Dental &amp; Oral Care</option><option value="abc-dental">ABC Dental Care</option></select></label><label className="block text-sm font-semibold">Email<input type="email" required value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-[var(--body-text)]" /></label><label className="block text-sm font-semibold">New password<input type="password" minLength={8} required value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="At least 8 characters" className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-[var(--body-text)]" /></label><label className="block text-sm font-semibold">Confirm password<input type="password" minLength={8} required value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} placeholder="Re-enter new password" className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-[var(--body-text)]" /></label>{resetMessage && <p role="status" className={`text-sm ${resetMessage.includes('successfully') ? 'text-emerald-600' : 'text-red-500'}`}>{resetMessage}</p>}<button disabled={resetting} className="w-full rounded-lg bg-gradient-primary py-3 font-semibold text-white disabled:opacity-50">{resetting ? 'Resetting...' : 'Reset password'}</button></form></div></div>}

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

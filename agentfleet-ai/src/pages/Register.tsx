import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  CheckCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

const Register = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',

    // Business Info
    businessName: '',
    industry: '',

    // Account Info
    password: '',
    confirmPassword: '',

    // Subscription
    plan: 'free'
  })

  const industries = [
    'E-commerce',
    'Healthcare',
    'Education',
    'Real Estate',
    'Restaurant/Food',
    'Retail',
    'Financial Services',
    'Technology',
    'Other'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        alert('Please fill in all personal information fields')
        return
      }
    } else if (step === 2) {
      if (!formData.businessName || !formData.industry) {
        alert('Please fill in all business information fields')
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    // Save registration data
    localStorage.setItem('userRegistration', JSON.stringify({
      ...formData,
      registeredAt: new Date().toISOString(),
      isSubscribed: formData.plan !== 'free',
      paymentCompleted: formData.plan === 'free', // Free plan doesn't need payment
    }))

    // Set login session
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('currentUser', formData.email)

    // Redirect based on plan
    if (formData.plan === 'free') {
      navigate('/dashboard')
    } else {
      navigate('/payment')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full">
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
              Get Started with <span className="gradient-text">SMS Automation</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Create your account in 3 simple steps
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s ? 'bg-gradient-primary text-white' : 'glass-card text-gray-400'
              }`}>
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 rounded-full transition-all ${
                  step > s ? 'bg-gradient-primary' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8"
        >

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <User className="text-primary" size={24} />
                  Personal Information
                </h2>

                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Email Address *</label>
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

                <div>
                  <label className="block text-sm font-semibold mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-primary rounded-lg font-semibold text-lg"
                >
                  Next Step →
                </motion.button>
              </motion.div>
            )}

            {/* Step 2: Business Information */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Building2 className="text-primary" size={24} />
                  Business Information
                </h2>

                <div>
                  <label className="block text-sm font-semibold mb-2">Business Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Acme Corporation"
                      className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Industry *</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 glass-card rounded-lg text-white"
                    required
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry} className="bg-gray-900">
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    onClick={handleBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 glass-card rounded-lg font-semibold text-lg hover:border-primary/50 transition-all"
                  >
                    ← Back
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 bg-gradient-primary rounded-lg font-semibold text-lg"
                  >
                    Next Step →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Account Setup */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Lock className="text-primary" size={24} />
                  Account Setup
                </h2>

                <div>
                  <label className="block text-sm font-semibold mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min. 8 characters"
                      className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold mb-2">Choose Your Plan</label>

                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, plan: 'free' })}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        formData.plan === 'free'
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 hover:border-primary/50'
                      }`}
                    >
                      <h3 className="font-bold text-xl mb-2">Free Plan</h3>
                      <p className="text-3xl font-bold mb-2 text-primary">$0/month</p>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li>✓ 100 messages/day</li>
                        <li>✓ WhatsApp & SMS</li>
                        <li>✓ Basic analytics</li>
                        <li>✓ Email support</li>
                      </ul>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, plan: 'starter' })}
                      className={`p-6 rounded-xl border-2 transition-all text-left relative ${
                        formData.plan === 'starter'
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 hover:border-primary/50'
                      }`}
                    >
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-primary rounded-full text-xs font-bold">
                        POPULAR
                      </div>
                      <h3 className="font-bold text-xl mb-2">Starter Plan</h3>
                      <p className="text-3xl font-bold mb-2 text-primary">$299/month</p>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li>✓ Unlimited messages</li>
                        <li>✓ WhatsApp & SMS</li>
                        <li>✓ Advanced analytics</li>
                        <li>✓ Priority support</li>
                      </ul>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    ℹ️ You can upgrade or downgrade your plan anytime from your dashboard.
                  </p>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    onClick={handleBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 glass-card rounded-lg font-semibold text-lg hover:border-primary/50 transition-all"
                  >
                    ← Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 bg-gradient-primary rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
                  >
                    Create Account 🚀
                  </motion.button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Login Link */}
        <p className="text-center mt-6 text-gray-400">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:underline font-semibold"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}

export default Register
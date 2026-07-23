import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Mail, Phone, Building2, Users, MessageSquare, ArrowLeft, Check, Video } from 'lucide-react'

const BookDemo = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    companySize: '',
    industry: '',
    message: '',
    date: '',
    time: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ]

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ]

  const industries = [
    'Healthcare',
    'Dental Clinics',
    'Real Estate',
    'Law Firms',
    'Restaurants',
    'Home Services',
    'Insurance',
    'Other'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Generate Zoom meeting link (in production, this would be generated server-side)
    const zoomLink = `https://zoom.us/j/demo-${Date.now()}`

    // Store zoom link in localStorage for confirmation
    localStorage.setItem('zoomLink', zoomLink)
    localStorage.setItem('demoData', JSON.stringify(formData))

    setSubmitted(true)
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  if (submitted) {
    const zoomLink = localStorage.getItem('zoomLink') || ''

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full glass-card rounded-3xl p-8 md:p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check size={40} className="text-green-400" />
          </motion.div>

          <h1 className="text-4xl font-bold mb-4">Demo Scheduled Successfully! 🎉</h1>
          <p className="text-xl text-gray-300 mb-8">
            We're excited to show you how AgentFleet AI can transform your business.
          </p>

          <div className="glass-card rounded-2xl p-6 text-left mb-8">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar className="text-primary" size={20} />
              Meeting Details
            </h3>
            <div className="space-y-3 text-gray-300">
              <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Company:</strong> {formData.company}</p>
              <p><strong>Date:</strong> {formData.date}</p>
              <p><strong>Time:</strong> {formData.time}</p>
              <p><strong>Duration:</strong> 30 minutes</p>
              <div className="pt-4 border-t border-white/10">
                <p className="flex items-center gap-2 mb-2">
                  <Video className="text-accent" size={20} />
                  <strong>Zoom Meeting Link:</strong>
                </p>
                <a
                  href={zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 break-all underline"
                >
                  {zoomLink}
                </a>
                <p className="text-sm text-gray-400 mt-2">
                  Click the link above to join the meeting at scheduled time
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8 text-sm text-gray-300">
            <p>✉️ A confirmation email with the Zoom link and calendar invite has been sent to <strong>{formData.email}</strong></p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToHome}
            className="px-8 py-3 bg-gradient-primary rounded-lg font-semibold flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={20} /> Back to Home
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <button
            onClick={handleBackToHome}
            className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft size={20} /> Back to Home
          </button>
          <h1 className="text-5xl font-bold mb-4">
            Book Your <span className="gradient-text">Free Demo</span>
          </h1>
          <p className="text-xl text-gray-300">
            See AgentFleet AI in action. Schedule a 30-minute personalized demo with our team.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <User size={16} className="text-primary" />
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white"
                placeholder="Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                Work Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white"
                placeholder="john@company.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                Company Name *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white"
                placeholder="Your Company"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Company Size *
              </label>
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white bg-background"
              >
                <option value="">Select size</option>
                {companySizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-semibold mb-2">Industry *</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white bg-background"
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Preferred Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white bg-background"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Preferred Time *
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white bg-background"
              >
                <option value="">Select time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Message */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              What would you like to discuss? (Optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 glass-card rounded-lg focus:outline-none focus:border-primary/50 transition-all text-white resize-none"
              placeholder="Tell us about your needs and what you'd like to see in the demo..."
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-primary rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center justify-center gap-2"
          >
            <Calendar size={20} />
            Schedule My Demo
          </motion.button>

          <p className="text-center text-sm text-gray-400 mt-6">
            By submitting this form, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.form>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Video size={24} className="text-primary" />
            </div>
            <h3 className="font-bold mb-2">Live Demo</h3>
            <p className="text-sm text-gray-400">See AgentFleet AI in action with personalized examples</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-secondary" />
            </div>
            <h3 className="font-bold mb-2">Expert Guidance</h3>
            <p className="text-sm text-gray-400">Get answers from our AI automation specialists</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-accent" />
            </div>
            <h3 className="font-bold mb-2">Custom Solutions</h3>
            <p className="text-sm text-gray-400">Learn how we can tailor AI agents for your business</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default BookDemo

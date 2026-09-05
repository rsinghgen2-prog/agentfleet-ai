import { useMemo, useState } from 'react'
import { X, User, Phone, Mail, Calendar, Clock, FileText, CheckCircle } from 'lucide-react'
import { useDentalDashboardData } from '../hooks/useDentalDashboardData'
import { appointmentBuffer, appointmentDuration, clinicTimeSlots } from '../utils/clinicSchedule'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (bookingData: BookingFormData) => Promise<void> | void
}

export interface BookingFormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  dateOfBirth: string
  gender: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: string
  reason: string
  notes: string
  duration?: number
}

export const BookingModal = ({ isOpen, onClose, onSubmit }: BookingModalProps) => {
  const { settings } = useDentalDashboardData()
  const clinicName = settings?.clinic_name || 'Dental Clinic'
  const duration = appointmentDuration(settings)
  const buffer = appointmentBuffer(settings)
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'Male',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'Checkup',
    reason: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Partial<BookingFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const appointmentTypes = [
    'Checkup', 'Cleaning', 'Cavity Filling', 'Root Canal', 
    'Teeth Whitening', 'Braces Adjustment', 'Emergency', 'Consultation'
  ]

  const timeSlots = useMemo(
    () => clinicTimeSlots(settings?.working_hours, formData.appointmentDate || new Date(), duration, buffer),
    [settings, formData.appointmentDate, duration, buffer],
  )

  const validateForm = () => {
    const newErrors: Partial<BookingFormData> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    else if (!/^[\d\s\-+()]+$/.test(formData.phone)) newErrors.phone = 'Invalid phone number'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Date is required'
    if (!formData.appointmentTime) newErrors.appointmentTime = 'Time is required'
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await onSubmit({ ...formData, duration })
      setShowSuccess(true)

      window.setTimeout(() => {
        setShowSuccess(false)
        setFormData({
          firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '',
          gender: 'Male', appointmentDate: '', appointmentTime: '',
          appointmentType: 'Checkup', reason: '', notes: ''
        })
        onClose()
      }, 2000)
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Unable to book this appointment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Calendar className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Book New Appointment</h2>
              <p className="text-sky-100 text-sm">{clinicName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-green-800 font-semibold">Appointment Booked Successfully!</p>
                <p className="text-green-600 text-sm">Patient will be notified via email and SMS.</p>
              </div>
            </div>
          </div>
        )}
        {submitError && <div role="alert" className="mx-6 mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Patient Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User size={20} className="text-sky-600" />
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Phone size={16} className="text-sky-600" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white ${
                  errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="+91-9876543210"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Mail size={16} className="text-sky-600" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="patient@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-sky-600" />
              Appointment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Appointment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => handleChange('appointmentDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white ${
                    errors.appointmentDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.appointmentDate && <p className="text-red-500 text-xs mt-1">{errors.appointmentDate}</p>}
              </div>

              {/* Appointment Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Clock size={16} className="text-sky-600" />
                  Time *
                </label>
                <select
                  value={formData.appointmentTime}
                  onChange={(e) => handleChange('appointmentTime', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white ${
                    errors.appointmentTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                {errors.appointmentTime && <p className="text-red-500 text-xs mt-1">{errors.appointmentTime}</p>}
                {formData.appointmentDate && !timeSlots.length && <p className="text-rose-600 text-xs mt-1">The clinic is closed on this day. Choose another date or update hours in Settings.</p>}
              </div>

              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Appointment Type *
                </label>
                <select
                  value={formData.appointmentType}
                  onChange={(e) => handleChange('appointmentType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
                >
                  {appointmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-sky-600" />
              Additional Information
            </h3>
            <div className="space-y-4">
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white ${
                    errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Tooth pain, Regular checkup, Cleaning"
                />
                {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Any additional information or special requirements..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-lg hover:from-sky-600 hover:to-cyan-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

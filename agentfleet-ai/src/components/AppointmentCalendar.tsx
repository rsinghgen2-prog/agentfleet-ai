import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'

interface Appointment {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  date: string
  time: string
  service: string
  status: 'booked' | 'completed' | 'cancelled'
  bookedBy: 'admin' | 'customer'
  createdAt: string
}

interface TimeSlot {
  time: string
  available: boolean
  appointment?: Appointment
}

interface AppointmentCalendarProps {
  businessHours: {
    start: string
    end: string
  }
  slotDuration: number // in minutes
  breakTimes?: { start: string; end: string }[]
}

const AppointmentCalendar = ({ 
  businessHours = { start: '09:00', end: '18:00' },
  slotDuration = 30,
  breakTimes = [{ start: '13:00', end: '14:00' }]
}: AppointmentCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    service: ''
  })
  const [filterStatus, setFilterStatus] = useState<'all' | 'booked' | 'available'>('all')

  // Load appointments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appointments')
    if (saved) {
      setAppointments(JSON.parse(saved))
    }
  }, [])

  // Save appointments to localStorage
  const saveAppointments = (appts: Appointment[]) => {
    setAppointments(appts)
    localStorage.setItem('appointments', JSON.stringify(appts))
  }

  // Generate time slots based on business hours
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const [startHour, startMin] = businessHours.start.split(':').map(Number)
    const [endHour, endMin] = businessHours.end.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    
    for (let time = startTime; time < endTime; time += slotDuration) {
      const hours = Math.floor(time / 60)
      const minutes = time % 60
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      
      // Check if time is in break period
      const isBreak = breakTimes?.some(breakTime => {
        const [breakStartH, breakStartM] = breakTime.start.split(':').map(Number)
        const [breakEndH, breakEndM] = breakTime.end.split(':').map(Number)
        const breakStart = breakStartH * 60 + breakStartM
        const breakEnd = breakEndH * 60 + breakEndM
        return time >= breakStart && time < breakEnd
      })
      
      if (!isBreak) {
        const dateStr = selectedDate.toISOString().split('T')[0]
        const appointment = appointments.find(
          apt => apt.date === dateStr && apt.time === timeStr && apt.status === 'booked'
        )
        
        slots.push({
          time: timeStr,
          available: !appointment,
          appointment
        })
      }
    }
    
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Handle date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  // Book appointment
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedSlot,
      service: bookingData.service,
      status: 'booked',
      bookedBy: 'admin',
      createdAt: new Date().toISOString()
    }
    
    saveAppointments([...appointments, newAppointment])
    
    // Send notification
    sendNotification(newAppointment)
    
    // Reset form
    setBookingData({ customerName: '', customerEmail: '', customerPhone: '', service: '' })
    setSelectedSlot('')
    setShowBookingModal(false)
    
    alert(`Appointment booked successfully for ${bookingData.customerName}!`)
  }

  // Send notification (simulated)
  const sendNotification = (appointment: Appointment) => {
    const message = `Appointment confirmed for ${appointment.customerName} on ${appointment.date} at ${appointment.time}`
    console.log('📧 Email sent to:', appointment.customerEmail, message)
    console.log('📱 SMS sent to:', appointment.customerPhone, message)
    console.log('💬 WhatsApp sent to:', appointment.customerPhone, message)
    
    // In production, call actual notification APIs here
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="text-blue-500" size={28} />
          Appointment Calendar
        </h2>
        
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Slots</option>
            <option value="available">Available Only</option>
            <option value="booked">Booked Only</option>
          </select>
          
          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600"
          >
            <Plus size={20} />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
        <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-white rounded-lg">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {timeSlots.filter(s => s.available).length} slots available
          </div>
        </div>

        <button onClick={() => navigateDate('next')} className="p-2 hover:bg-white rounded-lg">
          <ChevronRight size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {timeSlots.filter(slot => {
          if (filterStatus === 'available') return slot.available
          if (filterStatus === 'booked') return !slot.available
          return true
        }).map((slot, index) => (
          <motion.div key={slot.time} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
              slot.available ? 'border-green-300 bg-green-50 hover:bg-green-100' : 'border-red-200 bg-red-50 cursor-not-allowed'
            }`}
            onClick={() => {
              if (slot.available) {
                setSelectedSlot(slot.time)
                setShowBookingModal(true)
              }
            }}>
            <div className="flex items-center justify-between mb-2">
              <Clock size={16} className={slot.available ? 'text-green-600' : 'text-red-400'} />
              {slot.available ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-red-400" />}
            </div>
            <div className={`text-lg font-bold mb-1 ${slot.available ? 'text-green-700' : 'text-red-600'}`}>
              {slot.time}
            </div>
            {slot.available ? (
              <div className="text-xs text-green-600 font-medium">Available</div>
            ) : (
              <div className="text-xs text-red-600 font-medium truncate">{slot.appointment?.customerName}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Booked Appointments List */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Appointments for {selectedDate.toLocaleDateString()}
        </h3>
        <div className="space-y-3">
          {appointments.filter(apt => apt.date === selectedDate.toISOString().split('T')[0] && apt.status === 'booked')
            .sort((a, b) => a.time.localeCompare(b.time)).map(apt => (
            <motion.div key={apt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{apt.customerName.charAt(0)}</span>
                </div>
                <div>
                  <div className="font-bold text-gray-800">{apt.customerName}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Clock size={14} />{apt.time}</span>
                    <span className="flex items-center gap-1"><Phone size={14} />{apt.customerPhone}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Service: {apt.service}</div>
                </div>
              </div>
              <button onClick={() => {
                if (confirm('Cancel this appointment?')) {
                  saveAppointments(appointments.map(a => a.id === apt.id ? { ...a, status: 'cancelled' as const } : a))
                }
              }} className="p-2 hover:bg-red-100 rounded-lg text-red-600"><X size={18} /></button>
            </motion.div>
          ))}
          {appointments.filter(apt => apt.date === selectedDate.toISOString().split('T')[0] && apt.status === 'booked').length === 0 && (
            <div className="text-center py-8 text-gray-500">No appointments for this day</div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Book Appointment</h3>
                <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-700 font-medium">
                    {selectedDate.toLocaleDateString()} at {selectedSlot}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input type="text" required value={bookingData.customerName}
                    onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={bookingData.customerEmail}
                    onChange={(e) => setBookingData({...bookingData, customerEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" required value={bookingData.customerPhone}
                    onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select required value={bookingData.service}
                    onChange={(e) => setBookingData({...bookingData, service: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select service</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Checkup">Checkup</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Book Appointment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AppointmentCalendar

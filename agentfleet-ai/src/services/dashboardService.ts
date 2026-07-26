const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Patient {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  gender: string
  date_of_birth: string
}

export interface Appointment {
  id: string
  patient_id: string
  appointment_date: string
  appointment_time: string
  duration: number
  appointment_type: string
  status: string
  reason: string
  notes: string
  first_name: string
  last_name: string
  phone: string
  gender: string
}

export interface DashboardData {
  todaysAppointments: Appointment[]
  calendarData: Array<{
    appointment_date: string
    count: number
  }>
  stats: {
    todayVisits: number
    newPatientsToday: number
    totalAppointmentsToday: number
    totalPatients: number
  }
  currentDate: {
    month: number
    year: number
    today: string
  }
}

// Mock data for development/testing when backend is not available
const mockDashboardData: DashboardData = {
  todaysAppointments: [
    {
      id: '1',
      patient_id: '1',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '08:00:00',
      duration: 30,
      appointment_type: 'Weekly Visit',
      status: 'scheduled',
      reason: 'Regular checkup',
      notes: 'Patient requires braces adjustment',
      first_name: 'Guy',
      last_name: 'Hawkins',
      phone: '+91-9876543210',
      gender: 'Male'
    },
    {
      id: '2',
      patient_id: '2',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00:00',
      duration: 45,
      appointment_type: 'Weekly Visit',
      status: 'scheduled',
      reason: 'Regular checkup',
      notes: 'Cleaning and polishing',
      first_name: 'Jane',
      last_name: 'Cooper',
      phone: '+91-9876543211',
      gender: 'Female'
    },
    {
      id: '3',
      patient_id: '3',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '14:00:00',
      duration: 30,
      appointment_type: 'Weekly Visit',
      status: 'scheduled',
      reason: 'Follow-up visit',
      notes: 'Check cavity filling',
      first_name: 'Leslie',
      last_name: 'Alexander',
      phone: '+91-9876543212',
      gender: 'Male'
    },
    {
      id: '4',
      patient_id: '4',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '16:00:00',
      duration: 30,
      appointment_type: 'Routine Checkup',
      status: 'scheduled',
      reason: 'Annual checkup',
      notes: 'First visit - comprehensive examination',
      first_name: 'Jenny',
      last_name: 'Wilson',
      phone: '+91-9876543213',
      gender: 'Female'
    }
  ],
  calendarData: [
    { appointment_date: new Date().toISOString().split('T')[0], count: 4 },
    { appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], count: 3 },
    { appointment_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], count: 2 }
  ],
  stats: {
    todayVisits: 790,
    newPatientsToday: 750,
    totalAppointmentsToday: 4,
    totalPatients: 1250
  },
  currentDate: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    today: new Date().toISOString().split('T')[0]
  }
}

export class DashboardService {
  private static async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken')
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }

    const response = await fetch(url, { ...options, headers })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  static async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/api/v1/patients/dashboard`)
      return response.data
    } catch (error) {
      console.warn('Backend not available, using mock data:', error)
      // Return mock data for development
      return mockDashboardData
    }
  }

  static async getTodaysAppointments(): Promise<Appointment[]> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/api/v1/patients/appointments/today`)
      return response.data
    } catch (error) {
      console.warn('Backend not available, using mock data:', error)
      return mockDashboardData.todaysAppointments
    }
  }

  static async createBooking(bookingData: any): Promise<any> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/api/v1/patients/bookings`, {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
      return response
    } catch (error) {
      console.warn('Backend not available, simulating booking creation:', error)
      // For development, simulate success
      return {
        success: true,
        message: 'Booking created (mock)',
        data: {
          patientId: Math.random().toString(36).substring(7),
          appointmentId: Math.random().toString(36).substring(7),
          appointmentDate: bookingData.appointmentDate,
          appointmentTime: bookingData.appointmentTime
        }
      }
    }
  }
}

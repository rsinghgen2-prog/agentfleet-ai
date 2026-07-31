const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010'
const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

export interface Patient { id: string; first_name: string; last_name: string; phone?: string; email?: string; gender?: string; date_of_birth?: string; last_visit?: string | null; next_appointment?: string | null }
export interface Appointment { id: string; patient_id: string; appointment_date: string; appointment_time: string; duration: number; appointment_type: string; status: string; reason: string; notes: string; first_name: string; last_name: string; phone: string; gender: string }
export interface DentistNote { id: string; title: string; content: string; expires_at: string; is_active: boolean; created_by?: string | null; created_at: string; updated_at: string }
export interface DentistNoteInput { title: string; content: string; expiresAt?: string | null }
export interface InventoryItem { id: string; name: string; category: string; quantity: number; reorder_level: number; unit: string; is_active?: boolean; low_stock?: boolean }
export interface InventoryInput { name: string; category: string; quantity: number; reorderLevel: number; unit: string }
export interface SupportMessage { id: string; conversation_id: string; sender_id: string; sender_name?: string | null; sender_role: string; body: string; created_at: string }
export interface SupportConversation { id: string; subject: string; status: 'open' | 'closed'; created_by?: string | null; created_at: string; updated_at: string }
export interface SupportChat { conversation: SupportConversation | null; messages: SupportMessage[] }
export interface HospitalDirectory { id: string; name: string; relationship: 'own' | 'partner'; specialty: string; address: string; city: string; contact_name?: string; contact_phone?: string; is_active?: boolean }
export interface NotificationAlert { id: string; kind: 'message' | 'email' | 'call'; title: string; body: string; customer_name?: string | null; is_read: boolean; created_at: string }
export interface ClinicSettings { clinic_name: string; clinic_email?: string; phone?: string; address: Record<string, unknown>; branding: Record<string, string>; working_hours: Record<string, string>; appointment_settings: Record<string, unknown>; notifications: Record<string, boolean>; timezone: string }
export interface DashboardData { todaysAppointments: Appointment[]; calendarData: Array<{ appointment_date: string; count: number }>; upcomingFollowUps?: Patient[]; stats: { todayVisits: number; newPatientsToday: number; totalAppointmentsToday: number; totalPatients: number }; currentDate: { month: number; year: number; today: string } }

const today = new Date().toISOString().split('T')[0]
const dateIn = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
const DEMO_PATIENTS_KEY = 'agentfleet.demo.patients'
const DEMO_APPOINTMENTS_KEY = 'agentfleet.demo.appointments'
const DEMO_DENTIST_NOTES_KEY = 'agentfleet.demo.dentistNotes'
const DEMO_INVENTORY_KEY = 'agentfleet.demo.inventory'
const DEMO_SUPPORT_CHAT_KEY = 'agentfleet.demo.supportChat'
const DEMO_CLIENT_ALERTS_KEY = 'agentfleet.demo.clientAlerts'
const mockPatients: Patient[] = [
  ['Aarav', 'Sharma', 'Active orthodontic treatment'], ['Meera', 'Cooper', 'Upcoming follow-up'], ['Kabir', 'Alexander', 'Needs filling review'], ['Ananya', 'Wilson', 'New patient'], ['Rohan', 'Fox', 'Requires treatment plan'],
  ['Isha', 'Howard', 'Preventive care'], ['Vihaan', 'Williamson', 'Implant review'], ['Tara', 'Simmons', 'Follow-up needed'], ['Dev', 'Patel', 'Overdue cleaning'], ['Zoya', 'Khan', 'Minor patient; guardian consent required'],
].map(([first_name, last_name, notes], index) => ({ id: `demo-patient-${index + 1}`, first_name, last_name, notes, phone: `+91-900000000${index + 1}`, email: `${first_name.toLowerCase()}@example.test`, gender: index % 2 ? 'Female' : 'Male', last_visit: index === 3 ? null : dateIn(-(index + 2)), next_appointment: [1, 4, 6, 7, 9].includes(index) ? dateIn(index + 3) : null }))
const mockAppointments: Appointment[] = [
  ['08:00:00', 0, 'Checkup', 'Regular checkup'], ['10:00:00', 1, 'Cleaning', 'Preventive cleaning'], ['14:00:00', 2, 'Cavity Filling', 'Filling review'], ['16:00:00', 3, 'Consultation', 'New patient assessment'],
].map(([appointment_time, patientIndex, appointment_type, reason], index) => { const patient = mockPatients[Number(patientIndex)]; return { id: `demo-appointment-${index + 1}`, patient_id: patient.id, appointment_date: today, appointment_time: String(appointment_time), duration: 30, appointment_type: String(appointment_type), status: index === 2 ? 'in_progress' : 'scheduled', reason: String(reason), notes: '', first_name: patient.first_name, last_name: patient.last_name, phone: patient.phone || '', gender: patient.gender || '' } })
const mockSettings: ClinicSettings = { clinic_name: 'V.P.S. Dental & Oral Care', clinic_email: 'info@vpsdental.com', phone: '+91-XXXXXXXXXX', address: { city: 'Kanpur', state: 'Uttar Pradesh', country: 'India' }, branding: { primaryColor: '#005db6', accentColor: '#a23858', logo: '🦷' }, working_hours: { monday: '09:00-18:00', saturday: '10:00-14:00' }, appointment_settings: { duration: 45, bufferMinutes: 10, emergencySlots: 2 }, notifications: { emailAlerts: true, smsReminders: true }, timezone: 'Asia/Kolkata' }
const mockInventory: InventoryItem[] = [
  { id: 'demo-1', name: 'Dental Examination Kit', category: 'Diagnostic', quantity: 24, reorder_level: 10, unit: 'kits', is_active: true, low_stock: false },
  { id: 'demo-2', name: 'Composite Resin A2', category: 'Restorative', quantity: 8, reorder_level: 10, unit: 'syringes', is_active: true, low_stock: true },
  { id: 'demo-3', name: 'Nitrile Examination Gloves', category: 'Consumables', quantity: 12, reorder_level: 15, unit: 'boxes', is_active: true, low_stock: true },
]
const mockHospitals: HospitalDirectory[] = [
  { id: 'hospital-own-1', name: 'V.P.S. Dental & Oral Care', relationship: 'own', specialty: 'Dental & Oral Care', address: '12 Civil Lines', city: 'Kanpur', contact_name: 'Dr. Rajeev Pratap Singh', contact_phone: '+91 90000 00001', is_active: true },
  { id: 'hospital-partner-1', name: 'Regency Superspeciality Hospital', relationship: 'partner', specialty: 'Oral Surgery & Maxillofacial Care', address: 'A-2 Sarvodaya Nagar', city: 'Kanpur', contact_name: 'Referral Desk', contact_phone: '+91 90000 00002', is_active: true },
  { id: 'hospital-partner-2', name: 'Kalyanpur Diagnostic Centre', relationship: 'partner', specialty: 'Imaging & Diagnostics', address: 'Main GT Road, Kalyanpur', city: 'Kanpur', contact_name: 'Coordination Desk', contact_phone: '+91 90000 00003', is_active: true },
]
const mockClientAlerts: NotificationAlert[] = [
  { id: 'demo-alert-1', kind: 'message', title: 'New patient message', body: 'Meera Cooper asked whether her follow-up can be moved to Friday.', customer_name: 'Meera Cooper', is_read: false, created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString() },
  { id: 'demo-alert-2', kind: 'email', title: 'Email from Aarav Sharma', body: 'Aarav shared an updated insurance document for his appointment.', customer_name: 'Aarav Sharma', is_read: false, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: 'demo-alert-3', kind: 'call', title: 'Missed call from Kabir Alexander', body: 'A customer called the clinic and requested a callback.', customer_name: 'Kabir Alexander', is_read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
]

function readDemoCollection<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(stored) ? stored as T[] : fallback
  } catch {
    return fallback
  }
}

function writeDemoCollection<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

const getDemoPatients = () => readDemoCollection<Patient>(DEMO_PATIENTS_KEY, mockPatients)
const getDemoAppointments = () => readDemoCollection<Appointment>(DEMO_APPOINTMENTS_KEY, mockAppointments)
const getDemoAlerts = () => readDemoCollection<NotificationAlert>(DEMO_CLIENT_ALERTS_KEY, mockClientAlerts)
const inventoryWithStock = (item: InventoryItem): InventoryItem => ({ ...item, is_active: item.is_active !== false, low_stock: item.quantity <= item.reorder_level })
const getDemoInventory = (search = '', includeInactive = false) => {
  const stored = readDemoCollection<InventoryItem>(DEMO_INVENTORY_KEY, mockInventory).map(inventoryWithStock)
  const needle = search.trim().toLowerCase()
  return stored.filter((item) => (includeInactive || item.is_active !== false) && `${item.name} ${item.category}`.toLowerCase().includes(needle))
}
const oneMonthFrom = (base = new Date()) => { const expiration = new Date(base); expiration.setMonth(expiration.getMonth() + 1); return expiration.toISOString() }
const getDemoDentistNotes = () => {
  const stored = readDemoCollection<DentistNote>(DEMO_DENTIST_NOTES_KEY, [])
  const now = Date.now()
  const normalized = stored.map((note) => ({ ...note, expires_at: note.expires_at || oneMonthFrom(note.created_at ? new Date(note.created_at) : new Date()), is_active: note.is_active !== false }))
  const updated = normalized.map((note) => note.is_active && Date.parse(note.expires_at) <= now ? { ...note, is_active: false } : note)
  if (JSON.stringify(stored) !== JSON.stringify(updated)) writeDemoCollection(DEMO_DENTIST_NOTES_KEY, updated)
  return updated.filter((note) => note.is_active)
}

function getDemoDashboardData(): DashboardData {
  const patients = getDemoPatients()
  const appointments = getDemoAppointments()
  const todaysAppointments = appointments.filter((appointment) => appointment.appointment_date === today)
  const counts = new Map<string, number>()
  appointments.forEach((appointment) => counts.set(appointment.appointment_date, (counts.get(appointment.appointment_date) || 0) + 1))
  return {
    todaysAppointments,
    calendarData: [...counts.entries()].map(([appointment_date, count]) => ({ appointment_date, count })),
    upcomingFollowUps: patients.filter((patient) => patient.next_appointment).slice(0, 10),
    stats: {
      todayVisits: new Set(todaysAppointments.map((appointment) => appointment.patient_id)).size,
      newPatientsToday: patients.filter((patient) => todaysAppointments.some((appointment) => appointment.patient_id === patient.id && !patient.last_visit)).length,
      totalAppointmentsToday: todaysAppointments.length,
      totalPatients: patients.length,
    },
    currentDate: { month: new Date().getMonth() + 1, year: new Date().getFullYear(), today },
  }
}

export class DashboardService {
  private static async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`)
    return body.data as T
  }

  static async getDashboardData(): Promise<DashboardData> { try { return await this.request<DashboardData>('/api/v1/patients/dashboard') } catch (error) { if (!DEMO_MODE) throw error; console.warn('Using explicit demo dashboard data', error); return getDemoDashboardData() } }
  static async getPatients(search = '', limit = 25, offset = 0): Promise<{ data: Patient[]; total: number }> { try { const query = new URLSearchParams({ limit: String(limit), offset: String(offset), ...(search ? { search } : {}) }); const response = await this.requestBody<{ data: Patient[]; meta?: { total?: number } }>(`/api/v1/patients/patients?${query}`); return { data: response.data, total: response.meta?.total ?? response.data.length } } catch (error) { if (!DEMO_MODE) throw error; const needle = search.toLowerCase(); const filtered = getDemoPatients().filter((patient) => `${patient.first_name} ${patient.last_name} ${patient.phone} ${patient.email}`.toLowerCase().includes(needle)); return { data: filtered.slice(offset, offset + limit), total: filtered.length } } }
  static async getAppointments(from: string, to: string): Promise<Appointment[]> { try { return await this.request<Appointment[]>(`/api/v1/patients/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`) } catch (error) { if (!DEMO_MODE) throw error; return getDemoAppointments().filter((appointment) => appointment.appointment_date >= from && appointment.appointment_date <= to) } }
  static async getTodaysAppointments(): Promise<Appointment[]> { try { return await this.request<Appointment[]>('/api/v1/patients/appointments/today') } catch (error) { if (!DEMO_MODE) throw error; return getDemoAppointments().filter((appointment) => appointment.appointment_date === today) } }
  static async getDentistNotes(): Promise<DentistNote[]> { try { return await this.request<DentistNote[]>('/api/v1/patients/notes') } catch (error) { if (!DEMO_MODE) throw error; return getDemoDentistNotes() } }
  static async createDentistNote(input: DentistNoteInput): Promise<DentistNote> { try { return await this.request<DentistNote>('/api/v1/patients/notes', { method: 'POST', body: JSON.stringify(input) }) } catch (error) { if (!DEMO_MODE) throw error; const now = new Date().toISOString(); const note: DentistNote = { id: `demo-note-${Date.now()}`, title: input.title, content: input.content, expires_at: input.expiresAt || oneMonthFrom(), is_active: true, created_at: now, updated_at: now }; const next = [note, ...getDemoDentistNotes()]; writeDemoCollection(DEMO_DENTIST_NOTES_KEY, next); return note } }
  static async updateDentistNote(id: string, input: DentistNoteInput): Promise<DentistNote> { try { return await this.request<DentistNote>(`/api/v1/patients/notes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }) } catch (error) { if (!DEMO_MODE) throw error; const current = getDemoDentistNotes(); const existing = current.find((note) => note.id === id); if (!existing) throw new Error('Dentist note not found'); const note = { ...existing, ...input, expires_at: input.expiresAt || oneMonthFrom(), is_active: true, updated_at: new Date().toISOString() }; writeDemoCollection(DEMO_DENTIST_NOTES_KEY, current.map((item) => item.id === id ? note : item)); return note } }
  static async deleteDentistNote(id: string): Promise<void> { try { await this.request<{ id: string }>(`/api/v1/patients/notes/${encodeURIComponent(id)}`, { method: 'DELETE' }) } catch (error) { if (!DEMO_MODE) throw error; const current = readDemoCollection<DentistNote>(DEMO_DENTIST_NOTES_KEY, []); if (!current.some((note) => note.id === id && note.is_active !== false)) throw new Error('Dentist note not found'); writeDemoCollection(DEMO_DENTIST_NOTES_KEY, current.map((note) => note.id === id ? { ...note, is_active: false, updated_at: new Date().toISOString() } : note)) } }
  static async createBooking(bookingData: unknown) { try { return await this.request<{ patientId: string; appointmentId: string }>('/api/v1/patients/bookings', { method: 'POST', body: JSON.stringify(bookingData) }) } catch (error) { if (!DEMO_MODE) throw error; const input = bookingData as Record<string, string>; const timestamp = Date.now(); const patientId = `demo-patient-${timestamp}`; const appointmentId = `demo-appointment-${timestamp}`; const patient: Patient = { id: patientId, first_name: input.firstName, last_name: input.lastName, phone: input.phone, email: input.email, gender: input.gender, date_of_birth: input.dateOfBirth || undefined, last_visit: null, next_appointment: input.appointmentDate }; const appointment: Appointment = { id: appointmentId, patient_id: patientId, appointment_date: input.appointmentDate, appointment_time: input.appointmentTime, duration: 30, appointment_type: input.appointmentType, status: 'scheduled', reason: input.reason, notes: input.notes || '', first_name: patient.first_name, last_name: patient.last_name, phone: patient.phone || '', gender: patient.gender || '' }; writeDemoCollection(DEMO_PATIENTS_KEY, [...getDemoPatients(), patient]); writeDemoCollection(DEMO_APPOINTMENTS_KEY, [...getDemoAppointments(), appointment]); return { patientId, appointmentId } } }
  static async getSettings(): Promise<ClinicSettings | null> { try { return await this.request<ClinicSettings | null>('/api/v1/patients/settings') } catch (error) { if (!DEMO_MODE) throw error; try { return JSON.parse(localStorage.getItem('clinicSettingsDraft') || 'null') as ClinicSettings | null || mockSettings } catch { return mockSettings } } }
  static async updateSettings(settings: Record<string, unknown>): Promise<ClinicSettings> { try { return await this.request<ClinicSettings>('/api/v1/patients/settings', { method: 'PUT', body: JSON.stringify(settings) }) } catch (error) { if (!DEMO_MODE) throw error; const current = await this.getSettings() || mockSettings; const next = { ...current, clinic_name: settings.clinicName || current.clinic_name, clinic_email: settings.clinicEmail || current.clinic_email, notifications: settings.notifications || current.notifications } as ClinicSettings; localStorage.setItem('clinicSettingsDraft', JSON.stringify(next)); return next } }
  static async getHospitalDirectory(search = ''): Promise<HospitalDirectory[]> { try { return await this.request<HospitalDirectory[]>(`/api/v1/patients/hospitals?search=${encodeURIComponent(search)}`) } catch (error) { if (!DEMO_MODE) throw error; const needle = search.trim().toLowerCase(); return mockHospitals.filter((hospital) => `${hospital.name} ${hospital.relationship} ${hospital.specialty} ${hospital.city}`.toLowerCase().includes(needle)) } }
  static async getClientAlerts(unreadOnly = false): Promise<NotificationAlert[]> { try { return await this.request<NotificationAlert[]>(`/api/v1/patients/notifications?unreadOnly=${unreadOnly}`) } catch (error) { if (!DEMO_MODE) throw error; return getDemoAlerts().filter((alert) => !unreadOnly || !alert.is_read) } }
  static async markClientAlertRead(id: string): Promise<void> { try { await this.request<{ id: string }>(`/api/v1/patients/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }) } catch (error) { if (!DEMO_MODE) throw error; const alerts = getDemoAlerts(); writeDemoCollection(DEMO_CLIENT_ALERTS_KEY, alerts.map((alert) => alert.id === id ? { ...alert, is_read: true } : alert)) } }
  static async getInventory(search = ''): Promise<InventoryItem[]> { try { return await this.request<InventoryItem[]>(`/api/v1/patients/inventory?search=${encodeURIComponent(search)}`) } catch (error) { if (!DEMO_MODE) throw error; return getDemoInventory(search) } }
  static async getInventoryHistory(search = ''): Promise<InventoryItem[]> { try { return await this.request<InventoryItem[]>(`/api/v1/patients/inventory/history?search=${encodeURIComponent(search)}`) } catch (error) { if (!DEMO_MODE) throw error; return getDemoInventory(search, true).filter((item) => item.is_active === false) } }
  static async createInventory(item: InventoryInput): Promise<InventoryItem> { try { return await this.request<InventoryItem>('/api/v1/patients/inventory', { method: 'POST', body: JSON.stringify(item) }) } catch (error) { if (!DEMO_MODE) throw error; const created = inventoryWithStock({ id: `demo-inventory-${Date.now()}`, ...item, reorder_level: item.reorderLevel, is_active: true }); const current = readDemoCollection<InventoryItem>(DEMO_INVENTORY_KEY, mockInventory); writeDemoCollection(DEMO_INVENTORY_KEY, [...current, created]); return created } }
  static async updateInventory(id: string, changes: Partial<InventoryInput>): Promise<InventoryItem> { try { return await this.request<InventoryItem>(`/api/v1/patients/inventory/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) }) } catch (error) { if (!DEMO_MODE) throw error; const current = readDemoCollection<InventoryItem>(DEMO_INVENTORY_KEY, mockInventory); const existing = current.find((item) => item.id === id && item.is_active !== false); if (!existing) throw new Error('Inventory item not found'); const updated = inventoryWithStock({ ...existing, ...changes, reorder_level: changes.reorderLevel ?? existing.reorder_level }); writeDemoCollection(DEMO_INVENTORY_KEY, current.map((item) => item.id === id ? updated : item)); return updated } }
  static async deleteInventory(id: string): Promise<void> { try { await this.request<{ id: string }>(`/api/v1/patients/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' }) } catch (error) { if (!DEMO_MODE) throw error; const current = readDemoCollection<InventoryItem>(DEMO_INVENTORY_KEY, mockInventory); if (!current.some((item) => item.id === id && item.is_active !== false)) throw new Error('Inventory item not found'); writeDemoCollection(DEMO_INVENTORY_KEY, current.map((item) => item.id === id ? { ...item, is_active: false } : item)) } }
  static async getSupportChat(): Promise<SupportChat | null> { try { return await this.request<SupportChat | null>('/api/v1/patients/support/chat') } catch (error) { if (!DEMO_MODE) throw error; return readDemoCollection<SupportChat>(DEMO_SUPPORT_CHAT_KEY, [])[0] || null } }
  static async createSupportConversation(subject = 'Hospital support'): Promise<SupportChat> { try { return await this.request<SupportChat>('/api/v1/patients/support/conversations', { method: 'POST', body: JSON.stringify({ subject }) }) } catch (error) { if (!DEMO_MODE) throw error; const now = new Date().toISOString(); const chat: SupportChat = { conversation: { id: `demo-support-${Date.now()}`, subject, status: 'open', created_by: 'demo-user', created_at: now, updated_at: now }, messages: [] }; writeDemoCollection(DEMO_SUPPORT_CHAT_KEY, [chat]); return chat } }
  static async sendSupportMessage(conversationId: string, body: string): Promise<SupportMessage> { try { return await this.request<SupportMessage>(`/api/v1/patients/support/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', body: JSON.stringify({ body }) }) } catch (error) { if (!DEMO_MODE) throw error; const chats = readDemoCollection<SupportChat>(DEMO_SUPPORT_CHAT_KEY, []); const chat = chats.find((item) => item.conversation?.id === conversationId); if (!chat || !chat.conversation) throw new Error('Support conversation not found'); const message: SupportMessage = { id: `demo-support-message-${Date.now()}`, conversation_id: conversationId, sender_id: 'demo-user', sender_name: 'You', sender_role: 'client', body, created_at: new Date().toISOString() }; chat.messages = [...chat.messages, message]; chat.conversation.updated_at = message.created_at; writeDemoCollection(DEMO_SUPPORT_CHAT_KEY, chats); return message } }

  private static async requestBody<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`)
    return body as T
  }
}
// Multi-tenant client configuration
export interface Client {
  email: string
  password: string
  clientName: string
  domain: string
  subdomain: string
  tenantSlug?: string
  brandName: string
  dashboardType: 'dental' | 'hospital' | 'school' | 'retail'
  primaryColor: string
  logo?: string
  address?: string
}

export const CLIENTS: Client[] = [
  {
    email: 'rsingh.gen3@gmail.com',
    password: import.meta.env.VITE_DEMO_VPS_PASSWORD || '',
    clientName: 'Dr. Rajeev Pratap Singh',
    domain: 'Hospital',
    subdomain: 'Dental',
    tenantSlug: 'vps-dental',
    brandName: 'V.P.S. Dental & Oral Care',
    dashboardType: 'dental',
    primaryColor: '#0EA5E9', // Sky blue
    address: '128/31, F Block Kidwai Nagar, Kanpur, Near Matadeen HP Petrol Pump, Geeta Park, Kidwai Nagar, Kanpur-208011, Uttar Pradesh, India'
  },
  {
    email: 'rsingh.niit02@gmail.com',
    password: import.meta.env.VITE_DEMO_ABC_PASSWORD || '',
    clientName: 'Dr. Abhijeej Baghel',
    domain: 'Dental Clinic',
    subdomain: 'Dental',
    tenantSlug: 'abc-dental',
    brandName: 'ABC Dental Care',
    dashboardType: 'dental',
    primaryColor: '#0f766e',
    logo: '🦷',
    address: 'abcd, satna, mp 485447'
  }
]

export const validateClient = (email: string, password: string): Client | null => {
  if (!password) return null
  const client = CLIENTS.find(c => c.email === email && c.password && c.password === password)
  return client || null
}

export const getClientByEmail = (email: string): Client | null => {
  return CLIENTS.find(c => c.email === email) || null
}

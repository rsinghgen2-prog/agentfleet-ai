// Multi-tenant client configuration
export interface Client {
  email: string
  password: string
  clientName: string
  domain: string
  subdomain: string
  brandName: string
  dashboardType: 'dental' | 'hospital' | 'school' | 'retail'
  primaryColor: string
  logo?: string
  address?: string
}

export const CLIENTS: Client[] = [
  {
    email: 'rsingh.gen3@gmail.com',
    password: 'Aug@2026',
    clientName: 'Dr. Rajeev Pratap Singh',
    domain: 'Hospital',
    subdomain: 'Dental',
    brandName: 'V.P.S. Dental & Oral Care',
    dashboardType: 'dental',
    primaryColor: '#0EA5E9', // Sky blue
    address: '128/31, F Block Kidwai Nagar, Kanpur, Near Matadeen HP Petrol Pump, Geeta Park, Kidwai Nagar, Kanpur-208011, Uttar Pradesh, India'
  }
]

export const validateClient = (email: string, password: string): Client | null => {
  const client = CLIENTS.find(c => c.email === email && c.password === password)
  return client || null
}

export const getClientByEmail = (email: string): Client | null => {
  return CLIENTS.find(c => c.email === email) || null
}

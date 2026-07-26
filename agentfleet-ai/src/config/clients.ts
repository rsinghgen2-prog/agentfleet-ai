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
}

export const CLIENTS: Client[] = [
  {
    email: 'rsingh.gen3@gmail.com',
    password: 'Aug@2026',
    clientName: 'Dr. Sarah',
    domain: 'Hospital',
    subdomain: 'Dental',
    brandName: 'MintDen',
    dashboardType: 'dental',
    primaryColor: '#60A5FA'
  }
]

export const validateClient = (email: string, password: string): Client | null => {
  const client = CLIENTS.find(c => c.email === email && c.password === password)
  return client || null
}

export const getClientByEmail = (email: string): Client | null => {
  return CLIENTS.find(c => c.email === email) || null
}

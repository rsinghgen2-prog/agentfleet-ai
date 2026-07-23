// Super Admin Configuration
export const SUPER_ADMIN = {
  email: 'rsingh.gen2@gmail.com',
  password: 'Aug@2026',
  fullName: 'Super Administrator',
  phone: '+1 (000) 000-0000',
  businessName: 'AgentFleet AI',
  industry: 'Technology',
  plan: 'super_admin',
  isSubscribed: true,
  paymentCompleted: true,
  isSuperAdmin: true,
  registeredAt: new Date('2026-01-01').toISOString(),
  permissions: {
    accessAll: true,
    manageUsers: true,
    viewAnalytics: true,
    managePlans: true,
    systemSettings: true,
    unlimitedMessages: true,
    apiAccess: true,
    dataExport: true,
    userImpersonation: true,
    billingManagement: true
  }
}

// Check if user is super admin
export const isSuperAdmin = (email: string): boolean => {
  return email.toLowerCase() === SUPER_ADMIN.email.toLowerCase()
}

// Validate super admin credentials
export const validateSuperAdmin = (email: string, password: string): boolean => {
  return (
    email.toLowerCase() === SUPER_ADMIN.email.toLowerCase() &&
    password === SUPER_ADMIN.password
  )
}

// Get super admin profile
export const getSuperAdminProfile = () => {
  return {
    ...SUPER_ADMIN,
    password: undefined // Don't expose password
  }
}

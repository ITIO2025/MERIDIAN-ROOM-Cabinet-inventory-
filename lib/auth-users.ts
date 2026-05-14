import type { UserRole } from '@/types/next-auth'

export interface SystemUser {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  avatar?: string
}

// Demo users — ในระบบจริงให้ใช้ Database
export const SYSTEM_USERS: SystemUser[] = [
  { id: '1', name: 'Super Admin', email: 'admin@meridian.co', password: 'meridian2026', role: 'SUPER_ADMIN' },
  { id: '2', name: 'ออย Designer', email: 'designer@meridian.co', password: 'design2026', role: 'DESIGNER' },
  { id: '3', name: 'บีม Sales', email: 'sales@meridian.co', password: 'sales2026', role: 'SALES' },
  { id: '4', name: 'ฝน Sales', email: 'sales2@meridian.co', password: 'sales2026', role: 'SALES' },
  { id: '5', name: 'Production Manager', email: 'production@meridian.co', password: 'prod2026', role: 'PRODUCTION' },
  { id: '6', name: 'Accountant', email: 'account@meridian.co', password: 'acc2026', role: 'ACCOUNTANT' },
]

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:  'Super Admin',
  ADMIN:        'Admin',
  SALES:        'Sales',
  DESIGNER:     'Designer',
  PRODUCTION:   'Production',
  INSTALLER:    'Installer',
  ACCOUNTANT:   'Accountant',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN:  '#C6A969',
  ADMIN:        '#111111',
  SALES:        '#2196F3',
  DESIGNER:     '#9C27B0',
  PRODUCTION:   '#FF9800',
  INSTALLER:    '#009688',
  ACCOUNTANT:   '#4CAF50',
}

// Route permissions
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/pricing':    ['SUPER_ADMIN', 'ADMIN', 'SALES', 'DESIGNER'],
  '/projects':   ['SUPER_ADMIN', 'ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'],
  '/quotation':  ['SUPER_ADMIN', 'ADMIN', 'SALES', 'DESIGNER'],
  '/analytics':  ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  '/production': ['SUPER_ADMIN', 'ADMIN', 'PRODUCTION', 'INSTALLER'],
  '/stock':      ['SUPER_ADMIN', 'ADMIN', 'PRODUCTION'],
  '/customers':  ['SUPER_ADMIN', 'ADMIN', 'SALES'],
  '/profit':     ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  '/settings':   ['SUPER_ADMIN'],
}

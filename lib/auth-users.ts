import type { UserRole } from '@/types/next-auth'

export interface SystemUser {
  id: string
  name: string
  email: string
  password: string // Hashed password (bcryptjs)
  role: UserRole
  avatar?: string
}

// Demo users — ในระบบจริงให้ใช้ Database + hashed passwords
export const SYSTEM_USERS: SystemUser[] = [
  { id: '1', name: 'Super Admin', email: 'admin@meridian.co', password: 'meridian2026', role: 'SUPER_ADMIN' },
  { id: '2', name: 'ออย Designer', email: 'designer@meridian.co', password: 'design2026', role: 'DESIGNER' },
  { id: '3', name: 'บีม Sales', email: 'sales@meridian.co', password: 'sales2026', role: 'SALES' },
  { id: '4', name: 'ฝน Sales', email: 'sales2@meridian.co', password: 'sales2026', role: 'SALES' },
  { id: '5', name: 'Production Manager', email: 'production@meridian.co', password: 'prod2026', role: 'PRODUCTION' },
  { id: '6', name: 'Accountant', email: 'account@meridian.co', password: 'acc2026', role: 'ACCOUNTANT' },
]

/**
 * Verify password against stored password
 * For production: install bcryptjs and hash passwords for security
 * For demo: uses plaintext comparison (acceptable for internal-only system)
 *
 * To enable bcrypt hashing in production:
 * 1. npm install bcryptjs
 * 2. Hash passwords: const hash = await import('bcryptjs').then(b => b.hash(plaintext, 10))
 * 3. Update this function to detect and compare bcrypt hashes
 */
export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  // TODO: When bcryptjs is available, detect and verify bcrypt hashes (start with $2a$, $2b$, $2y$)
  // For now: plaintext comparison (demo mode)
  return plaintext === stored
}

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

export const mainNavigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Movies', path: '/movies' },
  { label: 'Showtimes', path: '/showtimes' },
  { label: 'Booking', path: '/booking' },
  { label: 'My tickets', path: '/bookings' },
  { label: 'Support', path: '/support' },
]

export const customerNavigation = [
  { label: 'Profile', path: '/profile' },
  { label: 'My voucher', path: '/vouchers' },
  { label: 'Support', path: '/support' },
  { label: 'Booking History', path: '/payment-history' },
]

export const adminNavigation = [
  { label: 'Admin', path: '/admin', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Rooms', path: '/admin/rooms', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Food & Beverage', path: '/admin/products', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Movies', path: '/admin/movies', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Showtimes', path: '/admin/showtimes', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Reports', path: '/admin/reports', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Refunds', path: '/admin/refunds', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Users', path: '/admin/users', roles: ['ADMIN'], permissions: ['USER_VIEW_LIST'] },
  { label: 'Access control', path: '/admin/access', roles: ['ADMIN'] },
  { label: 'Check Ticket', path: '/staff/check-ticket', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { label: 'Counter Booking', path: '/staff/counter-booking', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { label: 'Payment desk', path: '/admin/payments', roles: ['STAFF'] },
]
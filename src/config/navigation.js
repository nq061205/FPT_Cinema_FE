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
  { label: 'Lịch sử thanh toán', path: '/payment-history' },
]

export const adminNavigation = [
  { label: 'Admin', path: '/admin', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Rooms', path: '/admin/rooms', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Products', path: '/admin/products', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Movies', path: '/admin/movies', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Showtimes', path: '/admin/showtimes', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Users', path: '/admin/users', permissions: ['USER_VIEW_LIST'] },
  { label: 'Reports', path: '/admin/reports', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Access control', path: '/admin/access', roles: ['ADMIN'] },
  { label: 'Payment desk', path: '/admin/payments', roles: ['STAFF'] },
]

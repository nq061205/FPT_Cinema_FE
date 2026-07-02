export const mainNavigation = [
  { label: 'Dashboard', path: '/' },
  { label: 'Movies', path: '/movies' },
  { label: 'Showtimes', path: '/showtimes' },
  { label: 'Booking', path: '/booking' },
  { label: 'My tickets', path: '/bookings' },
  { label: 'Support', path: '/support' },
]

export const adminNavigation = [
  { label: 'Admin', path: '/admin', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Rooms', path: '/admin/rooms', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Users', path: '/admin/users', permissions: ['USER_VIEW_LIST'] },
  { label: 'Reports', path: '/admin/reports', roles: ['ADMIN', 'MANAGER'] },
]

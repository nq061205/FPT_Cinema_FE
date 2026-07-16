export const managerNavigation = [
  { label: "Dashboard", path: "/manager", end: true },
  { label: "Movies", path: "/manager/movies" },
  { label: "Reviews", path: "/manager/reviews" },
  { label: "Rooms & Seats", path: "/manager/rooms" },
  { label: "Showtimes", path: "/manager/showtimes" },
]

export const customerNavigation = [
  { label: 'Profile', path: '/profile' },
  { label: 'Booking History', path: '/bookings' },
  { label: 'My voucher', path: '/vouchers' },
  { label: 'Support', path: '/support' },
]

export const adminNavigation = [
  { label: 'Admin', path: '/admin', roles: ['ADMIN'] },
  { label: 'Rooms', path: '/admin/rooms', roles: ['ADMIN'] },
  { label: 'Food & Beverage', path: '/admin/products', roles: ['ADMIN'] },
  { label: 'Movies', path: '/admin/movies', roles: ['ADMIN'] },
  { label: 'Showtimes', path: '/admin/showtimes', roles: ['ADMIN'] },
  { label: 'Reviews', path: '/admin/reviews', roles: ['ADMIN'] },
  { label: 'Reports', path: '/admin/reports', roles: ['ADMIN'] },
  { label: 'Refunds', path: '/admin/refunds', roles: ['ADMIN'] },
  { label: 'Users', path: '/admin/users', roles: ['ADMIN'], permissions: ['USER_VIEW_LIST'] },
  { label: 'Access control', path: '/admin/access', roles: ['ADMIN'] },
  { label: 'Check Ticket', path: '/staff/check-ticket', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { label: 'Counter Booking', path: '/staff/counter-booking', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
]

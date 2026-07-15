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
  { label: 'Lịch sử đặt vé', path: '/payment-history' },
]

export const staffNavigation = [
  { label: 'Kiểm tra vé', path: '/staff/check-ticket' },
  { label: 'Bán vé tại quầy', path: '/staff/counter-booking' },
]

export const adminNavigation = [
  { label: 'Admin', path: '/admin', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Rooms', path: '/admin/rooms', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Users', path: '/admin/users', permissions: ['USER_VIEW_LIST'] },
  { label: 'Reports', path: '/admin/reports', roles: ['ADMIN', 'MANAGER'] },
]

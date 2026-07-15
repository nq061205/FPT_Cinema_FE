export function getRoleHome(role) {
  const normalized = role?.toUpperCase()

  if (normalized === 'ADMIN' || normalized === 'MANAGER') return '/admin/movies'
  if (normalized === 'STAFF') return '/staff/check-ticket'

  return '/'
}

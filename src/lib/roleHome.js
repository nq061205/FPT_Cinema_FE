export function getRoleHome(role) {
  const normalized = role?.toUpperCase()

  if (normalized === 'ADMIN') return '/admin/movies'
  if (normalized === 'MANAGER') return '/manager'
  if (normalized === 'STAFF') return '/staff/check-ticket'

  return '/'
}

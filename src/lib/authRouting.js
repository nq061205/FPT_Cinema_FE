export function getDefaultRouteForUser(user) {
  const role = user?.role?.trim().toUpperCase()

  if (role === 'ADMIN' || role === 'MANAGER') return '/admin'
  if (role === 'STAFF') return '/admin/payments'
  return '/'
}

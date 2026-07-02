export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function formatDateTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatLabel(value) {
  if (!value) return '-'

  return String(value).replaceAll('_', ' ').toLowerCase()
}

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
  const d = parseDate(value);
  if (!d) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

export function formatLabel(value) {
  if (!value) return '-'

  return String(value).replaceAll('_', ' ').toLowerCase()
}

export function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0, s = 0] = value;
    return new Date(y, m - 1, d, h, min, s);
  }
  return new Date(value);
}

export function formatTime(value) {
  if (!value) return '-';
  const d = parseDate(value);
  if (!d) return '-';
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

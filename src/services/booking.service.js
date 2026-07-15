import { apiClient } from '../lib/apiClient.js'

export const bookingService = {
  create: (payload) => apiClient.post('/booking/create', payload),
  history: (payload = { page: 0, size: 10 }) => apiClient.post('/booking/list', payload),
  // Assumed staff endpoints — adjust to match the real backend contract when available.
  checkByCode: (ticketCode) => apiClient.post('/booking/check', { ticketCode }),
  checkIn: (bookingId) => apiClient.post('/booking/check-in', { bookingId }),
  confirmRefund: (bookingId) => apiClient.post('/booking/confirm-refund', { bookingId }),
}

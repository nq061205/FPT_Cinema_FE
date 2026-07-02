import { apiClient } from '../lib/apiClient.js'

export const bookingService = {
  create: (payload) => apiClient.post('/booking/create', payload),
  history: (payload = { page: 0, size: 10 }) => apiClient.post('/booking/list', payload),
}

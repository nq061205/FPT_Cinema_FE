import { apiClient } from '../lib/apiClient.js'

export const reportService = {
  booking: (payload) => apiClient.post('/reports/booking', payload),
  payment: (payload) => apiClient.post('/reports/payment', payload),
  revenue: (payload) => apiClient.post('/reports/revenue', payload),
  customer: (payload) => apiClient.post('/reports/customer', payload),
  promotion: (payload) => apiClient.post('/reports/promotion', payload),
  movie: (payload) => apiClient.post('/reports/movie', payload),
}

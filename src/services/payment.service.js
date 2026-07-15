import { apiClient } from '../lib/apiClient.js'

export const paymentService = {
  process: (payload) => apiClient.post('/payment/process', payload),
  requestRefund: (payload) => apiClient.post('/payment/refund-request', payload),
  confirmRefund: (payload) => apiClient.post('/payment/refund-confirm', payload),
  rejectRefund: (payload) => apiClient.post('/payment/refund-reject', payload),
  listPendingRefunds: () => apiClient.get('/payment/refund-requests'),
}

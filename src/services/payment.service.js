import { apiClient } from '../lib/apiClient.js'

/**
 * Payment endpoints exposed by PaymentController.
 *
 * Customer payments currently support VNPAY through /create. The cash
 * endpoints are intentionally kept here as well because they are used by
 * the staff payment desk and are protected by the backend's STAFF role.
 */
export const paymentService = {
  create: (payload) => apiClient.post('/payment/create', payload),
  cash: (payload) => apiClient.post('/payment/cash', payload),
  confirm: (payload) => apiClient.post('/payment/cash/confirm', payload),
  get: (paymentCode) => apiClient.get(`/payment/${encodeURIComponent(paymentCode)}`),
  createCash: (bookingCode) => apiClient.post('/payment/cash', { bookingCode }),
  confirmCash: (paymentCode) => apiClient.post('/payment/cash/confirm', { paymentCode }),
  history: () => apiClient.get('/payment/history'),
  getByCode: (paymentCode) => apiClient.get(`/payment/${encodeURIComponent(paymentCode)}`),
  vnpayReturn: (params = {}) => apiClient.get('/payment/vnpay/return', { params }),
  process: (payload) => apiClient.post('/payment/process', payload),
  requestRefund: (payload) => apiClient.post('/payment/refund-request', payload),
  confirmRefund: (payload) => apiClient.post('/payment/refund-confirm', payload),
  rejectRefund: (payload) => apiClient.post('/payment/refund-reject', payload),
  listPendingRefunds: () => apiClient.get('/payment/refund-requests'),
}

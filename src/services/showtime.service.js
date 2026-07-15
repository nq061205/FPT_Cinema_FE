import { apiClient } from '../lib/apiClient.js'

export const showtimeService = {
  list: (params = {}) => apiClient.get('/showtimes', { params }),
  getById: (id) => apiClient.get(`/showtimes/${id}`),
  create: (payload) => apiClient.post('/showtimes', payload),
  createBatch: (payload) => apiClient.post('/showtimes/batch', payload),
  update: (id, payload) => apiClient.put(`/showtimes/${id}`, payload),
  cancel: (id) => apiClient.delete(`/showtimes/${id}`),
  seatMap: (id) => apiClient.get(`/showtimes/${id}/seats`),
  listCompact: (payload = { page: 0, size: 5 }) => apiClient.post('/showtimes/list', payload),
  quickList: (branchId = 1, params = {}) =>
    apiClient.get(`/v1/branches/${encodeURIComponent(branchId)}/showtimes/quick`, { params }),
}

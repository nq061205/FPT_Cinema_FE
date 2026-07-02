import { apiClient } from '../lib/apiClient.js'

export const roomService = {
  list: (params = {}) => apiClient.get('/rooms', { params }),
  getById: (id) => apiClient.get(`/rooms/${id}`),
  create: (payload) => apiClient.post('/rooms', payload),
  update: (id, payload) => apiClient.put(`/rooms/${id}`, payload),
  remove: (id) => apiClient.delete(`/rooms/${id}`),
  updateStatus: (id, status) => apiClient.put(`/rooms/${id}/status`, { status }),
}

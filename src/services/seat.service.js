import { apiClient } from '../lib/apiClient.js'

export const seatService = {
  viewMap: (payload) => apiClient.post('/seat/list', payload),
  detail: (payload) => apiClient.post('/seat/detail', payload),
  getByRoom: (roomId, params = {}) => apiClient.get(`/rooms/${roomId}/seats`, { params }),
  generateSeats: (roomId, payload) => apiClient.post(`/rooms/${roomId}/seats/generate`, payload),
  update: (roomId, seatId, payload) => apiClient.put(`/rooms/${roomId}/seats/${seatId}`, payload),
  batchUpdate: (roomId, payload) => apiClient.patch(`/rooms/${roomId}/seats/batch`, payload),
  remove: (roomId, seatId) => apiClient.delete(`/rooms/${roomId}/seats/${seatId}`),
  batchRemove: (roomId, seatIds) => apiClient.delete(`/rooms/${roomId}/seats/batch`, { data: { seatIds } }),
}

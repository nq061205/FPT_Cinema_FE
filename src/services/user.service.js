import { apiClient } from '../lib/apiClient.js'

export const profileService = {
  get: () => apiClient.get('/profile'),
  update: (payload) => apiClient.patch('/profile/edit', payload),
  changePassword: (payload) => apiClient.patch('/profile/change-password', payload),
}

export const userService = {
  create: (payload) => apiClient.post('/user/create', payload),
  list: () => apiClient.get('/user/user-list'),
  getById: (id) => apiClient.get(`/user/${id}`),
  update: (id, payload) => apiClient.put(`/user/${id}`, payload),
  assignPermission: (userId, permissionId, payload = null) =>
    apiClient.put(`/user/${userId}/permissions/${permissionId}`, payload),
  assignRole: (userId, roleId) => apiClient.put(`/user/${userId}/role/${roleId}`),
}

export const permissionService = {
  create: (payload) => apiClient.post('/permissions', payload),
  update: (id, payload) => apiClient.put(`/permissions/${id}`, payload),
  assignToRole: (roleId, permissionId) => apiClient.put(`/roles/${roleId}/permissions/${permissionId}`),
}

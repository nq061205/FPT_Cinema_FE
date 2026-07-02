import { apiClient } from '../lib/apiClient.js'

export const movieService = {
  list: () => apiClient.get('/movies/list'),
  search: (payload = { page: 0, size: 12 }) => apiClient.post('/movies/view', payload),
  create: (payload) => apiClient.post('/movies/create', payload),
}

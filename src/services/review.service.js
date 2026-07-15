import { apiClient } from '../lib/apiClient.js'

export const reviewService = {
  create: (payload) => apiClient.post('/reviews', payload),
  list: (params = {}) => apiClient.get('/reviews', {params}),
  listByMovie: (movieId, params = {}) => apiClient.get(`/reviews/movie/${movieId}`, { params }),
  update: (reviewId, payload) => apiClient.put(`/reviews/${reviewId}`, payload),
  delete: (reviewId)=> apiClient.delete(`/reviews/${reviewId}`), 
}

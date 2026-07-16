import { apiClient } from '../lib/apiClient.js'

export const movieService = {
  list: () => apiClient.get('/movies/list'),
  search: (payload = { page: 0, size: 12 }) => apiClient.post('/movies/view', payload),
  create: (payload) => apiClient.post('/movies/create', payload),
  update: (id, payload) => apiClient.put(`/movies/${id}`, payload),
  remove: (id) => apiClient.delete(`/movies/${id}`),
  // The backend exposes only /movies/list and /movies/view, not GET /movies/{id}.
  getById: async (id) => {
    const movies = await apiClient.get('/movies/list')
    const movie = movies.find((item) => String(item.id) === String(id))

    if (!movie) {
      throw new Error('Movie not found.')
    }

    return movie
  },
}

import { apiClient } from '../lib/apiClient.js'

export const movieService = {
  list: () => apiClient.get('/movies/list'),
  search: (payload = { page: 0, size: 12 }) => apiClient.post('/movies/view', payload),
  create: (payload) => apiClient.post('/movies/create', payload),
  // The backend exposes only /movies/list and /movies/view, not GET /movies/{id}.
  getById: async (id) => {
    const movies = await apiClient.get('/movies/list')
    const movie = movies.find((item) => String(item.id) === String(id))

    if (!movie) {
      throw new Error('Không tìm thấy phim.')
    }

    return movie
  },
}

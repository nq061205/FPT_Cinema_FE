import { apiClient } from '../lib/apiClient.js'

export const productService = {
  list: (payload = { page: 0, size: 10 }) => apiClient.post('/product/list', payload),
  detail: (productId) => apiClient.post('/product/detail', { productId }),
  create: (payload) => apiClient.post('/product/create', payload),
  update: (id, payload) => apiClient.put(`/product/${id}`, payload),
}

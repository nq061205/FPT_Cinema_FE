import { apiClient } from '../lib/apiClient.js'

export const promotionService = {
  detail: (promotionId) => apiClient.post('/promotion/detail', { promotionId }),
  apply: (promotionId) => apiClient.post('/promotion/apply', { promotionId }),
  myPromotions: () => apiClient.post('/user-promotion/my-promotions'),
}

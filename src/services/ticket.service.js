import { apiClient } from '../lib/apiClient.js'

export const ticketService = {
  checkIn: (ticketCode) => apiClient.post('/ticket/check-in', { ticketCode }),
  lookup: (ticketCode) => apiClient.post('/ticket/lookup', { ticketCode }),
}

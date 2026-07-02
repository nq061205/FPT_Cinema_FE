import { apiClient } from '../lib/apiClient.js'

export const chatService = {
  createConversation: () => apiClient.post('/chat/conversations'),
  sendMessage: (conversationId, message) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages`, { message }),
  messages: (conversationId) => apiClient.get(`/chat/conversations/${conversationId}/messages`),
  close: (conversationId) => apiClient.put(`/chat/conversations/${conversationId}/close`),
}

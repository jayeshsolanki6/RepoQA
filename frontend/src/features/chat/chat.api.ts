import api from '@/lib/axios';
import type { ApiResponse, ChatResult, Conversation, Message } from '@/types/api';

export const chatApi = {
  createConversation: async (repositoryId: string) => {
    const response = await api.post<ApiResponse<Conversation>>(`/repositories/${repositoryId}/conversations`);
    return response.data.data;
  },
  getConversations: async (repositoryId: string) => {
    const response = await api.get<ApiResponse<Conversation[]>>(`/repositories/${repositoryId}/conversations`);
    return response.data.data;
  },
  getMessages: async (conversationId: string) => {
    const response = await api.get<ApiResponse<Message[]>>(`/conversations/${conversationId}/messages`);
    return response.data.data;
  },
  deleteConversation: async (conversationId: string) => {
    await api.delete(`/conversations/${conversationId}`);
  },
  ask: async (repositoryId: string, conversationId: string, question: string) => {
    const response = await api.post<ApiResponse<ChatResult>>(`/repositories/${repositoryId}/ask`, { conversationId, question });
    return response.data.data;
  },
};

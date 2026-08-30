import api from '@/lib/axios';
import type { ApiResponse, User } from '@/types/api';

interface AuthData {
  user: User;
  accessToken: string;
}

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/login', data);
    return response.data.data;
  },

  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/register', data);
    return response.data.data;
  },

  refresh: async () => {
    const response = await api.get<ApiResponse<AuthData>>('/auth/refresh');
    return response.data.data;
  },

  logout: async () => {
    await api.get('/auth/logout');
  },
};

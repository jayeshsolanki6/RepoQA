import api from '@/lib/axios';
import type { ApiResponse, Repository } from '@/types/api';

export const repositoryApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Repository[]>>('/repositories');
    return response.data.data;
  },
  getOne: async (repositoryId: string) => {
    const response = await api.get<ApiResponse<Repository>>(`/repositories/${repositoryId}`);
    return response.data.data;
  },
  create: async (githubUrl: string) => {
    const response = await api.post<ApiResponse<Repository>>('/repositories', { githubUrl });
    return response.data.data;
  },
  delete: async (repositoryId: string) => {
    await api.delete(`/repositories/${repositoryId}`);
  },
};

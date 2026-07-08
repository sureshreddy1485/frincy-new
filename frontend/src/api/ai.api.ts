import { apiClient } from './client';

export interface AIInsights {
  healthScore: number;
  cashFlowScore: number;
  growthScore: number;
  summary: string;
  recommendations: string[];
}

export const aiApi = {
  chat: async (businessId: string, groupId: string, message: string): Promise<string> => {
    const response = await apiClient.post('/ai/chat', { businessId, groupId, message });
    return response.data.data.message;
  },

  getInsights: async (businessId: string, groupId: string): Promise<AIInsights> => {
    const response = await apiClient.get(`/ai/insights/${businessId}/folder/${groupId}`);
    return response.data.data;
  },
};

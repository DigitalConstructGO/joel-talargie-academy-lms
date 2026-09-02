import { apiFetch } from '@/lib/api/api-client';

export interface AiChatMessageRequest {
  message: string;
  courseTitle?: string;
  locale?: string;
}

export interface AiChatMessageResponse {
  reply: string;
}

export const aiChatApi = {
  sendMessage: async (data: AiChatMessageRequest): Promise<AiChatMessageResponse> => {
    const res = (await apiFetch('/ai-chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })) as { data?: { reply?: string }; reply?: string };

    return {
      reply: res?.data?.reply || res?.reply || '',
    };
  },
};

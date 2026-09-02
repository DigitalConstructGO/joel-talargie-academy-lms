import { useMutation } from '@tanstack/react-query';
import {
  aiChatApi,
  type AiChatMessageRequest,
  type AiChatMessageResponse,
} from '../api/ai-chat.api';

export function useSendAiChatMessage() {
  return useMutation<AiChatMessageResponse, Error, AiChatMessageRequest>({
    mutationFn: (data) => aiChatApi.sendMessage(data),
  });
}

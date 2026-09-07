import { apiClient } from '../lib/api-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SendMessagePayload {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  systemInstruction?: string;
  apiKey?: string;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    reply: string;
    model: string;
  };
  message?: string;
}

export async function sendChatMessage(payload: SendMessagePayload): Promise<string> {
  const response = await apiClient.post<ChatResponse>('/ai/chat', payload);
  if (response.data.success && response.data.data?.reply) {
    return response.data.data.reply;
  }
  throw new Error(response.data.message || 'Không nhận được phản hồi từ AI.');
}

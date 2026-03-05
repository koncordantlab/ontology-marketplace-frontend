import { BackendApiClient, BACKEND_API } from '../config/backendApi';
import type { Message } from '../types/comment';

interface MessagesResponse {
  success: boolean;
  data?: { messages: Message[] };
  error?: string;
}

interface MessageResponse {
  success: boolean;
  data?: Message;
  error?: string;
}

interface SingleResponse {
  success: boolean;
  data?: { uuid: string };
  error?: string;
}

class MessageService {
  async getMessages(limit = 20, offset = 0): Promise<MessagesResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.MESSAGES.LIST, {
        params: { limit: String(limit), offset: String(offset) },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getMessage(messageId: string): Promise<MessageResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.MESSAGES.GET(messageId));
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async replyToMessage(messageId: string, content: string): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.MESSAGES.REPLY(messageId), {
        method: 'POST',
        body: { content },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async markRead(messageId: string): Promise<{ success: boolean }> {
    try {
      return await BackendApiClient.request(BACKEND_API.MESSAGES.MARK_READ(messageId), {
        method: 'PUT',
      });
    } catch (error) {
      return { success: false };
    }
  }
}

export const messageService = new MessageService();

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageService } from '../messageService';
import { BackendApiClient } from '../../config/backendApi';

vi.mock('../../config/backendApi', () => ({
  BackendApiClient: {
    request: vi.fn(),
  },
  BACKEND_API: {
    MESSAGES: {
      LIST: '/messages',
      SEND: '/messages',
      GET: (id: string) => `/messages/${id}`,
      REPLY: (id: string) => `/messages/${id}/reply`,
      MARK_READ: (id: string) => `/messages/${id}/read`,
    },
  },
}));

describe('MessageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMessages calls correct endpoint', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true, data: { messages: [] } });
    const result = await messageService.getMessages();
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/messages',
      expect.objectContaining({ params: { limit: '20', offset: '0' } })
    );
    expect(result.success).toBe(true);
  });

  it('getMessage calls GET by id', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true, data: { uuid: 'm1' } });
    await messageService.getMessage('m1');
    expect(BackendApiClient.request).toHaveBeenCalledWith('/messages/m1');
  });

  it('replyToMessage calls POST', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true, data: { uuid: 'r1' } });
    await messageService.replyToMessage('m1', 'Thanks!');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/messages/m1/reply',
      expect.objectContaining({ method: 'POST', body: { content: 'Thanks!' } })
    );
  });

  it('markRead calls PUT', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true });
    await messageService.markRead('m1');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/messages/m1/read',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('handles errors gracefully', async () => {
    vi.mocked(BackendApiClient.request).mockRejectedValue(new Error('Network error'));
    const result = await messageService.getMessages();
    expect(result.success).toBe(false);
  });
});

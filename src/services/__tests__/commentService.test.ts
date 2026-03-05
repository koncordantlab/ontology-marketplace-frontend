import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commentService } from '../commentService';
import { BackendApiClient } from '../../config/backendApi';

vi.mock('../../config/backendApi', () => ({
  BackendApiClient: {
    request: vi.fn(),
  },
  BACKEND_API: {
    COMMENTS: {
      LIST: (id: string) => `/ontologies/${id}/comments`,
      CREATE: (id: string) => `/ontologies/${id}/comments`,
      EDIT: (id: string) => `/comments/${id}`,
      DELETE: (id: string) => `/comments/${id}`,
      REPLIES: (id: string) => `/comments/${id}/replies`,
      REACTIONS: (id: string) => `/comments/${id}/reactions`,
      REMOVE_REACTION: (cid: string, emoji: string) => `/comments/${cid}/reactions/${emoji}`,
      FLAG: (id: string) => `/comments/${id}/flag`,
    },
  },
}));

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getComments calls correct endpoint', async () => {
    const mockResponse = { success: true, data: { comments: [], total: 0 } };
    vi.mocked(BackendApiClient.request).mockResolvedValue(mockResponse);

    const result = await commentService.getComments('ont-1');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/ontologies/ont-1/comments',
      expect.objectContaining({ params: { limit: '20', offset: '0' } })
    );
    expect(result.success).toBe(true);
  });

  it('createComment calls POST with content', async () => {
    const mockResponse = { success: true, data: { uuid: 'c1' } };
    vi.mocked(BackendApiClient.request).mockResolvedValue(mockResponse);

    const result = await commentService.createComment('ont-1', 'Great!');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/ontologies/ont-1/comments',
      expect.objectContaining({ method: 'POST', body: { content: 'Great!' } })
    );
    expect(result.success).toBe(true);
  });

  it('editComment calls PUT', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true });
    await commentService.editComment('c1', 'Updated');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/comments/c1',
      expect.objectContaining({ method: 'PUT', body: { content: 'Updated' } })
    );
  });

  it('deleteComment calls DELETE', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true });
    await commentService.deleteComment('c1');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/comments/c1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('createReply calls POST on replies endpoint', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true, data: { uuid: 'r1' } });
    await commentService.createReply('c1', 'Nice reply');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/comments/c1/replies',
      expect.objectContaining({ method: 'POST', body: { content: 'Nice reply' } })
    );
  });

  it('toggleReaction calls POST with emoji', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true });
    await commentService.toggleReaction('c1', '👍');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/comments/c1/reactions',
      expect.objectContaining({ method: 'POST', body: { emoji: '👍' } })
    );
  });

  it('flagComment calls POST with flag data', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true });
    await commentService.flagComment('c1', { reason: 'spam' });
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/comments/c1/flag',
      expect.objectContaining({ method: 'POST', body: { reason: 'spam' } })
    );
  });

  it('handles errors gracefully', async () => {
    vi.mocked(BackendApiClient.request).mockRejectedValue(new Error('Network error'));
    const result = await commentService.getComments('ont-1');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

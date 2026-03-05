import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activityService } from '../activityService';
import { BackendApiClient } from '../../config/backendApi';

vi.mock('../../config/backendApi', () => ({
  BackendApiClient: {
    request: vi.fn(),
  },
  BACKEND_API: {
    ACTIVITY: {
      FEED: '/users/me/activity',
      UNREAD_COUNT: '/users/me/activity/unread-count',
      MARK_READ: (id: string) => `/users/me/activity/${id}/read`,
      MARK_ALL_READ: '/users/me/activity/read-all',
    },
  },
}));

describe('ActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getActivityFeed calls correct endpoint', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true, data: { items: [] } });
    const result = await activityService.getActivityFeed();
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/users/me/activity',
      expect.objectContaining({ params: expect.objectContaining({ limit: '20', offset: '0' }) })
    );
    expect(result.success).toBe(true);
  });

  it('getActivityFeed with search and type filter', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true, data: { items: [] } });
    await activityService.getActivityFeed(10, 0, 'comment', 'hello');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/users/me/activity',
      expect.objectContaining({
        params: expect.objectContaining({ type: 'comment', search: 'hello' })
      })
    );
  });

  it('getUnreadCount returns count', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true, data: { count: 5 } });
    const result = await activityService.getUnreadCount();
    expect(result.data?.count).toBe(5);
  });

  it('markRead calls PUT', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true });
    await activityService.markRead('item-1');
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/users/me/activity/item-1/read',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('markAllRead calls PUT', async () => {
    vi.mocked(BackendApiClient.request).mockResolvedValue({ success: true });
    await activityService.markAllRead();
    expect(BackendApiClient.request).toHaveBeenCalledWith(
      '/users/me/activity/read-all',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

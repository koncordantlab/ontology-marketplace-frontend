import { BackendApiClient, BACKEND_API } from '../config/backendApi';
import type { ActivityItem } from '../types/comment';

interface ActivityResponse {
  success: boolean;
  data?: { items: ActivityItem[] };
  error?: string;
}

interface UnreadCountResponse {
  success: boolean;
  data?: { count: number };
  error?: string;
}

class ActivityService {
  async getActivityFeed(
    limit = 20,
    offset = 0,
    typeFilter?: string,
    search?: string
  ): Promise<ActivityResponse> {
    try {
      const params: Record<string, string> = {
        limit: String(limit),
        offset: String(offset),
      };
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;

      return await BackendApiClient.request(BACKEND_API.ACTIVITY.FEED, { params });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.ACTIVITY.UNREAD_COUNT);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async markRead(itemId: string): Promise<{ success: boolean }> {
    try {
      return await BackendApiClient.request(BACKEND_API.ACTIVITY.MARK_READ(itemId), {
        method: 'PUT',
      });
    } catch (error) {
      return { success: false };
    }
  }

  async markAllRead(): Promise<{ success: boolean }> {
    try {
      return await BackendApiClient.request(BACKEND_API.ACTIVITY.MARK_ALL_READ, {
        method: 'PUT',
      });
    } catch (error) {
      return { success: false };
    }
  }
}

export const activityService = new ActivityService();

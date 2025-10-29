/**
 * Service to manage user account data and permissions
 * Fetches user profile and editable ontology IDs from /get_user endpoint
 */

import { BackendApiClient } from '../config/backendApi';

export interface UserAccount {
  name: string;
  email: string;
  image_url?: string;
  is_public: boolean;
  permissions: {
    can_edit_ontologies: string[];
    can_delete_ontologies: string[];
  };
}

export interface UserAccountResponse {
  name: string;
  email: string;
  image_url?: string;
  is_public: boolean;
  permissions: {
    can_edit_ontologies: string[];
    can_delete_ontologies: string[];
  };
}

class UserService {
  private userAccount: UserAccount | null = null;
  private editableIds: Set<string> = new Set();
  private deletableIds: Set<string> = new Set();
  private lastFetched: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private fetchPromise: Promise<UserAccount | null> | null = null;

  /**
   * Fetch user account data from backend
   */
  private async fetchUserAccount(): Promise<UserAccount | null> {
    try {
      const response: UserAccountResponse = await BackendApiClient.request('/get_user', {
        method: 'GET',
      });
      
      // Normalize the response
      const account: UserAccount = {
        name: response.name || '',
        email: response.email || '',
        image_url: response.image_url,
        is_public: response.is_public ?? false,
        permissions: {
          can_edit_ontologies: Array.isArray(response.permissions?.can_edit_ontologies)
            ? response.permissions.can_edit_ontologies
            : [],
          can_delete_ontologies: Array.isArray(response.permissions?.can_delete_ontologies)
            ? response.permissions.can_delete_ontologies
            : [],
        },
      };

      return account;
    } catch (error) {
      console.error('Failed to fetch user account:', error);
      return null;
    }
  }

  /**
   * Refresh user account and permissions cache
   */
  async refresh(): Promise<UserAccount | null> {
    // If already fetching, wait for that to complete
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const account = await this.fetchUserAccount();
        if (account) {
          this.userAccount = account;
          this.editableIds = new Set(account.permissions.can_edit_ontologies);
          this.deletableIds = new Set(account.permissions.can_delete_ontologies);
          this.lastFetched = Date.now();
        } else {
          // If fetch failed, don't clear existing cache
          return this.userAccount;
        }
        return account;
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Get cached user account data
   */
  getUserAccount(): UserAccount | null {
    return this.userAccount;
  }

  /**
   * Check if an ontology ID is editable (from cache, no network call)
   */
  canEdit(ontologyId: string): boolean {
    if (!ontologyId) return false;
    const normalizedId = ontologyId.trim();
    return this.editableIds.has(normalizedId);
  }

  /**
   * Check if an ontology ID is deletable (from cache, no network call)
   */
  canDelete(ontologyId: string): boolean {
    if (!ontologyId) return false;
    const normalizedId = ontologyId.trim();
    return this.deletableIds.has(normalizedId);
  }

  /**
   * Clear the cache (e.g., on logout)
   */
  clear(): void {
    this.userAccount = null;
    this.editableIds.clear();
    this.deletableIds.clear();
    this.lastFetched = 0;
    this.fetchPromise = null;
  }

  /**
   * Check if cache is stale and needs refresh
   */
  isStale(): boolean {
    return Date.now() - this.lastFetched > this.CACHE_TTL_MS;
  }

  /**
   * Get cache status for debugging
   */
  getCacheInfo(): { 
    hasUser: boolean; 
    editableCount: number; 
    deletableCount: number; 
    lastFetched: Date | null; 
    isStale: boolean 
  } {
    return {
      hasUser: this.userAccount !== null,
      editableCount: this.editableIds.size,
      deletableCount: this.deletableIds.size,
      lastFetched: this.lastFetched ? new Date(this.lastFetched) : null,
      isStale: this.isStale(),
    };
  }
}

export const userService = new UserService();

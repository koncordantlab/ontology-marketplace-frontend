import { BackendApiClient, BACKEND_API } from '../config/backendApi';
import type { Comment, NewFlag } from '../types/comment';

interface CommentResponse {
  success: boolean;
  data?: { comments: Comment[]; total: number };
  error?: string;
}

interface SingleResponse {
  success: boolean;
  data?: { uuid: string };
  error?: string;
}

class CommentService {
  async getComments(ontologyId: string, limit = 20, offset = 0): Promise<CommentResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.LIST(ontologyId), {
        params: { limit: String(limit), offset: String(offset) },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async createComment(ontologyId: string, content: string): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.CREATE(ontologyId), {
        method: 'POST',
        body: { content },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async editComment(commentId: string, content: string): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.EDIT(commentId), {
        method: 'PUT',
        body: { content },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteComment(commentId: string): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.DELETE(commentId), {
        method: 'DELETE',
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getReplies(commentId: string, limit = 20, offset = 0): Promise<CommentResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.REPLIES(commentId), {
        params: { limit: String(limit), offset: String(offset) },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async createReply(commentId: string, content: string): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.REPLIES(commentId), {
        method: 'POST',
        body: { content },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async toggleReaction(commentId: string, emoji: string): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.REACTIONS(commentId), {
        method: 'POST',
        body: { emoji },
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async removeReaction(commentId: string, emoji: string): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.REMOVE_REACTION(commentId, emoji), {
        method: 'DELETE',
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async flagComment(commentId: string, flag: NewFlag): Promise<SingleResponse> {
    try {
      return await BackendApiClient.request(BACKEND_API.COMMENTS.FLAG(commentId), {
        method: 'POST',
        body: flag,
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const commentService = new CommentService();

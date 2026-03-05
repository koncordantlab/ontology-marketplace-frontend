import React, { useState, useEffect, useCallback } from 'react';
import { CommentItem } from './CommentItem';
import { FlagDialog } from './FlagDialog';
import { commentService } from '../services/commentService';
import { Send, MessageSquare } from 'lucide-react';
import type { Comment, ValidEmoji, NewFlag } from '../types/comment';

interface CommentSystemProps {
  ontologyId: string;
  currentUserEmail?: string;
  isOntologyOwner?: boolean;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({
  ontologyId,
  currentUserEmail,
  isOntologyOwner,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [flagCommentId, setFlagCommentId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const result = await commentService.getComments(ontologyId);
    if (result.success && result.data) {
      setComments(result.data.comments);
    } else {
      setError(result.error || 'Failed to load comments');
    }
    setLoading(false);
  }, [ontologyId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || newComment.length > 2000) return;
    const content = newComment.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update: append temp comment immediately
    const tempComment: Comment = {
      uuid: tempId,
      content,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: null,
      author_email: currentUserEmail || '',
      reply_count: 0,
      reactions: {},
      is_editable: true,
    };
    setComments(prev => [tempComment, ...prev]);
    setNewComment('');
    setSubmitting(true);

    const result = await commentService.createComment(ontologyId, content);
    setSubmitting(false);
    if (result.success) {
      // Replace temp comment with server response by re-fetching
      fetchComments();
    } else {
      // Rollback: remove temp comment
      setComments(prev => prev.filter(c => c.uuid !== tempId));
      setNewComment(content); // Restore input
      setError(result.error || 'Failed to post comment');
    }
  };

  const handleReact = async (commentId: string, emoji: ValidEmoji) => {
    // Optimistic update: toggle reaction in local state immediately
    setComments(prev => prev.map(c => {
      if (c.uuid !== commentId) return c;
      const reactions = { ...c.reactions };
      const current = reactions[emoji] || { count: 0, user_reacted: false };
      if (current.user_reacted) {
        reactions[emoji] = { count: Math.max(0, current.count - 1), user_reacted: false };
      } else {
        reactions[emoji] = { count: current.count + 1, user_reacted: true };
      }
      return { ...c, reactions };
    }));

    // Fire API call, rollback on error
    const result = await commentService.toggleReaction(commentId, emoji);
    if (!result.success) {
      fetchComments(); // Rollback by re-fetching
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    const result = await commentService.createReply(commentId, replyContent.trim());
    if (result.success) {
      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
      loadReplies(commentId);
    }
  };

  const loadReplies = async (commentId: string) => {
    const result = await commentService.getReplies(commentId);
    if (result.success && result.data) {
      setReplies((prev) => ({ ...prev, [commentId]: (result.data as any).replies || [] }));
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    // Optimistic update: update content in local state immediately
    const previousComments = comments;
    setComments(prev => prev.map(c =>
      c.uuid === commentId ? { ...c, content, updated_at: new Date().toISOString() } : c
    ));

    const result = await commentService.editComment(commentId, content);
    if (!result.success) {
      setComments(previousComments); // Rollback
      setError(result.error || 'Failed to edit comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    // Optimistic update: remove comment from local state immediately
    const previousComments = comments;
    setComments(prev => prev.filter(c => c.uuid !== commentId));

    const result = await commentService.deleteComment(commentId);
    if (!result.success) {
      setComments(previousComments); // Rollback
      setError(result.error || 'Failed to delete comment');
    }
  };

  const handleFlag = async (flag: NewFlag) => {
    if (!flagCommentId) return;
    await commentService.flagComment(flagCommentId, flag);
    setFlagCommentId(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8" data-testid="loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md" data-testid="error-message">
          {error}
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-8" data-testid="empty-state">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No comments yet</p>
          <p className="text-gray-400 text-xs mt-1">Be the first to comment!</p>
        </div>
      ) : (
        comments.map((comment) => (
          <div key={comment.uuid}>
            <CommentItem
              comment={comment}
              onReact={handleReact}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onFlag={(id) => setFlagCommentId(id)}
              currentUserEmail={currentUserEmail}
              isOntologyOwner={isOntologyOwner}
            />

            {replyingTo === comment.uuid && (
              <div className="ml-11 mt-2">
                <div className="flex gap-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    maxLength={2000}
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    data-testid="reply-input"
                  />
                  <button
                    onClick={() => handleSubmitReply(comment.uuid)}
                    disabled={!replyContent.trim()}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {/* Show existing replies */}
                {replies[comment.uuid]?.map((reply) => (
                  <div key={reply.uuid} className="mt-2 ml-4 p-2 bg-gray-100 rounded text-sm">
                    <span className="font-medium text-gray-700">{reply.author_email}</span>
                    <p className="text-gray-600">{reply.content}</p>
                  </div>
                ))}
                <button
                  onClick={() => loadReplies(comment.uuid)}
                  className="text-xs text-blue-600 mt-1 ml-4"
                >
                  Load replies
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* New comment input */}
      {submitting && (
        <div className="flex items-center gap-2 pt-4 border-t text-sm text-gray-500" data-testid="submitting-indicator">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Posting comment...
        </div>
      )}
      <div className={`flex gap-2 ${submitting ? '' : 'pt-4 border-t'}`}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength={2000}
          rows={2}
          disabled={submitting}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-100"
          data-testid="comment-input"
        />
        <button
          onClick={handleSubmitComment}
          disabled={submitting || !newComment.trim() || newComment.length > 2000}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          data-testid="submit-comment"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="text-xs text-gray-400 text-right">{newComment.length}/2000</p>

      <FlagDialog
        isOpen={flagCommentId !== null}
        onClose={() => setFlagCommentId(null)}
        onSubmit={handleFlag}
      />
    </div>
  );
};

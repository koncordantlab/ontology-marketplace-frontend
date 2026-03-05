import React, { useState } from 'react';
import { MoreHorizontal, MessageSquare, Edit2, Trash2, Flag } from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';
import { timeAgo } from '../utils/timeAgo';
import type { Comment, ValidEmoji } from '../types/comment';

interface CommentItemProps {
  comment: Comment;
  onReact: (commentId: string, emoji: ValidEmoji) => void;
  onReply: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onFlag: (commentId: string) => void;
  currentUserEmail?: string;
  isOntologyOwner?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = React.memo(({
  comment,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onFlag,
  currentUserEmail,
  isOntologyOwner,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = currentUserEmail === comment.author_email;
  const canDelete = isAuthor || isOntologyOwner;

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(comment.uuid, editContent.trim());
      setEditing(false);
    }
  };

  if (comment.is_deleted) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg text-gray-400 text-sm italic" data-testid="deleted-comment">
        This comment has been deleted.
      </div>
    );
  }

  return (
    <div className="flex space-x-3 p-3 bg-gray-50 rounded-lg" data-testid="comment-item">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {getInitials(comment.author_email)}
          </span>
        </div>
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{comment.author_email}</p>
            <p className="text-xs text-gray-500">{timeAgo(comment.created_at)}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600"
              data-testid="comment-menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border rounded-md shadow-lg z-10">
                {comment.is_editable && isAuthor && (
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    data-testid="edit-button"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => { onDelete?.(comment.uuid); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    data-testid="delete-button"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
                <button
                  onClick={() => { onFlag(comment.uuid); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  data-testid="flag-button"
                >
                  <Flag className="h-3 w-3" /> Flag
                </button>
              </div>
            )}
          </div>
        </div>

        {editing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              data-testid="edit-textarea"
            />
            <div className="flex gap-2 mt-1">
              <button onClick={handleSaveEdit} className="text-xs text-blue-600">Save</button>
              <button onClick={() => setEditing(false)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
        )}

        <div className="mt-2">
          <ReactionPicker
            reactions={comment.reactions}
            onReact={(emoji) => onReact(comment.uuid, emoji)}
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => onReply(comment.uuid)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
            data-testid="reply-button"
          >
            <MessageSquare className="h-3 w-3" />
            Reply {comment.reply_count > 0 && `(${comment.reply_count})`}
          </button>
        </div>
      </div>
    </div>
  );
});

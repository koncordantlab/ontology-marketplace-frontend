import React, { useState } from 'react';
import { X, MessageSquare, MoreHorizontal, Send } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
}

interface CommentsDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  ontologyId?: string;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onToggle,
  ontologyId,
}) => {
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Dr. Sarah Chen',
      content: 'The structure looks great! Consider adding more detailed relationships for the medical terms.',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      author: 'Mike Johnson',
      content: 'I found a few inconsistencies in the hierarchy. Let me know if you want me to elaborate.',
      timestamp: '5 hours ago',
    },
    {
      id: '3',
      author: 'Prof. Emily Watson',
      content: 'Excellent work on this ontology. The citation relationships are well-defined.',
      timestamp: '1 day ago',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    // In a real app, this would submit to the backend
    console.log('Submitting comment:', newComment);
    setNewComment('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <>
      {/* Toggle button when drawer is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 z-40"
          title="Open Comments"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '73px', height: 'calc(100vh - 73px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
            title="Close Comments"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-400 text-xs mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {getInitials(comment.author)}
                    </span>
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                      <p className="text-xs text-gray-500">{comment.timestamp}</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none text-sm"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

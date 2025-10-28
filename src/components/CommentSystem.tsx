import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  link?: string;
}

export const CommentSystem: React.FC = () => {
  const [comments] = useState<Comment[]>([]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
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
            
            <div className="mt-1">
              {comment.link ? (
                <a 
                  href={`https://${comment.content}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {comment.content}
                </a>
              ) : (
                <p className="text-sm text-gray-700">{comment.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
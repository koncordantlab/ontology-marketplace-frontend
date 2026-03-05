import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageReplyFormProps {
  onSubmit: (content: string) => void;
}

export const MessageReplyForm: React.FC<MessageReplyFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <div className="flex gap-2" data-testid="reply-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        maxLength={5000}
        rows={3}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        data-testid="reply-textarea"
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim()}
        className="self-end p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        data-testid="reply-submit"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
};

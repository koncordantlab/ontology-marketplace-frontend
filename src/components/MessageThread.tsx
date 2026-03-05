import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MessageReplyForm } from './MessageReplyForm';
import { messageService } from '../services/messageService';
import type { Message } from '../types/comment';

interface MessageThreadProps {
  messageId: string;
  onBack: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ messageId, onBack }) => {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMessage = async () => {
    setLoading(true);
    const result = await messageService.getMessage(messageId);
    if (result.success && result.data) {
      setMessage(result.data);
      if (!result.data.is_read) {
        await messageService.markRead(messageId);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessage();
  }, [messageId]);

  const handleReplySubmit = async (content: string) => {
    await messageService.replyToMessage(messageId, content);
    fetchMessage();
  };

  if (loading) {
    return (
      <div className="text-center py-8" data-testid="thread-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!message) {
    return <div className="text-center py-8 text-gray-500">Message not found</div>;
  }

  return (
    <div data-testid="message-thread">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-blue-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to inbox
      </button>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{message.subject}</h3>
        <p className="text-xs text-gray-500 mb-3">From: {message.sender_email} · {message.created_at}</p>
        <p className="text-sm text-gray-700">{message.content}</p>
      </div>

      {message.replies && message.replies.length > 0 && (
        <div className="space-y-3 mb-4">
          {message.replies.map((reply) => (
            <div key={reply.uuid} className="ml-4 bg-gray-50 rounded-lg border p-3">
              <p className="text-xs text-gray-500 mb-1">{reply.sender_email} · {reply.created_at}</p>
              <p className="text-sm text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      <MessageReplyForm onSubmit={handleReplySubmit} />
    </div>
  );
};

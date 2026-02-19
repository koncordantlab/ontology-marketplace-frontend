import React, { useState } from 'react';

interface Message {
  id: string;
  ontologyId: string;
  ontologyName: string;
  author: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'comment' | 'mention' | 'update';
}

interface MessagesViewProps {
  onNavigate: (view: string, ontologyId?: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onNavigate }) => {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      ontologyId: 'ont-1',
      ontologyName: 'Medical Terminology Ontology',
      author: 'Dr. Sarah Chen',
      content: 'Great work on the hierarchy structure! I have a few suggestions for the cardiovascular section.',
      timestamp: '2 hours ago',
      isRead: false,
      type: 'comment',
    },
    {
      id: '2',
      ontologyId: 'ont-2',
      ontologyName: 'E-Commerce Product Taxonomy',
      author: 'Mike Johnson',
      content: 'The product categorization looks solid. Can we add more granularity to the electronics category?',
      timestamp: '5 hours ago',
      isRead: false,
      type: 'comment',
    },
    {
      id: '3',
      ontologyId: 'ont-3',
      ontologyName: 'Academic Research Ontology',
      author: 'Prof. Emily Watson',
      content: 'I\'ve updated the citation relationships as discussed. Please review when you get a chance.',
      timestamp: '1 day ago',
      isRead: false,
      type: 'update',
    },
  ]);

  const getTypeLabel = (type: Message['type']) => {
    switch (type) {
      case 'comment':
        return 'Comment';
      case 'mention':
        return 'Mention';
      case 'update':
        return 'Update';
      default:
        return 'Message';
    }
  };

  const getTypeColor = (type: Message['type']) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-100 text-blue-800';
      case 'mention':
        return 'bg-purple-100 text-purple-800';
      case 'update':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleMessageClick = (message: Message) => {
    onNavigate('ontology-details', message.ontologyId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-600 mt-1">
            Stay updated with comments and activity on your ontologies
          </p>
        </div>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            messages.map((message) => (
              <button
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`w-full text-left bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow duration-200 ${
                  !message.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {getInitials(message.author)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{message.author}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(message.type)}`}>
                          {getTypeLabel(message.type)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>

                    <p className="text-sm text-blue-600 font-medium mb-1">
                      {message.ontologyName}
                    </p>

                    <p className="text-sm text-gray-700 line-clamp-2">
                      {message.content}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

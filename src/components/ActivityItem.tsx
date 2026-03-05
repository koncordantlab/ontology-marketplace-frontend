import React from 'react';
import { MessageSquare, Reply, Heart, Mail } from 'lucide-react';
import type { ActivityItem as ActivityItemType } from '../types/comment';

interface ActivityItemProps {
  item: ActivityItemType;
  onClick: (item: ActivityItemType) => void;
  onMarkRead: (itemId: string) => void;
}

const typeIcons = {
  comment: MessageSquare,
  reply: Reply,
  reaction: Heart,
  message: Mail,
};

const typeColors = {
  comment: 'bg-blue-100 text-blue-800',
  reply: 'bg-green-100 text-green-800',
  reaction: 'bg-pink-100 text-pink-800',
  message: 'bg-purple-100 text-purple-800',
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ item, onClick, onMarkRead }) => {
  const Icon = typeIcons[item.type] || MessageSquare;

  const handleClick = () => {
    if (!item.is_read) {
      onMarkRead(item.id);
    }
    onClick(item);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow duration-200 ${
        !item.is_read ? 'border-l-4 border-l-blue-500' : ''
      }`}
      data-testid="activity-item"
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${typeColors[item.type]}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </span>
            <span className="text-xs text-gray-500">{item.created_at}</span>
          </div>

          {item.ontology_name && (
            <p className="text-sm text-blue-600 font-medium mb-1">{item.ontology_name}</p>
          )}

          {item.subject && (
            <p className={`text-sm font-medium mb-1 ${!item.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
              {item.subject}
            </p>
          )}

          <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
        </div>
      </div>
    </button>
  );
};

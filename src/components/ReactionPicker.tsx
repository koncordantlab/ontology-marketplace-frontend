import React from 'react';
import { VALID_EMOJIS, ValidEmoji } from '../types/comment';

interface ReactionPickerProps {
  reactions: Record<string, { count: number; user_reacted: boolean }>;
  onReact: (emoji: ValidEmoji) => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ reactions, onReact }) => {
  const safeReactions = reactions || {};
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {VALID_EMOJIS.map((emoji) => {
        const reaction = safeReactions[emoji];
        const count = reaction?.count || 0;
        const userReacted = reaction?.user_reacted || false;

        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
              userReacted
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
            title={emoji}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
};

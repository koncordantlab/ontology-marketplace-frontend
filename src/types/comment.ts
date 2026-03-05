export interface Comment {
  uuid: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  author_email: string;
  author_name?: string;
  reply_count: number;
  reactions: Record<string, { count: number; user_reacted: boolean }>;
  is_editable: boolean;
}

export interface NewComment {
  content: string;
}

export interface NewReply {
  content: string;
}

export interface NewReaction {
  emoji: string;
}

export const VALID_EMOJIS = ['\ud83d\udc4d', '\ud83d\udc4e', '\u2764\ufe0f', '\ud83d\ude02', '\ud83c\udf89', '\ud83d\udd25'] as const;
export type ValidEmoji = typeof VALID_EMOJIS[number];

export interface Flag {
  uuid: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface NewFlag {
  reason: 'spam' | 'harassment' | 'misinformation' | 'off-topic' | 'other';
  details?: string;
}

export const FLAG_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'off-topic', label: 'Off-topic' },
  { value: 'other', label: 'Other' },
] as const;

export interface Message {
  uuid: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_email: string;
  replies?: MessageReply[];
}

export interface MessageReply {
  uuid: string;
  content: string;
  created_at: string;
  sender_email: string;
}

export interface NewMessage {
  recipient_fuid: string;
  subject: string;
  content: string;
}

export interface ActivityItem {
  id: string;
  type: 'comment' | 'reply' | 'reaction' | 'message';
  created_at: string;
  content: string;
  subject: string | null;
  ontology_name: string | null;
  ontology_id: string | null;
  is_read: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items?: T[];
    comments?: T[];
    replies?: T[];
    messages?: T[];
    total?: number;
  };
}

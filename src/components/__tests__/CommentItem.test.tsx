import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentItem } from '../CommentItem';
import type { Comment } from '../../types/comment';

const mockComment: Comment = {
  uuid: 'c1',
  content: 'Great ontology!',
  is_deleted: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: null,
  author_email: 'user@test.com',
  reply_count: 2,
  reactions: { '👍': { count: 3, user_reacted: true } },
  is_editable: true,
};

describe('CommentItem', () => {
  const onReact = vi.fn();
  const onReply = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onFlag = vi.fn();

  it('renders author, content, and relative time', () => {
    render(
      <CommentItem comment={mockComment} onReact={onReact} onReply={onReply} onFlag={onFlag} />
    );
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByText('Great ontology!')).toBeInTheDocument();
    // Should show relative time, not raw ISO string
    expect(screen.queryByText('2024-01-01T00:00:00')).not.toBeInTheDocument();
  });

  it('shows reaction counts', () => {
    render(
      <CommentItem comment={mockComment} onReact={onReact} onReply={onReply} onFlag={onFlag} />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows reply button with count', () => {
    render(
      <CommentItem comment={mockComment} onReact={onReact} onReply={onReply} onFlag={onFlag} />
    );
    expect(screen.getByTestId('reply-button')).toHaveTextContent('Reply (2)');
  });

  it('renders when comment has no reactions field', () => {
    const noReactions = { ...mockComment, reactions: undefined as any };
    render(
      <CommentItem comment={noReactions} onReact={onReact} onReply={onReply} onFlag={onFlag} />
    );
    expect(screen.getByText('Great ontology!')).toBeInTheDocument();
    // Should still render all 6 emoji buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('shows deleted placeholder for deleted comments', () => {
    const deleted = { ...mockComment, is_deleted: true };
    render(
      <CommentItem comment={deleted} onReact={onReact} onReply={onReply} onFlag={onFlag} />
    );
    expect(screen.getByTestId('deleted-comment')).toBeInTheDocument();
    expect(screen.getByText('This comment has been deleted.')).toBeInTheDocument();
  });

  it('shows delete button for ontology owner', () => {
    render(
      <CommentItem
        comment={mockComment}
        onReact={onReact} onReply={onReply} onFlag={onFlag}
        onDelete={onDelete} isOntologyOwner={true}
      />
    );
    fireEvent.click(screen.getByTestId('comment-menu'));
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });

  it('calls onReply when reply button clicked', () => {
    render(
      <CommentItem comment={mockComment} onReact={onReact} onReply={onReply} onFlag={onFlag} />
    );
    fireEvent.click(screen.getByTestId('reply-button'));
    expect(onReply).toHaveBeenCalledWith('c1');
  });
});

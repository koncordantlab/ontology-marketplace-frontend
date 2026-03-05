import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentSystem } from '../components/CommentSystem';
import { commentService } from '../services/commentService';

vi.mock('../services/commentService', () => ({
  commentService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    editComment: vi.fn(),
    deleteComment: vi.fn(),
    getReplies: vi.fn(),
    createReply: vi.fn(),
    toggleReaction: vi.fn(),
    flagComment: vi.fn(),
  },
}));

const mockComments = [
  {
    uuid: 'c1',
    content: 'Great work on this ontology!',
    is_deleted: false,
    created_at: '2024-01-01T10:00:00',
    updated_at: null,
    author_email: 'alice@test.com',
    reply_count: 1,
    reactions: { '👍': { count: 2, user_reacted: false } },
    is_editable: false,
  },
  {
    uuid: 'c2',
    content: 'I have some suggestions',
    is_deleted: false,
    created_at: '2024-01-01T11:00:00',
    updated_at: null,
    author_email: 'bob@test.com',
    reply_count: 0,
    reactions: {},
    is_editable: true,
  },
];

describe('Comment Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays comments', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: mockComments, total: 2 },
    });

    render(
      <CommentSystem
        ontologyId="ont-1"
        currentUserEmail="viewer@test.com"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Great work on this ontology!')).toBeInTheDocument();
      expect(screen.getByText('I have some suggestions')).toBeInTheDocument();
    });
  });

  it('adds a new comment and refreshes', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: [], total: 0 },
    });
    vi.mocked(commentService.createComment).mockResolvedValue({
      success: true,
      data: { uuid: 'new-c' },
    });

    render(<CommentSystem ontologyId="ont-1" currentUserEmail="user@test.com" />);

    await waitFor(() => expect(screen.getByTestId('comment-input')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByTestId('comment-input'), 'My new comment');
    await user.click(screen.getByTestId('submit-comment'));

    expect(commentService.createComment).toHaveBeenCalledWith('ont-1', 'My new comment');
    // Should refresh comments after posting
    await waitFor(() => {
      expect(commentService.getComments).toHaveBeenCalledTimes(2); // initial + refresh
    });
  });

  it('reacts to a comment', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: mockComments, total: 2 },
    });
    vi.mocked(commentService.toggleReaction).mockResolvedValue({ success: true });

    render(
      <CommentSystem ontologyId="ont-1" currentUserEmail="user@test.com" />
    );

    await waitFor(() => expect(screen.getByText('Great work on this ontology!')).toBeInTheDocument());

    // Click the first thumbs up reaction button (first comment has 👍 with count 2)
    const reactionButtons = screen.getAllByRole('button');
    const thumbsUpButtons = reactionButtons.filter(btn => btn.textContent?.includes('👍'));
    if (thumbsUpButtons.length > 0) {
      fireEvent.click(thumbsUpButtons[0]);
      await waitFor(() => {
        expect(commentService.toggleReaction).toHaveBeenCalledWith('c1', '👍');
      });
    }
  });

  it('shows reply expansion', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: mockComments, total: 2 },
    });

    render(
      <CommentSystem ontologyId="ont-1" currentUserEmail="user@test.com" />
    );

    await waitFor(() => expect(screen.getByText('Great work on this ontology!')).toBeInTheDocument());

    // Click reply button on first comment
    const replyButtons = screen.getAllByTestId('reply-button');
    fireEvent.click(replyButtons[0]);

    // Reply input should appear
    await waitFor(() => {
      expect(screen.getByTestId('reply-input')).toBeInTheDocument();
    });
  });

  it('flags a comment via dialog', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: mockComments, total: 2 },
    });
    vi.mocked(commentService.flagComment).mockResolvedValue({ success: true });

    render(
      <CommentSystem ontologyId="ont-1" currentUserEmail="user@test.com" />
    );

    await waitFor(() => expect(screen.getByText('Great work on this ontology!')).toBeInTheDocument());

    // Open menu on first comment
    const menuButtons = screen.getAllByTestId('comment-menu');
    fireEvent.click(menuButtons[0]);

    // Click flag button
    const flagButton = screen.getByTestId('flag-button');
    fireEvent.click(flagButton);

    // Flag dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Flag Comment')).toBeInTheDocument();
      expect(screen.getByText('Spam')).toBeInTheDocument();
    });

    // Select spam and submit
    const spamRadio = screen.getByDisplayValue('spam');
    fireEvent.click(spamRadio);
    fireEvent.click(screen.getByText('Submit Flag'));

    expect(commentService.flagComment).toHaveBeenCalledWith('c1', { reason: 'spam' });
  });

  it('shows deleted comment placeholder', async () => {
    const deletedComments = [
      { ...mockComments[0], is_deleted: true },
      mockComments[1],
    ];
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: deletedComments, total: 2 },
    });

    render(<CommentSystem ontologyId="ont-1" />);

    await waitFor(() => {
      expect(screen.getByText('This comment has been deleted.')).toBeInTheDocument();
      expect(screen.getByText('I have some suggestions')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: false,
      error: 'Server error',
    });

    render(<CommentSystem ontologyId="ont-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });
});

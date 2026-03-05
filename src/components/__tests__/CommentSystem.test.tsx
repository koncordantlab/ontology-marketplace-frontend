import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentSystem } from '../CommentSystem';
import { commentService } from '../../services/commentService';

vi.mock('../../services/commentService', () => ({
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

const mockComment = {
  uuid: 'c1',
  content: 'Test comment',
  is_deleted: false,
  created_at: '2024-01-01T00:00:00',
  updated_at: null,
  author_email: 'user@test.com',
  reply_count: 0,
  reactions: {},
  is_editable: false,
};

describe('CommentSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(commentService.getComments).mockReturnValue(new Promise(() => {}));
    render(<CommentSystem ontologyId="ont-1" />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('fetches comments on mount', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: [mockComment], total: 1 },
    });
    render(<CommentSystem ontologyId="ont-1" />);
    await waitFor(() => {
      expect(commentService.getComments).toHaveBeenCalledWith('ont-1');
      expect(screen.getByText('Test comment')).toBeInTheDocument();
    });
  });

  it('shows empty state when no comments', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: [], total: 0 },
    });
    render(<CommentSystem ontologyId="ont-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('shows error state', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: false,
      error: 'Network error',
    });
    render(<CommentSystem ontologyId="ont-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('submits new comment', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: [], total: 0 },
    });
    vi.mocked(commentService.createComment).mockResolvedValue({
      success: true,
      data: { uuid: 'new-c' },
    });

    render(<CommentSystem ontologyId="ont-1" />);
    await waitFor(() => expect(screen.getByTestId('comment-input')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByTestId('comment-input'), 'New comment');
    await user.click(screen.getByTestId('submit-comment'));

    expect(commentService.createComment).toHaveBeenCalledWith('ont-1', 'New comment');
  });

  it('shows submitting indicator and disables input while posting', async () => {
    let resolveCreate: (value: any) => void;
    const createPromise = new Promise((resolve) => { resolveCreate = resolve; });

    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: [], total: 0 },
    });
    vi.mocked(commentService.createComment).mockReturnValue(createPromise as any);

    render(<CommentSystem ontologyId="ont-1" />);
    await waitFor(() => expect(screen.getByTestId('comment-input')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByTestId('comment-input'), 'New comment');
    await user.click(screen.getByTestId('submit-comment'));

    // While submitting: indicator visible, input and button disabled
    expect(screen.getByTestId('submitting-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('comment-input')).toBeDisabled();
    expect(screen.getByTestId('submit-comment')).toBeDisabled();

    // Resolve the create call
    resolveCreate!({ success: true, data: { uuid: 'new-c' } });
    await waitFor(() => {
      expect(screen.queryByTestId('submitting-indicator')).not.toBeInTheDocument();
    });
  });

  it('re-enables input after failed submission', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: [], total: 0 },
    });
    vi.mocked(commentService.createComment).mockResolvedValue({
      success: false,
      error: 'Server error',
    });

    render(<CommentSystem ontologyId="ont-1" />);
    await waitFor(() => expect(screen.getByTestId('comment-input')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByTestId('comment-input'), 'New comment');
    await user.click(screen.getByTestId('submit-comment'));

    await waitFor(() => {
      expect(screen.queryByTestId('submitting-indicator')).not.toBeInTheDocument();
      expect(screen.getByTestId('comment-input')).not.toBeDisabled();
      expect(screen.getByTestId('submit-comment')).not.toBeDisabled();
    });
  });

  it('shows 2000 char limit counter', async () => {
    vi.mocked(commentService.getComments).mockResolvedValue({
      success: true,
      data: { comments: [], total: 0 },
    });
    render(<CommentSystem ontologyId="ont-1" />);
    await waitFor(() => {
      expect(screen.getByText('0/2000')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageThread } from '../MessageThread';
import { messageService } from '../../services/messageService';

vi.mock('../../services/messageService', () => ({
  messageService: {
    getMessage: vi.fn(),
    markRead: vi.fn(),
    replyToMessage: vi.fn(),
  },
}));

const mockMessage = {
  uuid: 'm1',
  subject: 'Test Subject',
  content: 'Test body content',
  is_read: false,
  created_at: '2024-01-01',
  sender_email: 'admin@test.com',
  replies: [
    { uuid: 'r1', content: 'Reply text', created_at: '2024-01-02', sender_email: 'user@test.com' },
  ],
};

describe('MessageThread', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    vi.mocked(messageService.getMessage).mockReturnValue(new Promise(() => {}));
    render(<MessageThread messageId="m1" onBack={onBack} />);
    expect(screen.getByTestId('thread-loading')).toBeInTheDocument();
  });

  it('renders thread with replies', async () => {
    vi.mocked(messageService.getMessage).mockResolvedValue({
      success: true,
      data: mockMessage,
    });
    vi.mocked(messageService.markRead).mockResolvedValue({ success: true });

    render(<MessageThread messageId="m1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
      expect(screen.getByText('Test body content')).toBeInTheDocument();
      expect(screen.getByText('Reply text')).toBeInTheDocument();
    });
  });

  it('marks unread message as read', async () => {
    vi.mocked(messageService.getMessage).mockResolvedValue({
      success: true,
      data: mockMessage,
    });
    vi.mocked(messageService.markRead).mockResolvedValue({ success: true });

    render(<MessageThread messageId="m1" onBack={onBack} />);
    await waitFor(() => {
      expect(messageService.markRead).toHaveBeenCalledWith('m1');
    });
  });

  it('shows reply form', async () => {
    vi.mocked(messageService.getMessage).mockResolvedValue({
      success: true,
      data: { ...mockMessage, is_read: true },
    });

    render(<MessageThread messageId="m1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByTestId('reply-form')).toBeInTheDocument();
    });
  });

  it('submits reply', async () => {
    vi.mocked(messageService.getMessage).mockResolvedValue({
      success: true,
      data: { ...mockMessage, is_read: true },
    });
    vi.mocked(messageService.replyToMessage).mockResolvedValue({
      success: true,
      data: { uuid: 'new-r' },
    });

    render(<MessageThread messageId="m1" onBack={onBack} />);
    await waitFor(() => expect(screen.getByTestId('reply-textarea')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByTestId('reply-textarea'), 'My reply');
    await user.click(screen.getByTestId('reply-submit'));

    expect(messageService.replyToMessage).toHaveBeenCalledWith('m1', 'My reply');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagesView } from '../MessagesView';
import { activityService } from '../../services/activityService';

vi.mock('../../services/activityService', () => ({
  activityService: {
    getActivityFeed: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

vi.mock('../../components/MessageThread', () => ({
  MessageThread: ({ messageId, onBack }: any) => (
    <div data-testid="message-thread">
      Thread {messageId}
      <button onClick={onBack} data-testid="thread-back">Back</button>
    </div>
  ),
}));

const mockItems = [
  {
    id: 'a1', type: 'comment', created_at: '2024-01-01',
    content: 'Test comment', subject: null, ontology_name: 'Test Onto',
    ontology_id: 'ont-1', is_read: false,
  },
  {
    id: 'a2', type: 'message', created_at: '2024-01-02',
    content: 'Admin message', subject: 'Hello', ontology_name: null,
    ontology_id: null, is_read: false,
  },
];

describe('MessagesView', () => {
  const onNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches items on mount', async () => {
    vi.mocked(activityService.getActivityFeed).mockResolvedValue({
      success: true,
      data: { items: mockItems },
    });
    render(<MessagesView onNavigate={onNavigate} />);
    await waitFor(() => {
      expect(activityService.getActivityFeed).toHaveBeenCalled();
      expect(screen.getByText('Test comment')).toBeInTheDocument();
    });
  });

  it('shows empty state', async () => {
    vi.mocked(activityService.getActivityFeed).mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    render(<MessagesView onNavigate={onNavigate} />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('shows filter tabs', async () => {
    vi.mocked(activityService.getActivityFeed).mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    render(<MessagesView onNavigate={onNavigate} />);
    await waitFor(() => {
      expect(screen.getByTestId('filter-tabs')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Replies')).toBeInTheDocument();
      expect(screen.getAllByText('Messages').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('marks all read', async () => {
    vi.mocked(activityService.getActivityFeed).mockResolvedValue({
      success: true,
      data: { items: mockItems },
    });
    vi.mocked(activityService.markAllRead).mockResolvedValue({ success: true });

    render(<MessagesView onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByTestId('mark-all-read')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('mark-all-read'));
    expect(activityService.markAllRead).toHaveBeenCalled();
  });

  it('has search input with debounce', async () => {
    vi.mocked(activityService.getActivityFeed).mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    render(<MessagesView onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByTestId('search-input')).toBeInTheDocument());

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByTestId('search-input'), 'test');

    // Debounce should delay the search call
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => {
      const calls = vi.mocked(activityService.getActivityFeed).mock.calls;
      const searchCalls = calls.filter(c => c[3] === 'test');
      expect(searchCalls.length).toBeGreaterThan(0);
    });
  });
});

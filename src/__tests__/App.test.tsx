import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { authService } from '../services/authService';
import { activityService } from '../services/activityService';

vi.mock('../services/authService', () => ({
  authService: {
    onAuthStateChange: vi.fn((cb: any) => {
      cb({ id: 'u1', name: 'Test User', email: 'test@test.com' });
      return () => {};
    }),
    getCurrentUser: vi.fn(() => ({ id: 'u1', name: 'Test User', email: 'test@test.com' })),
    signOut: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  userService: {
    refresh: vi.fn(),
    getUserAccount: vi.fn(),
  },
}));

vi.mock('../services/activityService', () => ({
  activityService: {
    getUnreadCount: vi.fn(),
  },
}));

vi.mock('../views/DashboardView', () => ({
  DashboardView: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock('../views/LoginView', () => ({
  LoginView: () => <div>Login</div>,
}));

vi.mock('../views/MessagesView', () => ({
  MessagesView: () => <div>Messages</div>,
}));

vi.mock('../views/UseOntologyView', () => ({
  UseOntologyView: () => <div>Use</div>,
}));

vi.mock('../views/OntologyDetailsView', () => ({
  OntologyDetailsView: () => <div>Details</div>,
}));

vi.mock('../views/NewOntologyView', () => ({
  NewOntologyView: () => <div>New</div>,
}));

vi.mock('../components/UserProfileSettings', () => ({
  UserProfileSettings: () => <div>Settings</div>,
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

describe('App unread badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows badge with API count', async () => {
    vi.mocked(activityService.getUnreadCount).mockResolvedValue({
      success: true,
      data: { count: 5 },
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('hides badge when count is 0', async () => {
    vi.mocked(activityService.getUnreadCount).mockResolvedValue({
      success: true,
      data: { count: 0 },
    });
    render(<App />);
    await waitFor(() => {
      expect(activityService.getUnreadCount).toHaveBeenCalled();
    });
    // Badge should not be present
    const badges = screen.queryAllByText(/^\d+$/);
    expect(badges.length).toBe(0);
  });

  it('shows 9+ when count exceeds 9', async () => {
    vi.mocked(activityService.getUnreadCount).mockResolvedValue({
      success: true,
      data: { count: 15 },
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });
});

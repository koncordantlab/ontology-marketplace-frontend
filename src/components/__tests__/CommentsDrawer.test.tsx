import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentsDrawer } from '../CommentsDrawer';

// Mock CommentSystem since it makes API calls
vi.mock('../CommentSystem', () => ({
  CommentSystem: ({ ontologyId }: { ontologyId: string }) => (
    <div data-testid="comment-system">Comments for {ontologyId}</div>
  ),
}));

describe('CommentsDrawer', () => {
  const onToggle = vi.fn();

  it('shows open button when closed', () => {
    render(<CommentsDrawer isOpen={false} onToggle={onToggle} />);
    expect(screen.getByTestId('open-drawer')).toBeInTheDocument();
  });

  it('shows drawer when open', () => {
    render(<CommentsDrawer isOpen={true} onToggle={onToggle} ontologyId="ont-1" />);
    expect(screen.getByTestId('comments-drawer')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('renders CommentSystem with ontologyId', () => {
    render(<CommentsDrawer isOpen={true} onToggle={onToggle} ontologyId="ont-1" />);
    expect(screen.getByTestId('comment-system')).toBeInTheDocument();
    expect(screen.getByText('Comments for ont-1')).toBeInTheDocument();
  });

  it('calls onToggle when close button clicked', () => {
    render(<CommentsDrawer isOpen={true} onToggle={onToggle} ontologyId="ont-1" />);
    fireEvent.click(screen.getByTestId('close-drawer'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows placeholder when no ontologyId', () => {
    render(<CommentsDrawer isOpen={true} onToggle={onToggle} />);
    expect(screen.getByText('Select an ontology to see comments')).toBeInTheDocument();
  });
});

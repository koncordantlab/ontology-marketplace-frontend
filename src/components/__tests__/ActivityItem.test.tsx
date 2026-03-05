import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityItem } from '../ActivityItem';
import type { ActivityItem as ActivityItemType } from '../../types/comment';

const mockItem: ActivityItemType = {
  id: 'a1',
  type: 'comment',
  created_at: '2024-01-01',
  content: 'Test content',
  subject: null,
  ontology_name: 'Test Ontology',
  ontology_id: 'ont-1',
  is_read: false,
};

describe('ActivityItem', () => {
  const onClick = vi.fn();
  const onMarkRead = vi.fn();

  it('renders content and ontology name', () => {
    render(<ActivityItem item={mockItem} onClick={onClick} onMarkRead={onMarkRead} />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Test Ontology')).toBeInTheDocument();
  });

  it('renders type badge', () => {
    render(<ActivityItem item={mockItem} onClick={onClick} onMarkRead={onMarkRead} />);
    expect(screen.getByText('Comment')).toBeInTheDocument();
  });

  it('shows unread styling when not read', () => {
    render(<ActivityItem item={mockItem} onClick={onClick} onMarkRead={onMarkRead} />);
    const button = screen.getByTestId('activity-item');
    expect(button.className).toContain('border-l-blue-500');
  });

  it('does not show unread styling when read', () => {
    const readItem = { ...mockItem, is_read: true };
    render(<ActivityItem item={readItem} onClick={onClick} onMarkRead={onMarkRead} />);
    const button = screen.getByTestId('activity-item');
    expect(button.className).not.toContain('border-l-blue-500');
  });

  it('calls onMarkRead and onClick when clicked', () => {
    render(<ActivityItem item={mockItem} onClick={onClick} onMarkRead={onMarkRead} />);
    fireEvent.click(screen.getByTestId('activity-item'));
    expect(onMarkRead).toHaveBeenCalledWith('a1');
    expect(onClick).toHaveBeenCalledWith(mockItem);
  });

  it('renders message type with subject', () => {
    const msgItem: ActivityItemType = {
      ...mockItem,
      type: 'message',
      subject: 'Important message',
      ontology_name: null,
    };
    render(<ActivityItem item={msgItem} onClick={onClick} onMarkRead={onMarkRead} />);
    expect(screen.getByText('Important message')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });
});

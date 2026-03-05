import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactionPicker } from '../ReactionPicker';
import { VALID_EMOJIS } from '../../types/comment';

describe('ReactionPicker', () => {
  const defaultReactions = {};
  const onReact = vi.fn();

  it('renders all 6 emojis', () => {
    render(<ReactionPicker reactions={defaultReactions} onReact={onReact} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('calls onReact when emoji clicked', () => {
    render(<ReactionPicker reactions={defaultReactions} onReact={onReact} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onReact).toHaveBeenCalledWith(VALID_EMOJIS[0]);
  });

  it('highlights user reactions', () => {
    const reactions = { '\ud83d\udc4d': { count: 3, user_reacted: true } };
    render(<ReactionPicker reactions={reactions} onReact={onReact} />);
    const thumbsUp = screen.getAllByRole('button')[0];
    expect(thumbsUp.className).toContain('bg-blue-100');
  });

  it('handles undefined reactions gracefully', () => {
    render(<ReactionPicker reactions={undefined as any} onReact={onReact} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('handles null reactions gracefully', () => {
    render(<ReactionPicker reactions={null as any} onReact={onReact} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('shows count when > 0', () => {
    const reactions = { '\u2764\ufe0f': { count: 5, user_reacted: false } };
    render(<ReactionPicker reactions={reactions} onReact={onReact} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

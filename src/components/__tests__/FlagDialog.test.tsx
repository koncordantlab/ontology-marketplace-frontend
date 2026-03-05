import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlagDialog } from '../FlagDialog';

describe('FlagDialog', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  it('renders nothing when closed', () => {
    const { container } = render(
      <FlagDialog isOpen={false} onClose={onClose} onSubmit={onSubmit} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders 5 flag reasons', () => {
    render(<FlagDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    expect(screen.getByText('Spam')).toBeInTheDocument();
    expect(screen.getByText('Harassment')).toBeInTheDocument();
    expect(screen.getByText('Misinformation')).toBeInTheDocument();
    expect(screen.getByText('Off-topic')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('shows details field when "other" selected', () => {
    render(<FlagDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const otherRadio = screen.getByDisplayValue('other');
    fireEvent.click(otherRadio);
    expect(screen.getByTestId('flag-details')).toBeInTheDocument();
  });

  it('calls onSubmit with selected reason', () => {
    render(<FlagDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const spamRadio = screen.getByDisplayValue('spam');
    fireEvent.click(spamRadio);
    fireEvent.click(screen.getByText('Submit Flag'));
    expect(onSubmit).toHaveBeenCalledWith({ reason: 'spam' });
  });

  it('calls onClose when cancel clicked', () => {
    render(<FlagDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

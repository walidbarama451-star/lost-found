import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ClaimStatusBadge } from '@/features/claims/components/ClaimStatusBadge';
import { ItemCard } from '@/features/items/components/ItemCard';
import { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
import type { PublicItem } from '@/shared/api/types';
import { useToasts } from '@/shared/lib/useToasts';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { EmptyState } from '@/shared/ui/States';

describe('status badges', () => {
  it('labels item statuses and applies corresponding tone classes', () => {
    const { rerender } = render(<ItemStatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active').className).toContain('text-success');

    rerender(<ItemStatusBadge status="CLAIMED" />);
    expect(screen.getByText('Claimed')).toBeInTheDocument();
    expect(screen.getByText('Claimed').className).toContain('text-accent-700');

    rerender(<ItemStatusBadge status="RETURNED" />);
    expect(screen.getByText('Returned')).toBeInTheDocument();
    expect(screen.getByText('Returned').className).toContain('text-ink-muted');
  });

  it('labels claim statuses and applies corresponding tone classes', () => {
    const { rerender } = render(<ClaimStatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Pending').className).toContain('text-warning');

    rerender(<ClaimStatusBadge status="ACCEPTED" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Accepted').className).toContain('text-success');

    rerender(<ClaimStatusBadge status="REJECTED" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Rejected').className).toContain('text-danger');

    rerender(<ClaimStatusBadge status="WITHDRAWN" />);
    expect(screen.getByText('Withdrawn')).toBeInTheDocument();
    expect(screen.getByText('Withdrawn').className).toContain('text-ink-muted');
  });
});

describe('Button', () => {
  it('blocks interaction and marks itself busy while loading', () => {
    render(<Button loading>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders all variants with proper styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-surface');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-ink-muted');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });
});

describe('ItemCard', () => {
  it('renders placeholder icon when item has no images', () => {
    const item: PublicItem = {
      id: 'item-1',
      title: 'Missing Watch',
      status: 'ACTIVE',
      images: [],
      owner: { id: 'user-1', username: 'alex' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const { container } = render(
      <MemoryRouter>
        <ItemCard item={item} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Missing Watch' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('useToasts', () => {
  it('auto-dismisses toasts after duration', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.push('Changes saved', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.message).toBe('Changes saved');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0);
    vi.useRealTimers();
  });
});

describe('EmptyState', () => {
  it('renders its title, description and action', () => {
    render(
      <EmptyState
        title="Nothing here"
        description="Try another filter."
        action={<button type="button">Reset</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByText('Try another filter.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('confirms and cancels through the provided handlers', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Delete this listing?"
        message="This can’t be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Withdraw this claim?"
        message="The owner will no longer see it."
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

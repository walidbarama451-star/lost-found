import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { resolveImageUrl } from '@/shared/api/client';
import { Pagination } from '@/shared/ui/Pagination';

describe('resolveImageUrl', () => {
  it('keeps API-relative paths relative so the dev proxy can serve them', () => {
    expect(resolveImageUrl('/uploads/items/photo.jpg')).toBe('/uploads/items/photo.jpg');
  });

  it('leaves absolute URLs untouched', () => {
    expect(resolveImageUrl('https://cdn.example.com/photo.jpg')).toBe(
      'https://cdn.example.com/photo.jpg',
    );
  });

  it('returns null for empty values', () => {
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl(undefined)).toBeNull();
    expect(resolveImageUrl('')).toBeNull();
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(
      createElement(Pagination, { page: 1, totalPages: 1, onChange: vi.fn() }),
    );
    expect(container.querySelector('nav')).toBeNull();
  });

  it('disables Prev on the first page and reports page changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(createElement(Pagination, { page: 1, totalPages: 3, onChange }));

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('disables Next on the last page', () => {
    render(createElement(Pagination, { page: 3, totalPages: 3, onChange: vi.fn() }));
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});

/** Small shared units: resolveImageUrl + Pagination (spec 11). */

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { resolveImageUrl } from '../lib/api';
import Pagination from '../components/Pagination';

describe('resolveImageUrl', () => {
  it('prefixes API-relative paths with the API origin', () => {
    expect(resolveImageUrl('/uploads/items/photo.jpg')).toBe(
      'http://localhost:5000/uploads/items/photo.jpg',
    );
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
      createElement(Pagination, { page: 1, totalPages: 1, onPageChange: vi.fn() }),
    );
    expect(container.querySelector('nav')).toBeNull();
  });

  it('disables Prev on the first page and reports page changes', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(createElement(Pagination, { page: 1, totalPages: 3, onPageChange }));

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables Next on the last page', () => {
    render(createElement(Pagination, { page: 3, totalPages: 3, onPageChange: vi.fn() }));
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});

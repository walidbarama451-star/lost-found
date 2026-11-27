import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Optional label for the nav landmark. */
  label?: string;
}

/** Page numbers with ellipses, plus previous/next. Always shows first and last. */
const pageItems = (page: number, totalPages: number): Array<number | 'ellipsis'> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => visible.add(value));
  if (page >= totalPages - 2) {
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => visible.add(value));
  }

  const sorted = [...visible]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const items: Array<number | 'ellipsis'> = [];
  let previous = 0;

  for (const value of sorted) {
    if (value - previous > 1) items.push('ellipsis');
    items.push(value);
    previous = value;
  }

  return items;
};

export const Pagination = ({
  page,
  totalPages,
  onChange,
  label = 'Page',
}: PaginationProps): ReactNode => {
  if (totalPages <= 1) return null;

  const go = (next: number): void => {
    if (next < 1 || next > totalPages || next === page) return;
    onChange(next);
  };

  return (
    <nav
      aria-label={`${label} pagination`}
      className="flex flex-col items-center justify-between gap-3 border-t border-line pt-4 sm:flex-row"
    >
      <p className="text-sm text-ink-faint">
        Page <span className="text-ink-muted tabular">{page}</span> of{' '}
        <span className="text-ink-muted tabular">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-overlay hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>

        {pageItems(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden
              className="inline-flex size-8 items-center justify-center text-sm text-ink-faint"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => go(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors tabular',
                item === page
                  ? 'bg-accent-600 text-white'
                  : 'text-ink-muted hover:bg-overlay hover:text-ink',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-overlay hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
};

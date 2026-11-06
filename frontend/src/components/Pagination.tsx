import './Pagination.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional label prefix, e.g. "Listings". */
  label?: string;
}

/** Page window: first/last plus up to 5 pages around the current one. */
function pageWindow(page: number, totalPages: number): number[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p += 1) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onPageChange, label = 'page' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const window = pageWindow(page, totalPages);
  const labelLower = label.toLowerCase();

  return (
    <nav className="pagination" aria-label={`${label} pagination`}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label={`Previous ${labelLower}`}
      >
        ← Prev
      </button>

      <ul className="pagination__pages">
        {window.map((p, index) => (
          <li key={p} className="pagination__item">
            {index > 0 && window[index - 1] !== p - 1 ? (
              <span className="pagination__ellipsis" aria-hidden="true">
                …
              </span>
            ) : null}
            <button
              type="button"
              className={`pagination__page${p === page ? ' pagination__page--current' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`${label} ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={`Next ${labelLower}`}
      >
        Next →
      </button>
    </nav>
  );
}

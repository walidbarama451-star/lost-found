import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ItemFilters, { type ItemFilterValues } from '../components/ItemFilters';
import ItemGrid from '../components/ItemGrid';
import ItemSearchBar from '../components/ItemSearchBar';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import { useApi } from '../lib/useApi';
import { listItems } from '../features/items/itemsService';
import './HomePage.css';

const EMPTY_FILTERS: ItemFilterValues = {
  category: '',
  fromDate: '',
  toDate: '',
  sort: 'newest',
};

function readFilters(params: URLSearchParams): ItemFilterValues {
  const sort = params.get('sort');
  return {
    category: params.get('category') ?? '',
    fromDate: params.get('fromDate') ?? '',
    toDate: params.get('toDate') ?? '',
    sort: sort === 'oldest' ? 'oldest' : 'newest',
  };
}

/** Home / search: query params drive the API (spec 02 flow C). */
export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<ItemFilterValues>(() => readFilters(searchParams));

  const query = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? '1') || 1;

  // Keep local draft in sync when the URL changes elsewhere (back/forward).
  useEffect(() => {
    setDraft(readFilters(searchParams));
  }, [searchParams]);

  const { data, loading, error, reload } = useApi(
    () =>
      listItems({
        q: query,
        category: draft.category,
        fromDate: draft.fromDate,
        toDate: draft.toDate,
        sort: draft.sort,
        page,
        limit: 12,
      }),
    [
      query,
      draft.category,
      draft.fromDate,
      draft.toDate,
      draft.sort,
      page,
    ],
  );

  const updateParams = useCallback(
    (next: Record<string, string>, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(next)) {
            if (value) params.set(key, value);
            else params.delete(key);
          }
          if (resetPage) params.delete('page');
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <div className="home-page">
      <section className="home-page__hero">
        <h1>Found items, reunited</h1>
        <p className="muted">
          Search reported found belongings, or sign in to publish something you found.
        </p>
        <ItemSearchBar
          initialQuery={query}
          onSearch={(value) => updateParams({ q: value })}
        />
      </section>

      <ItemFilters
        values={draft}
        onChange={setDraft}
        onApply={() =>
          updateParams({
            category: draft.category,
            fromDate: draft.fromDate,
            toDate: draft.toDate,
            sort: draft.sort === 'newest' ? '' : draft.sort,
          })
        }
        onClear={() => {
          setDraft(EMPTY_FILTERS);
          setSearchParams({}, { replace: true });
        }}
      />

      <section aria-live="polite" aria-busy={loading}>
        <div className="home-page__results-head">
          <h2>
            {query ? `Results for “${query}”` : 'Latest found items'}
            {data ? <span className="muted"> ({data.pagination.total})</span> : null}
          </h2>
        </div>

        {loading ? <LoadingState label="Loading listings…" /> : null}

        {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}

        {!loading && !error && data && data.items.length === 0 ? (
          <EmptyState
            title="No listings match your search"
            message="Try different keywords or clear the filters."
            action={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchParams({}, { replace: true })}
              >
                Clear search
              </button>
            }
          />
        ) : null}

        {!loading && !error && data && data.items.length > 0 ? (
          <>
            <ItemGrid items={data.items} />
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={(next) =>
                updateParams({ page: String(next) }, false)
              }
              label="Listings"
            />
          </>
        ) : null}
      </section>
    </div>
  );
}

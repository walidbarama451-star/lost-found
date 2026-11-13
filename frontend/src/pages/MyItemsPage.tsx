import { useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ItemGrid from '../components/ItemGrid';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import { deleteItem, listMyItems, markReturned } from '../features/items/itemsService';
import { itemStatusLabel } from '../lib/format';
import { toDisplayError } from '../lib/validation';
import { useApi } from '../lib/useApi';
import { ITEM_STATUSES, type ItemStatus, type OwnerItem, type PublicItem } from '../types';
import './MyItemsPage.css';

type PendingAction =
  | { kind: 'delete'; item: OwnerItem }
  | { kind: 'return'; item: OwnerItem }
  | null;

export default function MyItemsPage() {
  const [status, setStatus] = useState<ItemStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi(
    () => listMyItems({ status: status || undefined, page, limit: 12 }),
    [status, page],
  );

  const changeStatus = (next: ItemStatus | '') => {
    setStatus(next);
    setPage(1);
  };

  const runAction = async () => {
    if (!pending) return;
    setBusy(true);
    setActionError(null);
    try {
      if (pending.kind === 'delete') await deleteItem(pending.item.id);
      else await markReturned(pending.item.id);
      setPending(null);
      reload();
    } catch (caught) {
      setActionError(toDisplayError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const actionsFor = (item: PublicItem) => {
    const owner = item as OwnerItem;
    return (
      <div className="my-items__actions">
        <Link className="btn btn-secondary btn-sm" to={`/items/${item.id}/claims`}>
          Claims
        </Link>
        <Link className="btn btn-secondary btn-sm" to={`/items/${item.id}/edit`}>
          Edit
        </Link>
        {item.status === 'ACTIVE' || item.status === 'CLAIMED' ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPending({ kind: 'return', item: owner })}
          >
            Mark returned
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => setPending({ kind: 'delete', item: owner })}
        >
          Delete
        </button>
      </div>
    );
  };

  const dialogTitle = pending?.kind === 'delete' ? 'Delete this listing?' : 'Mark as returned?';
  const dialogMessage = !pending
    ? ''
    : pending.kind === 'delete'
      ? `“${pending.item.title}” will be permanently deleted. It will disappear from your listings and from everyone’s saved search matches. This can’t be undone.`
      : `Confirm that “${pending.item.title}” has been handed back to its owner.`;

  return (
    <div className="my-items">
      <div className="page-header">
        <div>
          <h1>My listings</h1>
          <p className="muted">Manage everything you’ve found and published.</p>
        </div>
        <Link className="btn btn-primary" to="/items/new">
          + Post a found item
        </Link>
      </div>

      <div className="my-items__filters">
        <label className="form-field my-items__filter">
          <span className="form-label">Status</span>
          <select
            className="form-control"
            value={status}
            onChange={(event) => changeStatus(event.target.value as ItemStatus | '')}
          >
            <option value="">All statuses</option>
            {ITEM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {itemStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {actionError ? (
        <div className="inline-alert inline-alert-error" role="alert">
          {actionError}
        </div>
      ) : null}

      {loading ? <LoadingState label="Loading your listings…" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && data && data.items.length === 0 ? (
        <EmptyState
          title="No listings here"
          message={
            status
              ? `You don’t have any ${itemStatusLabel(status as ItemStatus).toLowerCase()} listings.`
              : 'You haven’t posted anything yet.'
          }
          action={
            <Link className="btn btn-primary btn-sm" to="/items/new">
              Post a found item
            </Link>
          }
        />
      ) : null}
      {!loading && !error && data && data.items.length > 0 ? (
        <>
          <ItemGrid items={data.items} actionsFor={actionsFor} />
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
            label="Listing page"
          />
        </>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        title={dialogTitle}
        message={dialogMessage}
        confirmLabel={pending?.kind === 'delete' ? 'Delete listing' : 'Mark returned'}
        danger={pending?.kind === 'delete'}
        busy={busy}
        onConfirm={() => void runAction()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

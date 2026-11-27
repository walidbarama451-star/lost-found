import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, PackageOpen, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { ItemGrid } from '@/features/items/components/ItemGrid';
import { deleteItem, listMyItems, markReturned } from '@/features/items/itemsService';
import type { ItemStatus, OwnerItem, PublicItem } from '@/shared/api/types';
import { ITEM_STATUSES } from '@/shared/api/types';
import { itemStatusLabel } from '@/shared/lib/format';
import { toDisplayError } from '@/shared/lib/validation';
import { useApi } from '@/shared/lib/useApi';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Pagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/States';
import { selectClass } from '@/shared/ui/formStyles';
import { useToast } from '@/shared/ui/toastContext';

type PendingAction =
  | { kind: 'delete'; item: OwnerItem }
  | { kind: 'return'; item: OwnerItem }
  | null;

const MyItemsPage = (): ReactNode => {
  const pushToast = useToast();
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
      if (pending.kind === 'delete') {
        await deleteItem(pending.item.id);
        pushToast('Listing deleted.', 'success');
      } else {
        await markReturned(pending.item.id);
        pushToast('Listing marked as returned.', 'success');
      }
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
      <>
        <Link to={`/items/${item.id}/claims`} className={buttonClasses('secondary', 'sm')}>
          <ClipboardCheck size={14} aria-hidden />
          Claims
        </Link>
        <Link to={`/items/${item.id}/edit`} className={buttonClasses('secondary', 'sm')}>
          <Pencil size={14} aria-hidden />
          Edit
        </Link>
        {item.status === 'ACTIVE' || item.status === 'CLAIMED' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPending({ kind: 'return', item: owner })}
          >
            <RotateCcw size={14} aria-hidden />
            Mark returned
          </Button>
        ) : null}
        <Button
          variant="danger"
          size="sm"
          onClick={() => setPending({ kind: 'delete', item: owner })}
        >
          <Trash2 size={14} aria-hidden />
          Delete
        </Button>
      </>
    );
  };

  const dialogTitle = pending?.kind === 'delete' ? 'Delete this listing?' : 'Mark as returned?';
  const dialogMessage = !pending
    ? ''
    : pending.kind === 'delete'
      ? `“${pending.item.title}” will be permanently deleted. It will disappear from your listings and from everyone’s saved search matches. This can’t be undone.`
      : `Confirm that “${pending.item.title}” has been handed back to its owner.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Found items
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">My listings</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Manage everything you’ve found and published.
          </p>
        </div>
        <Link to="/items/new" className={buttonClasses('primary', 'md')}>
          <Plus size={16} aria-hidden />
          Post a found item
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Status
          </span>
          <select
            className={`${selectClass} min-w-44`}
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
        <div
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-line bg-surface">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error && data && data.items.length === 0 ? (
        <EmptyState
          icon={<PackageOpen size={20} />}
          title="No listings here"
          description={
            status
              ? `You don’t have any ${itemStatusLabel(status as ItemStatus).toLowerCase()} listings.`
              : 'You haven’t posted anything yet.'
          }
          action={
            <Link to="/items/new" className={buttonClasses('primary', 'sm')}>
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
            onChange={setPage}
            label="Listing"
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
};

export default MyItemsPage;

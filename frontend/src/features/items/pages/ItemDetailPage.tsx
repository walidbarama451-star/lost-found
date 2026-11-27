import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  ImageOff,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ClaimForm } from '@/features/claims/components/ClaimForm';
import { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
import { deleteItem, getItem, markReturned } from '@/features/items/itemsService';
import { resolveImageUrl } from '@/shared/api/client';
import { formatDateTime } from '@/shared/lib/format';
import { toDisplayError } from '@/shared/lib/validation';
import { useApi } from '@/shared/lib/useApi';
import { useToast } from '@/shared/ui/toastContext';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { ErrorState, LoadingState } from '@/shared/ui/States';

type PendingAction = 'delete' | 'return' | null;

const ItemDetailPage = (): ReactNode => {
  const { itemId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pushToast = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: item, loading, error, reload } = useApi(() => getItem(itemId), [itemId]);

  const isOwner = Boolean(user && item && item.owner.id === user.id);

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    onSuccess?: () => void,
  ) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      setPending(null);
      pushToast(successMessage, 'success');
      if (onSuccess) onSuccess();
      else reload();
    } catch (err) {
      setActionError(toDisplayError(err).message);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading listing…" />;
  if (error || !item) return <ErrorState message={error ?? 'Listing not found.'} onRetry={reload} />;

  const images = item.images;
  const current = images[Math.min(activeImage, Math.max(images.length - 1, 0))];
  const src = resolveImageUrl(current?.url ?? null);
  const canClaim = user && !isOwner && item.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden />
          Back to browse
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface">
            {src ? (
              <img
                className="size-full object-cover"
                src={src}
                alt={`${item.title} — photo ${activeImage + 1} of ${images.length}`}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-ink-faint">
                <ImageOff size={30} aria-hidden />
              </div>
            )}
          </div>

          {images.length > 1 ? (
            <ul className="grid grid-cols-5 gap-2">
              {images.map((image, index) => {
                const thumbSrc = resolveImageUrl(image.url);
                if (!thumbSrc) return null;
                return (
                  <li key={image.url}>
                    <button
                      type="button"
                      className={
                        index === activeImage
                          ? 'aspect-square w-full overflow-hidden rounded-lg border border-line ring-2 ring-accent-500'
                          : 'aspect-square w-full overflow-hidden rounded-lg border border-line transition-colors hover:border-ink-faint'
                      }
                      onClick={() => setActiveImage(index)}
                      aria-label={`Show photo ${index + 1}`}
                      aria-pressed={index === activeImage}
                    >
                      <img className="size-full object-cover" src={thumbSrc} alt="" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <ItemStatusBadge status={item.status} />

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{item.title}</h1>

          <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Posted by</dt>
              <dd className="text-ink-muted">
                {user ? (
                  <Link
                    to={`/users/${item.owner.id}`}
                    className="font-medium text-accent-600 hover:text-accent-700"
                    title="View profile"
                  >
                    {item.owner.username}
                  </Link>
                ) : (
                  item.owner.username
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Published</dt>
              <dd className="text-ink-muted tabular">{formatDateTime(item.createdAt)}</dd>
            </div>
          </dl>

          {isOwner ? (
            <div className="mt-5 space-y-3 border-t border-line pt-4">
              <h2 className="text-sm font-medium text-ink">Your listing</h2>
              {actionError ? (
                <p
                  className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                  role="alert"
                >
                  {actionError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/items/${item.id}/edit`}
                  className={buttonClasses('secondary', 'sm')}
                >
                  <Pencil size={14} aria-hidden />
                  Edit
                </Link>
                <Link
                  to={`/items/${item.id}/claims`}
                  className={buttonClasses('secondary', 'sm')}
                >
                  <ClipboardCheck size={14} aria-hidden />
                  Review claims
                </Link>
                {item.status === 'CLAIMED' ? (
                  <Button
                    size="sm"
                    onClick={() => setPending('return')}
                    disabled={busy}
                  >
                    <RotateCcw size={14} aria-hidden />
                    Mark as returned
                  </Button>
                ) : null}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setPending('delete')}
                  disabled={busy}
                >
                  <Trash2 size={14} aria-hidden />
                  Delete listing
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {canClaim ? (
        <section
          className="max-w-2xl rounded-xl border border-line bg-surface p-5"
          aria-label="Submit a claim"
        >
          <ClaimForm itemId={item.id} />
        </section>
      ) : null}

      {!user && item.status === 'ACTIVE' ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
          <Link to="/login" className="font-medium text-accent-600 hover:text-accent-700">
            Sign in
          </Link>{' '}
          to submit a claim for this item.
        </p>
      ) : null}

      <ConfirmDialog
        open={pending === 'delete'}
        title="Delete this listing?"
        message="This permanently deletes the listing and its claims. It also disappears from everyone’s saved search matches, and can’t be restored."
        confirmLabel="Delete listing"
        danger
        busy={busy}
        onConfirm={() =>
          void runAction(
            () => deleteItem(item.id),
            'Listing deleted.',
            () => navigate('/my-items'),
          )
        }
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={pending === 'return'}
        title="Mark as returned?"
        message="This confirms the item was handed back to its owner. The listing leaves active search."
        confirmLabel="Mark as returned"
        busy={busy}
        onConfirm={() =>
          void runAction(() => markReturned(item.id), 'Listing marked as returned.')
        }
        onCancel={() => setPending(null)}
      />
    </div>
  );
};

export default ItemDetailPage;

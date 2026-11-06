import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ClaimForm from '../components/ClaimForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import StatusBadge from '../components/StatusBadge';
import { resolveImageUrl } from '../lib/api';
import { categoryLabel, formatDate, formatDateTime, formatLocation } from '../lib/format';
import { toDisplayError } from '../lib/validation';
import { useAuth } from '../features/auth/AuthContext';
import { useApi } from '../lib/useApi';
import {
  closeItem,
  getItem,
  markReturned,
} from '../features/items/itemsService';
import './ItemDetailPage.css';

type PendingAction = 'close' | 'return' | null;

export default function ItemDetailPage() {
  const { itemId = '' } = useParams();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: item, loading, error, reload } = useApi(() => getItem(itemId), [itemId]);

  const isOwner = Boolean(user && item && item.owner.id === user.id);

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      setPending(null);
      reload();
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
    <div className="item-detail">
      <nav className="item-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">← Back to browse</Link>
      </nav>

      <div className="item-detail__grid">
        <div className="item-detail__gallery">
          {src ? (
            <img
              className="item-detail__hero"
              src={src}
              alt={`${item.title} — photo ${activeImage + 1} of ${images.length}`}
            />
          ) : (
            <div className="item-detail__hero item-detail__hero--empty">No photo available</div>
          )}

          {images.length > 1 ? (
            <ul className="item-detail__thumbs">
              {images.map((image, index) => {
                const thumbSrc = resolveImageUrl(image.url);
                if (!thumbSrc) return null;
                return (
                  <li key={image.url}>
                    <button
                      type="button"
                      className={`item-detail__thumb${index === activeImage ? ' item-detail__thumb--active' : ''}`}
                      onClick={() => setActiveImage(index)}
                      aria-label={`Show photo ${index + 1}`}
                      aria-pressed={index === activeImage}
                    >
                      <img src={thumbSrc} alt="" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="item-detail__info card">
          <div className="item-detail__badges">
            <span className="item-detail__category">{categoryLabel(item.category)}</span>
            <StatusBadge status={item.status} />
          </div>

          <h1>{item.title}</h1>

          <dl className="item-detail__meta">
            <div>
              <dt>Found on</dt>
              <dd>{formatDate(item.dateFound)}</dd>
            </div>
            <div>
              <dt>Approximate location</dt>
              <dd>{formatLocation(item.location)}</dd>
            </div>
            <div>
              <dt>Posted by</dt>
              <dd>{item.owner.username}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{formatDateTime(item.createdAt)}</dd>
            </div>
          </dl>

          <section className="item-detail__description">
            <h2>Description</h2>
            <p>{item.description}</p>
          </section>

          {isOwner ? (
            <div className="item-detail__owner-actions">
              <h2>Your listing</h2>
              {actionError ? (
                <p className="inline-alert inline-alert-error" role="alert">
                  {actionError}
                </p>
              ) : null}
              <div className="row">
                <Link className="btn btn-secondary btn-sm" to={`/items/${item.id}/edit`}>
                  Edit
                </Link>
                <Link className="btn btn-secondary btn-sm" to={`/items/${item.id}/claims`}>
                  Review claims
                </Link>
                {item.status === 'CLAIMED' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setPending('return')}
                    disabled={busy}
                  >
                    Mark as returned
                  </button>
                ) : null}
                {item.status !== 'CLOSED' && item.status !== 'RETURNED' ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setPending('close')}
                    disabled={busy}
                  >
                    Close listing
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {canClaim ? (
        <section className="item-detail__claim" aria-label="Submit a claim">
          <ClaimForm itemId={item.id} />
        </section>
      ) : null}

      {!user && item.status === 'ACTIVE' ? (
        <p className="inline-alert item-detail__signin">
          <Link to="/login">Sign in</Link> to submit a claim for this item.
        </p>
      ) : null}

      <ConfirmDialog
        open={pending === 'close'}
        title="Close this listing?"
        message="The listing is removed from public search. You can’t reopen it, but claims history is kept."
        confirmLabel="Close listing"
        danger
        busy={busy}
        onConfirm={() => void runAction(() => closeItem(item.id))}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={pending === 'return'}
        title="Mark as returned?"
        message="This confirms the item was handed back to its owner. The listing leaves active search."
        confirmLabel="Mark as returned"
        busy={busy}
        onConfirm={() => void runAction(() => markReturned(item.id))}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import { decideClaim, listClaimsOnItem } from '../features/claims/claimsService';
import { getItem } from '../features/items/itemsService';
import { formatDate } from '../lib/format';
import { toDisplayError } from '../lib/validation';
import { useApi } from '../lib/useApi';
import type { ClaimOnItem, PublicItem } from '../types';
import './ItemClaimsPage.css';

interface ClaimsView {
  item: PublicItem;
  claims: { items: ClaimOnItem[]; pagination: { page: number; totalPages: number } };
}

type PendingDecision = { claim: ClaimOnItem; decision: 'ACCEPTED' | 'REJECTED' } | null;

export default function ItemClaimsPage() {
  const { itemId = '' } = useParams();
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingDecision>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi<ClaimsView>(
    async () => {
      const [item, claims] = await Promise.all([getItem(itemId), listClaimsOnItem(itemId, page, 12)]);
      return { item, claims };
    },
    [itemId, page],
  );

  const runDecision = async () => {
    if (!pending) return;
    setBusy(true);
    setActionError(null);
    try {
      await decideClaim(pending.claim.id, pending.decision);
      setPending(null);
      reload();
    } catch (caught) {
      setActionError(toDisplayError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading claims…" />;
  // Includes the backend's 403 message when you don't own the listing.
  if (error || !data) return <ErrorState message={error ?? 'Listing not found.'} onRetry={reload} />;

  const { item, claims } = data;
  const isPendingReview = pending !== null;

  return (
    <div className="item-claims">
      <div className="page-header">
        <div>
          <h1>Claims on “{item.title}”</h1>
          <p className="muted">Found {formatDate(item.dateFound)}</p>
        </div>
        <div className="row">
          <Link className="btn btn-secondary btn-sm" to={`/items/${item.id}`}>
            View listing
          </Link>
          <Link className="btn btn-secondary btn-sm" to="/my-items">
            My listings
          </Link>
        </div>
      </div>

      <p className="item-claims__note muted">
        Review each claim carefully. Only accept when the claimant can describe private proof
        details — those details stay hidden until you accept.
      </p>

      {actionError ? (
        <div className="inline-alert inline-alert-error" role="alert">
          {actionError}
        </div>
      ) : null}

      {claims.items.length === 0 ? (
        <EmptyState
          title="No claims yet"
          message="When someone claims this listing, it will appear here for you to review."
        />
      ) : (
        <>
          <ul className="item-claims__list">
            {claims.items.map((claim) => (
              <li key={claim.id} className="item-claims__item card">
                <div className="item-claims__info">
                  <div className="item-claims__head">
                    <span className="item-claims__user">{claim.claimant.username}</span>
                    <ClaimStatusBadge status={claim.status} />
                  </div>
                  <p className="item-claims__message">{claim.message}</p>
                  <span className="muted">
                    Submitted {formatDate(claim.createdAt)}
                    {claim.decisionAt ? ` · Decided ${formatDate(claim.decisionAt)}` : ''}
                  </span>
                </div>
                {claim.status === 'PENDING' ? (
                  <div className="item-claims__actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setPending({ claim, decision: 'ACCEPTED' })}
                      disabled={isPendingReview}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPending({ claim, decision: 'REJECTED' })}
                      disabled={isPendingReview}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <Pagination
            page={claims.pagination.page}
            totalPages={claims.pagination.totalPages}
            onPageChange={setPage}
            label="Claim page"
          />
        </>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending?.decision === 'ACCEPTED' ? 'Accept this claim?' : 'Reject this claim?'}
        message={
          pending
            ? pending.decision === 'ACCEPTED'
              ? `${pending.claim.claimant.username} will be notified and can coordinate the handover with you.`
              : `${pending.claim.claimant.username} will be notified that the claim was declined.`
            : ''
        }
        confirmLabel={pending?.decision === 'ACCEPTED' ? 'Accept claim' : 'Reject claim'}
        danger={pending?.decision === 'REJECTED'}
        busy={busy}
        onConfirm={() => void runDecision()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { listMyClaims, withdrawClaim } from '../features/claims/claimsService';
import { formatDate } from '../lib/format';
import { toDisplayError } from '../lib/validation';
import { useApi } from '../lib/useApi';
import { toItemStatus, type MyClaim } from '../types';
import './MyClaimsPage.css';

export default function MyClaimsPage() {
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<MyClaim | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi(() => listMyClaims(page, 12), [page]);

  const handleWithdraw = async () => {
    if (!pending) return;
    setBusy(true);
    setActionError(null);
    try {
      await withdrawClaim(pending.id);
      setPending(null);
      reload();
    } catch (caught) {
      setActionError(toDisplayError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="my-claims">
      <div className="page-header">
        <div>
          <h1>My claims</h1>
          <p className="muted">
            Claims you’ve submitted. Keep proof details private until a claim is accepted.
          </p>
        </div>
      </div>

      {actionError ? (
        <div className="inline-alert inline-alert-error" role="alert">
          {actionError}
        </div>
      ) : null}

      {loading ? <LoadingState label="Loading your claims…" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && data && data.items.length === 0 ? (
        <EmptyState
          title="No claims submitted"
          message="When you spot your lost item, open its listing and submit a private claim."
          action={
            <Link className="btn btn-primary btn-sm" to="/">
              Browse listings
            </Link>
          }
        />
      ) : null}
      {!loading && !error && data && data.items.length > 0 ? (
        <>
          <ul className="my-claims__list">
            {data.items.map((claim) => (
              <li key={claim.id} className="my-claims__item card">
                <div className="my-claims__info">
                  <Link className="my-claims__title" to={`/items/${claim.item.id}`}>
                    {claim.item.title}
                  </Link>
                  <p className="my-claims__message muted">{claim.message}</p>
                  <span className="muted">Submitted {formatDate(claim.createdAt)}</span>
                </div>
                <div className="my-claims__side">
                  <div className="my-claims__badges">
                    <ClaimStatusBadge status={claim.status} />
                    <StatusBadge status={toItemStatus(claim.item.status)} />
                  </div>
                  {claim.status === 'PENDING' ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPending(claim)}
                    >
                      Withdraw claim
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
            label="Claim page"
          />
        </>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        title="Withdraw this claim?"
        message={
          pending
            ? `Your claim on “${pending.item.title}” will be cancelled. The owner will no longer see it as pending.`
            : ''
        }
        confirmLabel="Withdraw claim"
        danger
        busy={busy}
        onConfirm={() => void handleWithdraw()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

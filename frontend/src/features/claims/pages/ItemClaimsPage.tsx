import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, ShieldCheck } from 'lucide-react';
import { ClaimStatusBadge } from '@/features/claims/components/ClaimStatusBadge';
import { decideClaim, listClaimsOnItem } from '@/features/claims/claimsService';
import { useAuth } from '@/features/auth/AuthContext';
import { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
import { getItem } from '@/features/items/itemsService';
import type { ClaimOnItem, PublicItem } from '@/shared/api/types';
import { formatDate } from '@/shared/lib/format';
import { toDisplayError } from '@/shared/lib/validation';
import { useApi } from '@/shared/lib/useApi';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Pagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/States';
import { useToast } from '@/shared/ui/toastContext';

interface ClaimsView {
  item: PublicItem;
  claims: { items: ClaimOnItem[]; pagination: { page: number; totalPages: number } };
}

type PendingDecision = { claim: ClaimOnItem; decision: 'ACCEPTED' | 'REJECTED' } | null;

const ItemClaimsPage = (): ReactNode => {
  const { itemId = '' } = useParams();
  const { user } = useAuth();
  const pushToast = useToast();
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingDecision>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi<ClaimsView>(
    async () => {
      const [item, claims] = await Promise.all([
        getItem(itemId),
        listClaimsOnItem(itemId, page, 12),
      ]);
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
      pushToast(
        pending.decision === 'ACCEPTED' ? 'Claim accepted.' : 'Claim rejected.',
        'success',
      );
      reload();
    } catch (caught) {
      setActionError(toDisplayError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading claims…" />;
  if (error || !data) return <ErrorState message={error ?? 'Listing not found.'} onRetry={reload} />;

  const { item, claims } = data;

  if (user && item.owner.id !== user.id) {
    return <ErrorState message="You can only review claims on your own listings." />;
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <Link
          to="/my-items"
          className="inline-flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden />
          My listings
        </Link>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Review claims
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight text-ink">
            {item.title}
            <ItemStatusBadge status={item.status} />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Review each claim and decide whether to hand the item over.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/items/${item.id}`} className={buttonClasses('secondary', 'md')}>
            View listing
          </Link>
          <Link to="/my-items" className={buttonClasses('secondary', 'md')}>
            My listings
          </Link>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm leading-relaxed text-accent-900">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent-600" aria-hidden />
        <p>
          Review each claim carefully. Only accept when the claimant can describe private proof
          details — those details stay hidden until you accept.
        </p>
      </div>

      {actionError ? (
        <div
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {claims.items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={20} />}
          title="No claims yet"
          description="When someone claims this listing, it will appear here for you to review."
        />
      ) : (
        <>
          {/* Desktop claims table */}
          <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-overlay/40 text-xs uppercase tracking-wide text-ink-faint">
                  <th scope="col" className="px-4 py-3 font-medium">Claimant</th>
                  <th scope="col" className="px-4 py-3 font-medium">Message / Proof</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
                  <th scope="col" className="px-4 py-3 font-medium">Decision</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {claims.items.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-b border-line/60 transition-colors hover:bg-overlay/50 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-accent-600 text-[11px] font-semibold text-white">
                          {claim.claimant.username.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-ink">{claim.claimant.username}</span>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="line-clamp-2 text-ink-muted">{claim.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ClaimStatusBadge status={claim.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted tabular">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted tabular">
                      {claim.decisionAt ? formatDate(claim.decisionAt) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {claim.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={pending !== null || busy}
                            onClick={() => setPending({ claim, decision: 'ACCEPTED' })}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={pending !== null || busy}
                            onClick={() => setPending({ claim, decision: 'REJECTED' })}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile claims cards */}
          <ul className="space-y-2 md:hidden">
            {claims.items.map((claim) => (
              <li key={claim.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-accent-600 text-[11px] font-semibold text-white">
                      {claim.claimant.username.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-ink">{claim.claimant.username}</span>
                  </div>
                  <ClaimStatusBadge status={claim.status} />
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                  {claim.message}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-ink-faint">
                  <span>Submitted {formatDate(claim.createdAt)}</span>
                  {claim.decisionAt ? <span>Decided {formatDate(claim.decisionAt)}</span> : null}
                </div>
                {claim.status === 'PENDING' ? (
                  <div className="mt-3 flex gap-2 border-t border-line/60 pt-3">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={pending !== null || busy}
                      onClick={() => setPending({ claim, decision: 'ACCEPTED' })}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      disabled={pending !== null || busy}
                      onClick={() => setPending({ claim, decision: 'REJECTED' })}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <Pagination
            page={claims.pagination.page}
            totalPages={claims.pagination.totalPages}
            onChange={setPage}
            label="Claim"
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
};

export default ItemClaimsPage;

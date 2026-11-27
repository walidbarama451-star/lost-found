import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { ClaimStatusBadge } from '@/features/claims/components/ClaimStatusBadge';
import { listMyClaims, withdrawClaim } from '@/features/claims/claimsService';
import { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
import type { MyClaim } from '@/shared/api/types';
import { toItemStatus } from '@/shared/api/types';
import { formatDate } from '@/shared/lib/format';
import { toDisplayError } from '@/shared/lib/validation';
import { useApi } from '@/shared/lib/useApi';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Pagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/States';
import { useToast } from '@/shared/ui/toastContext';

const MyClaimsPage = (): ReactNode => {
  const pushToast = useToast();
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
      pushToast('Claim withdrawn.', 'success');
      reload();
    } catch (caught) {
      setActionError(toDisplayError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-700">Claims</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">My claims</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Claims you’ve submitted. Keep proof details private until a claim is accepted.
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

      {loading ? (
        <div className="space-y-2" aria-busy>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error && data && data.items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={20} />}
          title="No claims submitted"
          description="When you spot your lost item, open its listing and submit a private claim."
          action={
            <Link to="/" className={buttonClasses('primary', 'sm')}>
              Search for a lost item
            </Link>
          }
        />
      ) : null}

      {!loading && !error && data && data.items.length > 0 ? (
        <>
          {/* Desktop claims table */}
          <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-overlay/40 text-xs uppercase tracking-wide text-ink-faint">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Item
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Your message
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Submitted
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Decision
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.items.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-b border-line/60 transition-colors hover:bg-overlay/50 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/items/${claim.item.id}`}
                        className="font-medium text-ink transition-colors hover:text-accent-600"
                      >
                        {claim.item.title}
                      </Link>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="line-clamp-2 text-ink-muted">{claim.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ClaimStatusBadge status={claim.status} />
                        <ItemStatusBadge status={toItemStatus(claim.item.status)} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted tabular">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted tabular">
                      {claim.decisionAt ? formatDate(claim.decisionAt) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {claim.status === 'PENDING' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPending(claim)}
                        >
                          Withdraw
                        </Button>
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
            {data.items.map((claim) => (
              <li key={claim.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/items/${claim.item.id}`}
                    className="text-sm font-medium text-ink transition-colors hover:text-accent-600"
                  >
                    {claim.item.title}
                  </Link>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <ClaimStatusBadge status={claim.status} />
                    <ItemStatusBadge status={toItemStatus(claim.item.status)} />
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{claim.message}</p>
                <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-ink-faint">
                  <span>Submitted {formatDate(claim.createdAt)}</span>
                  {claim.decisionAt ? <span>Decided {formatDate(claim.decisionAt)}</span> : null}
                </div>
                {claim.status === 'PENDING' ? (
                  <div className="mt-3 border-t border-line/60 pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setPending(claim)}
                    >
                      Withdraw claim
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onChange={setPage}
            label="Claim"
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
};

export default MyClaimsPage;

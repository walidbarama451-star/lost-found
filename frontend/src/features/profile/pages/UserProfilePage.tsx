import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { getUserById } from '@/features/profile/profileService';
import { formatDate } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { Button } from '@/shared/ui/Button';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { useToast } from '@/shared/ui/toastContext';

const UserProfilePage = (): ReactNode => {
  const { userId = '' } = useParams();
  const { user } = useAuth();
  const pushToast = useToast();
  const [copied, setCopied] = useState(false);

  const { data: profile, loading, error, reload } = useApi(() => getUserById(userId), [userId]);

  if (loading) return <LoadingState label="Loading profile…" />;
  if (error || !profile) return <ErrorState message={error ?? 'User not found.'} onRetry={reload} />;

  const isSelf = user?.id === profile.id;

  const handleCopy = async () => {
    if (!profile.discordUsername) return;
    try {
      await navigator.clipboard.writeText(profile.discordUsername);
      setCopied(true);
      pushToast('Discord username copied.', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      pushToast('Couldn’t copy — select the username manually.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav aria-label="Breadcrumb">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden />
          Back to search
        </Link>
      </nav>

      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-600 text-lg font-semibold text-white"
            aria-hidden
          >
            {profile.username.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{profile.username}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Member since <span className="tabular">{formatDate(profile.createdAt)}</span>
            </p>
            {isSelf ? (
              <p className="mt-1 text-sm text-ink-muted">
                This is your profile —{' '}
                <Link
                  to="/profile"
                  className="font-medium text-accent-600 hover:text-accent-700"
                >
                  edit it here
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>

        <section className="mt-6 border-t border-line pt-5" aria-label="Contact">
          <h2 className="text-sm font-medium text-ink">Contact</h2>
          {profile.discordUsername ? (
            <>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-ink-faint">Discord</span>
                  <span className="text-sm font-medium text-ink">{profile.discordUsername}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => void handleCopy()}>
                  {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                  {copied ? 'Copied' : 'Copy username'}
                </Button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Add <strong className="font-medium text-ink">{profile.discordUsername}</strong> as
                a friend in Discord and send them a message to talk about an item.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">
              This user hasn’t added a Discord username yet.
            </p>
          )}
        </section>

        <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
          Email addresses and phone numbers are never shared — chat happens outside this site, on
          Discord.
        </p>
      </div>
    </div>
  );
};

export default UserProfilePage;

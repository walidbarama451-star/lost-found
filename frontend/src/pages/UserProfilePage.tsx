import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../features/auth/AuthContext';
import { getUserById } from '../features/profile/profileService';
import { resolveImageUrl } from '../lib/api';
import { formatDate } from '../lib/format';
import { useApi } from '../lib/useApi';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { userId = '' } = useParams();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: profile, loading, error, reload } = useApi(() => getUserById(userId), [userId]);

  if (loading) return <LoadingState label="Loading profile…" />;
  if (error || !profile) return <ErrorState message={error ?? 'User not found.'} onRetry={reload} />;

  const isSelf = user?.id === profile.id;
  const avatar = resolveImageUrl(profile.avatarUrl ?? null);

  const handleCopy = async () => {
    if (!profile.discordUsername) return;
    try {
      await navigator.clipboard.writeText(profile.discordUsername);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="user-profile">
      <nav className="user-profile__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">← Back to browse</Link>
      </nav>

      <div className="card user-profile__card">
        <div className="user-profile__header">
          {avatar ? (
            <img className="user-profile__avatar" src={avatar} alt="" />
          ) : (
            <span className="user-profile__avatar user-profile__avatar--fallback" aria-hidden="true">
              {profile.username.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1>{profile.username}</h1>
            <p className="muted">Member since {formatDate(profile.createdAt)}</p>
            {isSelf ? (
              <p className="user-profile__self">
                This is your profile — <Link to="/profile">edit it here</Link>.
              </p>
            ) : null}
          </div>
        </div>

        <section aria-label="Contact">
          <h2>Contact</h2>
          {profile.discordUsername ? (
            <div className="user-profile__discord">
              <div className="user-profile__discord-id">
                <span className="user-profile__discord-label">Discord</span>
                <span className="user-profile__discord-value">{profile.discordUsername}</span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleCopy()}>
                {copied ? 'Copied!' : 'Copy username'}
              </button>
            </div>
          ) : (
            <p className="muted">This user hasn’t added a Discord username yet.</p>
          )}
          {profile.discordUsername ? (
            <p className="muted user-profile__hint">
              Add <strong>{profile.discordUsername}</strong> as a friend in Discord and send them a
              message to talk about an item.
            </p>
          ) : null}
        </section>

        <p className="muted user-profile__privacy">
          Email addresses and phone numbers are never shared — chat happens outside this site, on
          Discord.
        </p>
      </div>
    </div>
  );
}

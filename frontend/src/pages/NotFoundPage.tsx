import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const { user } = useAuth();

  return (
    <div className="not-found">
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
      <h1>We couldn’t find that page</h1>
      <p className="muted">
        The link may be broken, or the listing may have been closed. Try searching from the
        homepage instead.
      </p>
      <div className="row not-found__actions">
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
        <Link className="btn btn-secondary" to={user ? '/dashboard' : '/login'}>
          {user ? 'Go to dashboard' : 'Sign in'}
        </Link>
      </div>
    </div>
  );
}

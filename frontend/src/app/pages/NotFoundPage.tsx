import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { buttonClasses } from '@/shared/ui/Button';

export const NotFoundPage = (): ReactNode => {
  const { user } = useAuth();

  return (
    <section className="flex flex-col items-center gap-4 pt-24 text-center">
      <p className="text-6xl font-extrabold tracking-tight text-accent-600">404</p>
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">
        The link may be broken, or the listing may have been closed. Try searching from the
        homepage instead.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link to="/" className={buttonClasses('primary', 'md')}>
          Back to home
        </Link>
        <Link
          to={user ? '/dashboard' : '/login'}
          className={buttonClasses('secondary', 'md')}
        >
          {user ? 'Go to dashboard' : 'Sign in'}
        </Link>
      </div>
    </section>
  );
};

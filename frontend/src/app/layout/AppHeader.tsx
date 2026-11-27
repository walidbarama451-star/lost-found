import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut, Menu, PackagePlus, Plus, Search, X } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/shared/lib/cn';
import { buttonClasses } from '@/shared/ui/Button';

/** Shared page chrome: a wordmark that links home, auth controls, mobile menu. */
export const AppHeader = (): ReactNode => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!addRef.current?.contains(event.target as Node)) setAddOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAddOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  const close = () => {
    setOpen(false);
    setAddOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to={user ? '/dashboard' : '/'}
          onClick={close}
          aria-label="Found It"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-ink"
        >
          <span>
            Found It{' '}
            <span className="ml-1.5 border-l border-[#bbc5df] pl-2 font-sans text-[0.85rem] font-semibold tracking-normal text-ink-muted">
              Platform
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-2 sm:flex" aria-label="Main">
          {user ? (
            <>
              <div className="relative" ref={addRef}>
                <button
                  type="button"
                  className={buttonClasses('secondary', 'sm')}
                  aria-expanded={addOpen}
                  aria-controls="topnav-add-menu"
                  onClick={() => setAddOpen((value) => !value)}
                >
                  <Plus size={15} aria-hidden />
                  New
                </button>

                {addOpen ? (
                  <div
                    id="topnav-add-menu"
                    className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-surface p-1 shadow-2xl"
                  >
                    <Link
                      to="/items/new"
                      onClick={close}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-overlay hover:text-ink"
                    >
                      <PackagePlus size={16} aria-hidden />
                      Post a found item
                    </Link>
                    <Link
                      to="/"
                      onClick={close}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-overlay hover:text-ink"
                    >
                      <Search size={16} aria-hidden />
                      Search for a missed one
                    </Link>
                  </div>
                ) : null}
              </div>

              <NavLink
                to="/profile"
                onClick={close}
                aria-label={`View ${user.username}'s profile`}
                title="View your profile"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-overlay text-ink'
                      : 'text-ink-muted hover:bg-overlay hover:text-ink',
                  )
                }
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-accent-600 text-[11px] font-semibold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-32 truncate">{user.username}</span>
              </NavLink>

              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className={buttonClasses('ghost', 'sm')}
              >
                <LogOut size={15} aria-hidden />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={close} className={buttonClasses('ghost', 'sm')}>
                Sign in
              </Link>
              <Link to="/register" onClick={close} className={buttonClasses('primary', 'sm')}>
                Create account
              </Link>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className={cn(buttonClasses('secondary', 'sm'), 'sm:hidden')}
          aria-expanded={open}
          aria-controls="topnav-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Mobile panel */}
      {open ? (
        <div id="topnav-menu" className="border-t border-line bg-surface px-4 py-3 sm:hidden">
          {user ? (
            <div className="flex flex-col gap-1">
              <Link
                to="/items/new"
                onClick={close}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-overlay hover:text-ink"
              >
                <PackagePlus size={16} aria-hidden />
                Post a found item
              </Link>
              <Link
                to="/"
                onClick={close}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-overlay hover:text-ink"
              >
                <Search size={16} aria-hidden />
                Search for a missed one
              </Link>
              <Link
                to="/profile"
                onClick={close}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-overlay hover:text-ink"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-accent-600 text-[11px] font-semibold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                {user.username}
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className={cn(buttonClasses('ghost', 'sm'), 'justify-start')}
              >
                <LogOut size={15} aria-hidden />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={close} className={buttonClasses('secondary', 'sm')}>
                Sign in
              </Link>
              <Link to="/register" onClick={close} className={buttonClasses('primary', 'sm')}>
                Create account
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
};

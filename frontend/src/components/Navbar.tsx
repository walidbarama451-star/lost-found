import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useApi } from '../lib/useApi';
import { useAuth } from '../features/auth/AuthContext';
import { listNotifications } from '../features/notifications/notificationsService';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-items', label: 'My listings' },
  { to: '/claims', label: 'My claims' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Unread badge: refreshed on login and after every navigation (spec 11).
  const { data: notifications, reload: reloadUnread } = useApi(
    async () => (user ? listNotifications(1, 1) : null),
    [user?.id ?? null],
  );

  useEffect(() => {
    if (user) reloadUnread();
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user]);

  const unread = notifications?.unreadCount ?? 0;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="navbar">
      <div className="app-container navbar__inner">
        <Link className="navbar__brand" to="/">
          <span className="navbar__brand-mark" aria-hidden="true">
            🔎
          </span>
          Lost &amp; Found
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-controls="navbar-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <nav
          id="navbar-menu"
          className={`navbar__menu${open ? ' navbar__menu--open' : ''}`}
          aria-label="Main"
        >
          <NavLink className="navbar__link" to="/" end>
            Browse
          </NavLink>

          {user ? (
            <>
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} className="navbar__link" to={link.to}>
                  {link.label}
                </NavLink>
              ))}

              <NavLink className="navbar__link navbar__link--badge" to="/notifications">
                Notifications
                {unread > 0 ? (
                  <span
                    className="navbar__badge"
                    aria-label={`${unread} unread notifications`}
                  >
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : null}
              </NavLink>

              <NavLink className="navbar__link" to="/profile">
                Profile
              </NavLink>

              <span className="navbar__user" title={user.email}>
                {user.username}
              </span>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
              >
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <NavLink className="navbar__link" to="/login">
                Sign in
              </NavLink>
              <Link className="btn btn-primary btn-sm" to="/register">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

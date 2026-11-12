import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import './Sidebar.css';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/lost-reports', label: 'My lost reports' },
  { to: '/my-items', label: 'My listings' },
  { to: '/claims', label: 'My claims' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile-only top bar that toggles the sidebar. */}
      <header className="sidebar__topbar">
        <Link className="sidebar__brand" to="/">
          <span className="sidebar__brand-mark" aria-hidden="true">
            🔎
          </span>
          Lost &amp; Found
        </Link>
        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={open}
          aria-controls="sidebar-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </header>

      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <Link className="sidebar__brand sidebar__brand--desktop" to="/">
          <span className="sidebar__brand-mark" aria-hidden="true">
            🔎
          </span>
          Lost &amp; Found
        </Link>

        <nav id="sidebar-nav" className="sidebar__nav" aria-label="Main" onClick={close}>
          <NavLink className="sidebar__link" to="/" end>
            Find my item
          </NavLink>

          {user ? (
            <>
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} className="sidebar__link" to={link.to}>
                  {link.label}
                </NavLink>
              ))}

              <NavLink className="sidebar__link" to="/profile">
                Profile
              </NavLink>
            </>
          ) : (
            <>
              <NavLink className="sidebar__link" to="/login">
                Sign in
              </NavLink>
              <Link className="btn btn-primary btn-sm sidebar__cta" to="/register">
                Create account
              </Link>
            </>
          )}
        </nav>

        {user ? (
          <div className="sidebar__footer">
            <span className="sidebar__user" title={user.email}>
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
          </div>
        ) : null}
      </aside>
    </>
  );
}

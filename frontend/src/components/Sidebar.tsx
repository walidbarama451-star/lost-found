import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const close = () => {
    setOpen(false);
    setAddOpen(false);
  };

  const toggleAdd = () => setAddOpen((value) => !value);

  return (
    <>
      {/* Mobile-only top bar that toggles the sidebar. */}
      <header className="sidebar__topbar">
        <Link className="sidebar__brand" to="/" onClick={close}>
          <span className="sidebar__brand-mark" aria-hidden="true">
            📍
          </span>
          Found It
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
            📍
          </span>
          Found It
        </Link>

        {/* Single entry point: post a found item or search for a missed one. */}
        <div className="sidebar__add">
          <button
            type="button"
            className="sidebar__add-btn"
            aria-expanded={addOpen}
            aria-controls="sidebar-add-menu"
            onClick={toggleAdd}
          >
            <span className="sidebar__add-icon" aria-hidden="true">
              +
            </span>
            New
          </button>

          {addOpen ? (
            <div id="sidebar-add-menu" className="sidebar__add-menu">
              <Link className="sidebar__add-option" to="/items/new" onClick={close}>
                📍 Post a found item
              </Link>
              <Link className="sidebar__add-option" to="/" onClick={close}>
                🔎 Search for a missed one
              </Link>
            </div>
          ) : null}
        </div>

        <nav id="sidebar-nav" className="sidebar__nav" aria-label="Main" onClick={close}>
          {!user ? (
            <>
              <Link className="sidebar__link" to="/login">
                Sign in
              </Link>
              <Link className="sidebar__link" to="/register">
                Create account
              </Link>
            </>
          ) : null}
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

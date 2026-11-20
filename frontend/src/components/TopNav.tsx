import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import './TopNav.css';

function NavIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const AUTH_NAV = [
  { to: '/login', label: 'Sign in' },
  { to: '/register', label: 'Create account' },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!addRef.current?.contains(event.target as Node)) {
        setAddOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAddOpen(false);
      }
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

  const toggleAdd = () => setAddOpen((value) => !value);

  const navItems = user ? [] : AUTH_NAV;
  const initial = user?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="topnav">
      <div className="topnav__inner app-container">
        <Link className="topnav__brand" to={user ? '/dashboard' : '/'} onClick={close}>
          <span className="topnav__brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>
          Found It
        </Link>

        <button
          type="button"
          className="topnav__toggle"
          aria-expanded={open}
          aria-controls="topnav-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <div id="topnav-menu" className={`topnav__menu${open ? ' topnav__menu--open' : ''}`}>
          {navItems.length > 0 ? (
            <nav className="topnav__nav" aria-label="Main" onClick={close}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `topnav__link${isActive ? ' topnav__link--active' : ''}`
                  }
                >
                  <NavIcon />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}

          {user ? (
            <div className="topnav__actions">
              <div className="topnav__add" ref={addRef}>
                <button
                  type="button"
                  className="topnav__add-btn"
                  aria-expanded={addOpen}
                  aria-controls="topnav-add-menu"
                  onClick={toggleAdd}
                >
                  <span className="topnav__add-icon" aria-hidden="true">
                    +
                  </span>
                  New
                </button>

                {addOpen ? (
                  <div id="topnav-add-menu" className="topnav__add-menu">
                    <Link className="topnav__add-option" to="/items/new" onClick={close}>
                      <span aria-hidden="true">📍</span> Post a found item
                    </Link>
                    <Link className="topnav__add-option" to="/" onClick={close}>
                      <span aria-hidden="true">🔎</span> Search for a missed one
                    </Link>
                  </div>
                ) : null}
              </div>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `topnav__profile${isActive ? ' topnav__profile--active' : ''}`
                }
                onClick={close}
                aria-label={`View ${user.username}'s profile`}
                title="View your profile"
              >
                <span className="topnav__avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="topnav__profile-name">{user.username}</span>
              </NavLink>

              <button
                type="button"
                className="topnav__signout"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
              >
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

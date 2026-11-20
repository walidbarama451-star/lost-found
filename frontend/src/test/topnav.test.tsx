import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TopNav from '../components/TopNav';
import { AuthProvider } from '../features/auth/AuthContext';
import type { User } from '../types';

const USER: User = {
  id: 'u1',
  username: 'walid',
  email: 'walid@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function stubSession(authenticated: boolean) {
  const mock = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes('/auth/me')) {
      return authenticated
        ? jsonResponse({ success: true, data: { user: USER } })
        : jsonResponse({ success: false, message: 'Not authenticated', errors: [] }, 401);
    }
    return jsonResponse({ success: false, message: `Unexpected request: ${url}` }, 500);
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function renderTopNav() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TopNav />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('TopNav', () => {
  it('shows sign-in links when signed out', async () => {
    stubSession(false);
    renderTopNav();

    expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByRole('link', { name: 'Found It' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();
  });

  it('links the avatar to the profile page and omits the profile nav item', async () => {
    stubSession(true);
    renderTopNav();

    const profileLink = await screen.findByRole('link', {
      name: "View walid's profile",
    });
    expect(profileLink).toHaveAttribute('href', '/profile');
    expect(profileLink).toHaveTextContent('walid');
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Found It' })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
  });

  it('opens the New menu and closes it on outside click', async () => {
    stubSession(true);
    const user = userEvent.setup();
    renderTopNav();

    await screen.findByRole('link', { name: "View walid's profile" });
    await user.click(screen.getByRole('button', { name: /new/i }));

    expect(screen.getByRole('link', { name: /post a found item/i })).toHaveAttribute(
      'href',
      '/items/new'
    );

    await user.click(document.body);
    expect(screen.queryByRole('link', { name: /post a found item/i })).not.toBeInTheDocument();
  });
});

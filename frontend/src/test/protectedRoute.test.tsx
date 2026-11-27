import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { AuthProvider } from '@/features/auth/AuthContext';
import type { User } from '@/shared/api/types';

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

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <p>Secret dashboard</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated visitors to /login', async () => {
    stubSession(false);
    renderProtected();

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('renders the children when authenticated', async () => {
    stubSession(true);
    renderProtected();

    expect(await screen.findByText('Secret dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});

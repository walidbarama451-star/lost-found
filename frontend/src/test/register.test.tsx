/**
 * Register form validation (spec 11): username ≥ 3, valid email,
 * password ≥ 8 — errors render and the submit is blocked (no API call).
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth/AuthContext';
import RegisterPage from '../pages/RegisterPage';

const USER = {
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

/** Stubs global fetch; every request URL is recorded on the returned mock. */
function stubFetch(handler: (url: string) => Response) {
  const mock = vi.fn(async (input: unknown) => handler(String(input)));
  vi.stubGlobal('fetch', mock);
  return mock;
}

/** Session bootstrap: guest (401) unless the test overrides it. */
function guestBootstrap(url: string): Response | null {
  if (url.includes('/auth/me')) {
    return jsonResponse({ success: false, message: 'Not authenticated', errors: [] }, 401);
  }
  return null;
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RegisterPage validation', () => {
  it('renders field errors for invalid input and blocks the submit', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch((url) => {
      const guest = guestBootstrap(url);
      if (guest) return guest;
      throw new Error(`Unexpected request: ${url}`);
    });

    renderRegister();

    await user.type(screen.getByLabelText('Username'), 'ab');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // Field-level errors render (mirror of the backend rules).
    expect(
      await screen.findByText('Username must be at least 3 characters', {
        selector: '#register-username-error',
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Enter a valid email address', {
        selector: '#register-email-error',
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Password must be at least 8 characters', {
        selector: '#register-password-error',
      }),
    ).toBeInTheDocument();

    // Submit blocked: no register request ever leaves the client.
    const didRegister = fetchMock.mock.calls.some(([url]) =>
      String(url).includes('/auth/register'),
    );
    expect(didRegister).toBe(false);
  });

  it('submits valid input to the API', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch((url) => {
      const guest = guestBootstrap(url);
      if (guest) return guest;
      if (url.includes('/auth/register')) {
        return jsonResponse({ success: true, data: { user: USER } }, 201);
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    renderRegister();

    await user.type(screen.getByLabelText('Username'), 'walid');
    await user.type(screen.getByLabelText('Email'), 'walid@example.com');
    await user.type(screen.getByLabelText('Password'), 'supersecret1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes('/auth/register')),
      ).toBe(true);
    });
    expect(await screen.findByRole('button', { name: 'Create account' })).toBeEnabled();
  });
});

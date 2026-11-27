import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AppHeader } from './AppHeader';

/** Shared page chrome: a wordmark that links home, and the routed outlet. */
export const AppLayout = (): ReactNode => (
  <AuthProvider>
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  </AuthProvider>
);

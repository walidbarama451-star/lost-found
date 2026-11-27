import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import HomePage from '@/features/lostReports/pages/HomePage';
import MyLostReportsPage from '@/features/lostReports/pages/MyLostReportsPage';
import ItemCreatePage from '@/features/items/pages/ItemCreatePage';
import ItemDetailPage from '@/features/items/pages/ItemDetailPage';
import ItemEditPage from '@/features/items/pages/ItemEditPage';
import MyItemsPage from '@/features/items/pages/MyItemsPage';
import ItemClaimsPage from '@/features/claims/pages/ItemClaimsPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import UserProfilePage from '@/features/profile/pages/UserProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'lost-reports',
        element: (
          <ProtectedRoute>
            <MyLostReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'items/new',
        element: (
          <ProtectedRoute>
            <ItemCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'items/:itemId',
        element: (
          <ProtectedRoute>
            <ItemDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'items/:itemId/edit',
        element: (
          <ProtectedRoute>
            <ItemEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'items/:itemId/claims',
        element: (
          <ProtectedRoute>
            <ItemClaimsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-items',
        element: (
          <ProtectedRoute>
            <MyItemsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/:userId',
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

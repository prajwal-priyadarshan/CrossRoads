import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/features/landing/LandingPage';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { element: <AppShell />, children: [{ path: '/home', element: <HomePage /> }] },
  { path: '*', element: <NotFoundPage /> },
]);

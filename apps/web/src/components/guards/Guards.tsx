import { Navigate, Outlet, useLocation } from 'react-router';
import { useMe } from '@/hooks/useMe';
import { FullPageSpinner } from '@/components/shared/FullPageSpinner';

export function RequireAuth() {
  const { data: me, isLoading } = useMe();
  const loc = useLocation();
  if (isLoading) return <FullPageSpinner />;
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}

export function RequireOnboarded() {
  const { data: me } = useMe();
  if (me && !me.onboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <FullPageSpinner />;
  if (me) return <Navigate to={me.onboarded ? '/home' : '/onboarding'} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { data: me } = useMe();
  if (me?.role !== 'ADMIN') return <Navigate to="/home" replace />;
  return <Outlet />;
}

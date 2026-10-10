import { Navigate } from 'react-router';
import { useMe } from '@/hooks/useMe';

// Profile pages arrive in Phase 03; until then /u/:handle falls through to the 404 page.
export function MeRedirect() {
  const { data: me } = useMe();
  return me ? <Navigate to={`/u/${me.handle}`} replace /> : null;
}

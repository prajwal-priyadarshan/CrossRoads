import { Navigate } from 'react-router';
import { useMe } from '@/hooks/useMe';

export function MeRedirect() {
  const { data: me } = useMe();
  return me ? <Navigate to={`/u/${me.handle}`} replace /> : null;
}

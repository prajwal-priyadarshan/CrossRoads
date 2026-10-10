import { Link } from 'react-router';
import { useMe } from '@/hooks/useMe';
import { cn } from '@/lib/utils';

/**
 * The brand mark only. Signed-in users go to the app; everyone else goes to the landing page.
 * `onDark` forces the cream version for dark panels, regardless of theme.
 */
export function Logo({ className, to, onDark = false }: { className?: string; to?: string; onDark?: boolean }) {
  const { data: me } = useMe();
  const target = to ?? (me ? '/home' : '/');
  return (
    <Link to={target} aria-label="Home" className={cn('flex items-center', className)}>
      {onDark ? (
        <img src="/brand/crossroads-mark-dark.png" alt="" className="h-8 w-auto" />
      ) : (
        <>
          <img src="/brand/crossroads-mark.png" alt="" className="block h-7 w-auto dark:hidden" />
          <img src="/brand/crossroads-mark-dark.png" alt="" className="hidden h-7 w-auto dark:block" />
        </>
      )}
    </Link>
  );
}

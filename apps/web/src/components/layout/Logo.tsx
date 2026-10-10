import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/** The brand mark only. `onDark` forces the cream version for dark panels, regardless of theme. */
export function Logo({ className, to = '/home', onDark = false }: { className?: string; to?: string; onDark?: boolean }) {
  return (
    <Link to={to} aria-label="Home" className={cn('flex items-center', className)}>
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

import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export function Logo({ className, to = '/home' }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <img src="/logo.svg" alt="" className="size-8" />
      <span className="font-display text-lg font-bold tracking-tight">BridgeUp</span>
    </Link>
  );
}

import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { MOBILE_NAV } from './nav';

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn('flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground', isActive && 'text-primary')
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

import type { ComponentType } from 'react';
import { Link, NavLink } from 'react-router';
import { useMe } from '@/hooks/useMe';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { PRIMARY_NAV, CAREER_NAV, CAMPUS_NAV, FOOTER_NAV } from './nav';

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }> };

function Group({ label, items }: { label?: string; items: Item[] }) {
  return (
    <div>
      {label && (
        <p className="mb-1 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      )}
      <nav className="space-y-0.5">
        {items.map(({ to, label: text, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
                isActive &&
                  'bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-full before:bg-primary',
              )
            }
          >
            <Icon className="size-4" />
            {text}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const { data: me } = useMe();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r bg-card/60 px-3 py-4 backdrop-blur lg:flex">
      <Logo className="px-3 pb-2" />
      <div className="flex-1 overflow-y-auto">
        <Group items={PRIMARY_NAV} />
        <Group label="Career" items={CAREER_NAV} />
        <Group label="Campus" items={CAMPUS_NAV} />
      </div>
      <div className="space-y-3 border-t pt-3">
        <Group items={FOOTER_NAV.filter((i) => !i.adminOnly || me?.role === 'ADMIN')} />
        {me && (
          <Link to="/me" className="flex items-center gap-3 rounded-xl bg-muted/60 p-2.5 transition hover:bg-muted">
            <UserAvatar user={me} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.fullName}</p>
              <RoleBadge role={me.role} currentYear={me.currentYear} />
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}

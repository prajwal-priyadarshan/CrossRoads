import { Link } from 'react-router';
import { useTopics } from './api';
import { AppIcon } from '@/components/shared/AppIcon';
import { cn } from '@/lib/utils';

/** Horizontally scrollable topic chips: All + the six topics. */
export function TopicTabs({ active, base = '/community' }: { active?: string; base?: string }) {
  const { data: topics = [] } = useTopics();
  const items = [{ slug: '', name: 'All', icon: 'hash' }, ...topics];
  return (
    <div className="relative -mx-4 md:mx-0">
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((t) => {
          const on = (active ?? '') === t.slug;
          return (
            <Link
              key={t.slug || 'all'}
              to={t.slug ? `${base}/${t.slug}` : base}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                on ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <AppIcon name={t.icon} className="size-3.5" />
              {t.name}
            </Link>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-background md:hidden" />
    </div>
  );
}

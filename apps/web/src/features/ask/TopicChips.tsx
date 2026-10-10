import { useTopics } from '@/features/community/api';
import { AppIcon } from '@/components/shared/AppIcon';
import { cn } from '@/lib/utils';

/** Topic filter chips that keep state locally (no navigation). */
export function TopicTabsState({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const { data: topics = [] } = useTopics();
  const items = [{ slug: '', name: 'All', icon: 'hash' }, ...topics];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((t) => (
        <button
          key={t.slug || 'all'}
          type="button"
          aria-pressed={value === t.slug}
          onClick={() => onChange(t.slug)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
            value === t.slug ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          <AppIcon name={t.icon} className="size-3.5" />
          {t.name}
        </button>
      ))}
    </div>
  );
}

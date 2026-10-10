import { GOAL_TRACKS } from '@bridgeup/shared';
import { AppIcon } from '@/components/shared/AppIcon';
import { cn } from '@/lib/utils';

const TRACKS = GOAL_TRACKS.filter((g) => g.value !== 'UNDECIDED');

/** Seven goal cards; clicking the selected one clears it when allowClear is set. */
export function GoalTrackPicker({
  value,
  onChange,
  allowClear = false,
}: {
  value: string;
  onChange: (v: string) => void;
  allowClear?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {TRACKS.map((g) => {
        const on = value === g.value;
        return (
          <button
            key={g.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on && allowClear ? '' : g.value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition hover:border-primary/50',
              on && 'border-primary bg-primary-soft',
            )}
          >
            <AppIcon name={g.icon} className="size-5 text-primary" />
            <span className="text-xs font-medium leading-tight">{g.label}</span>
          </button>
        );
      })}
    </div>
  );
}

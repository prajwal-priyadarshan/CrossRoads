import { cn } from '@/lib/utils';

/** Five small dots, filled amber up to the value. Interactive when onChange is given. */
export function DifficultyDots({
  value,
  onChange,
  size = 'sm',
  label = 'Difficulty',
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'lg';
  label?: string;
}) {
  const dot = size === 'lg' ? 'size-6' : 'size-2';
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label} ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn('rounded-full', dot, i <= value ? 'bg-warm' : 'bg-muted')} />
        ))}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} of 5`}
          onClick={() => onChange(i)}
          className={cn('rounded-full transition hover:scale-110', dot, i <= value ? 'bg-warm' : 'bg-muted')}
        />
      ))}
    </span>
  );
}

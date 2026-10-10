import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

export function ReasonChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
      <Sparkles className="size-3" />
      {children}
    </span>
  );
}

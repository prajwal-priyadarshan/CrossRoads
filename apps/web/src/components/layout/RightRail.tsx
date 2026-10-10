import type { ReactNode } from 'react';

export function RightRail({ children, rail }: { children: ReactNode; rail: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{children}</div>
      <aside className="space-y-4 self-start lg:sticky lg:top-24">{rail}</aside>
    </div>
  );
}

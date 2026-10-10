import { Outlet } from 'react-router';
import { BadgeCelebration } from '@/components/gamification/BadgeCelebration';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { useChatStream } from '@/features/chat/useChatStream';
import { useMe } from '@/hooks/useMe';

export function AppShell() {
  const { data: me } = useMe();
  useChatStream(Boolean(me));
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div className="lg:pl-[248px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-6 md:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
      <BadgeCelebration />
    </div>
  );
}

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/uiStore';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export function Topbar() {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-8">
      <Logo className="lg:hidden" />
      <Button
        variant="outline"
        className="hidden w-full max-w-md justify-start text-muted-foreground lg:flex"
        onClick={() => setPaletteOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left font-normal">Search questions, people, companies…</span>
        <kbd className="rounded border bg-muted px-1.5 text-[10px] font-medium">⌘K</kbd>
      </Button>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Search"
          onClick={() => setPaletteOpen(true)}
        >
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

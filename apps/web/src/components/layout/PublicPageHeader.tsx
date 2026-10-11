import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

/** Header for pages reachable without signing in (mirrors Support/DataNotice). */
export function PublicPageHeader() {
  return (
    <header className="border-b bg-card/50 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link to="/" aria-label="Home" className="flex items-center">
          <img src="/brand/crossroads-mark.png" alt="" className="block h-7 w-auto dark:hidden" />
          <img src="/brand/crossroads-mark-dark.png" alt="" className="hidden h-7 w-auto dark:block" />
        </Link>
        <Button variant="ghost" asChild>
          <Link to="/home">Go to App</Link>
        </Button>
      </div>
    </header>
  );
}

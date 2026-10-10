import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '@/components/ui/button';

/** Shown instead of the default crash screen. A failed page load usually means a new version was deployed, so a reload fixes it. */
export function RouteErrorPage() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : isRouteErrorResponse(error) ? error.statusText : '';
  const moduleLoadFailed = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {moduleLoadFailed ? 'A page could not load' : 'Something went wrong'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {moduleLoadFailed
            ? 'The app was updated while you were using it. Reload to continue.'
            : 'We could not show this page. Try again, or go back home.'}
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

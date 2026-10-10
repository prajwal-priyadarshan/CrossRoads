import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

export function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4">
      <EmptyState
        icon={Compass}
        title="We couldn't find that page"
        description="The link may be broken or the page may have moved."
        action={
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
        }
      />
    </div>
  );
}

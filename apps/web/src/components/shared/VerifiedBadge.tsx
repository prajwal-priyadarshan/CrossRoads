import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function VerifiedBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex text-success" aria-label="Verified by admins">
          <BadgeCheck className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Verified by admins</TooltipContent>
    </Tooltip>
  );
}

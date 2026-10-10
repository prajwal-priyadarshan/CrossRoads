import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function SelfReportedBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Self-reported
        </span>
      </TooltipTrigger>
      <TooltipContent>Shared by the author; not independently verified</TooltipContent>
    </Tooltip>
  );
}

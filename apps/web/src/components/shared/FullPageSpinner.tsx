export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status" aria-label="Loading">
      <img src="/brand/crossroads-mark.png" alt="" className="size-12 animate-pulse dark:hidden" />
      <img src="/brand/crossroads-mark-dark.png" alt="" className="hidden size-12 animate-pulse dark:block" />
    </div>
  );
}

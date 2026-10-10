export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status" aria-label="Loading">
      <img src="/logo.svg" alt="" className="size-12 animate-pulse" />
    </div>
  );
}

export function MatchRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? 'text-success' : score >= 40 ? 'text-primary' : 'text-muted-foreground';
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match score ${score} out of 100`}
    >
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className={`stroke-current ${color} transition-[stroke-dashoffset] duration-700`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
        />
      </svg>
      <span className="tabular absolute inset-0 grid place-items-center text-[11px] font-semibold">{score}</span>
    </div>
  );
}

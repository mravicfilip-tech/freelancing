/**
 * The presale progress bar from the landing hero (FigmaHero `fh__progress`),
 * reused here rather than redrawn: a hairline-ruled track, a fill made of 3px
 * bars capped solid at each end, and a sheen over the filled part.
 */
export function Progress({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div
      className={className ? `dprog ${className}` : 'dprog'}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div className="dprog__fill" style={{ width: `${pct}%` }}>
        <span className="dprog__glow" aria-hidden="true" />
      </div>
    </div>
  );
}

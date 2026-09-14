import { RtxMark } from '../icons';
import type { Update } from './data';

/**
 * The default thumbnail an update carries when it has no picture of its
 * own: the brand mark, the headline, and a quiet piece of art behind them,
 * on the site's ink whatever the page theme, so it reads as an image rather
 * than another card. The feature card shows the art alone, since its
 * headline is set beside it.
 */
/** Thin rings off the top-right corner, brighter towards their centre, over
    the site's dot grid, which fades away from that corner. */
function Art() {
  return (
    <svg className="thumb__art thumb__art--rings" viewBox="0 0 320 180" aria-hidden="true">
      {[44, 84, 124, 164, 204].map((r, i) => (
        <circle key={r} cx="292" cy="26" r={r} style={{ opacity: 0.9 - i * 0.17 }} />
      ))}
    </svg>
  );
}

export function Thumb({ u, titled = true, className }: { u: Update; titled?: boolean; className?: string }) {
  return (
    <div className={`thumb${className ? ` ${className}` : ''}`} aria-hidden={!titled || undefined}>
      <Art />
      <span className="thumb__brand">
        <RtxMark className="icon-20" />
        Remittix
      </span>
      {titled && (
        <span className="thumb__title">
          {u.title} <em>{u.accent}</em>
        </span>
      )}
    </div>
  );
}

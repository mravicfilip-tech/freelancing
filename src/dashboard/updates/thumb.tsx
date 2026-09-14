import { RtxMark } from '../icons';
import type { Update } from './data';

/**
 * The default thumbnail an update carries when it has no picture of its
 * own: the brand mark, the headline, and a quiet piece of art behind them,
 * on the site's ink whatever the page theme, so it reads as an image rather
 * than another card. `variant` picks the art; the feature card shows the
 * art with the release number in place of the headline, since its headline
 * is set beside it.
 */
export type ThumbVariant = 1 | 2 | 3 | 4 | 5;

function Art({ variant }: { variant: ThumbVariant }) {
  if (variant === 2) {
    return (
      <svg className="thumb__art thumb__art--rings" viewBox="0 0 320 200" aria-hidden="true">
        {[52, 92, 132, 172].map((r) => (
          <circle key={r} cx="286" cy="34" r={r} />
        ))}
      </svg>
    );
  }
  if (variant === 3) {
    return (
      <svg className="thumb__art thumb__art--ladder" viewBox="0 0 320 200" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={12 + i * 25.5} y={200 - 22 - i * 9} width="19" height={22 + i * 9} rx="3" data-live={i === 6 || undefined} />
        ))}
      </svg>
    );
  }
  if (variant === 5) {
    return <RtxMark className="thumb__art thumb__art--mark" />;
  }
  return null;
}

export function Thumb({ u, variant, titled = true, className }: { u: Update; variant: ThumbVariant; titled?: boolean; className?: string }) {
  return (
    <div className={`thumb${className ? ` ${className}` : ''}`} data-t={variant} aria-hidden={!titled || undefined}>
      <Art variant={variant} />
      <span className="thumb__brand">
        <RtxMark className="icon-20" />
        Remittix
      </span>
      {titled ? (
        <span className="thumb__title">
          {u.title} <em>{u.accent}</em>
        </span>
      ) : (
        <span className="thumb__n num">{u.n}</span>
      )}
    </div>
  );
}

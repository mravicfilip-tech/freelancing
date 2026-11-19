// The sliding photo grid, two columns of pictures that rise at their own pace and hold under the pointer. The Najam hero's (taste
// 2026-11-19 13:10) and the models picked on Kontakt (taste 2026-11-19 16:03, "just do a random grid of sliding images like we did on a
// hero page here"). Each column's list runs twice, so half its height is exactly one loop. A picture can take its own size, so the
// grid reads as random, and a cut out model sits whole on the tint with its name under it. Styles in shop.css, .sp-reel.
import type { CSSProperties } from 'react';

export type ReelItem = { src: string; focus?: string; contain?: boolean; label?: string; ratio?: string };

export function ReelCols({ a, b, className = '' }: { a: ReelItem[]; b: ReelItem[]; className?: string }) {
  const col = (list: ReelItem[], cls: string) => (
    <div className={`sp-reel-col ${cls}`}>
      {[...list, ...list].map((p, i) => (
        <span className={`sp-reel-ph${p.contain ? ' is-contain' : ''}`} style={p.ratio ? ({ aspectRatio: p.ratio } as CSSProperties) : undefined} key={i}>
          <img src={p.src} alt="" decoding="async" loading={i < list.length ? 'eager' : 'lazy'} style={p.focus ? { objectPosition: p.focus } : undefined} />
          {p.label ? <span className="sp-reel-l">{p.label}</span> : null}
        </span>
      ))}
    </div>
  );
  return (
    <div className={`sp-reel ${className}`.trim()} aria-hidden="true">
      {col(a, 'is-a')}
      {col(b, 'is-b')}
    </div>
  );
}

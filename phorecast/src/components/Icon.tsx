import type { CSSProperties } from 'react';
import '../styles/icon.css';

export interface IconProps {
  /** An imported SVG URL — exactly what the <img> this replaces was given. */
  src: string;
  /** The box, in px. Pass the <img>'s own width/height; fractions are fine. */
  w: number;
  h: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * A single-colour SVG, painted by `color` rather than by what Figma baked in.
 *
 * `<img src={x} alt="" width={20} height={20} />`  becomes
 * `<Icon src={x} w={20} h={20} />`
 *
 * and the colour is then whatever `color` resolves to on the element — so it
 * follows a token, inherits from its label, and animates as `color`. The
 * `brightness(0) invert(1)` filters that exist today to force an asset white
 * are deletions, not conversions.
 *
 * Use it ONLY for a file that is one flat colour on transparent. A gradient or
 * a multi-colour illustration loses everything but its silhouette to a mask.
 *
 * The width/height translation is the only place a geometry regression can
 * hide, which is exactly what `theme-diff.mjs` is good at: `geometry` must
 * stay 0 across the conversion.
 */
export function Icon({ src, w, h, className = '', style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `icon ${className}` : 'icon'}
      style={{ '--icon': `url(${src})`, width: w, height: h, ...style } as CSSProperties}
    />
  );
}

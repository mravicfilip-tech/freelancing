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
      style={{ '--icon': cssUrl(src), width: w, height: h, ...style } as CSSProperties}
    />
  );
}

/**
 * The URL MUST be quoted, and getting this wrong fails silently.
 *
 * Vite inlines an SVG under `assetsInlineLimit` as a `data:` URI rather than a
 * path, and this project's assets carry `style='display: block;'` from Figma —
 * so the URI contains a literal `;`, and the exporter percent-encodes only the
 * space next to it. An unquoted `url(data:…;…)` is then an invalid token,
 * `style.setProperty` rejects the whole declaration without throwing, the
 * custom property is simply absent, and `background: currentColor` paints the
 * element's full box: a solid rectangle where the glyph should be. Nothing
 * logs, and at 13x7px it reads as a slightly bolder chevron.
 *
 * Quoting is not optional and is not only for data URIs — an asset path with a
 * space or a parenthesis in it would break the same way.
 */
const cssUrl = (src: string) => `url("${src.replace(/["\\]/g, '\\$&')}")`;

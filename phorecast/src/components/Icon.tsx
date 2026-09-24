import type { CSSProperties } from 'react';
import '../styles/icon.css';

export interface IconProps {
  /** An imported SVG URL, the same value an <img> would take. */
  src: string;
  /** The box, in px, as an <img>'s width/height would be; fractions are fine. */
  w: number;
  h: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * A single-colour SVG, painted by `color` rather than by what Figma baked in.
 *
 * `<img src={x} alt="" width={20} height={20} />` is written as
 * `<Icon src={x} w={20} h={20} />`
 *
 * and the colour is then whatever `color` resolves to on the element, so it
 * follows a token, inherits from its label, and animates as `color`. No
 * `brightness(0) invert(1)` filter is needed to force an asset white.
 *
 * Use it ONLY for a file that is one flat colour on transparent. A gradient or
 * a multi-colour illustration loses everything but its silhouette to a mask.
 *
 * Gotcha: GSAP `clearProps: 'all'` wipes the whole inline style, including the
 * `--icon` custom property, and the mask then paints a solid box. Clear named
 * properties instead.
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
 * Vite inlines a small SVG as a `data:` URI, and the Figma exports carry
 * `style='display: block;'`, so the URI contains a literal `;`. Unquoted, the
 * `url()` is invalid, the declaration is dropped without an error, `--icon` is
 * absent, and `background: currentColor` paints a solid rectangle where the
 * glyph should be. A path with a space or a parenthesis breaks the same way.
 */
const cssUrl = (src: string) => `url("${src.replace(/["\\]/g, '\\$&')}")`;

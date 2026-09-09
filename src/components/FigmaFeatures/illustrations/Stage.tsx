import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Where the portrait layouts take over — the breakpoint the section's CSS stacks the cards at. */
export const MOBILE_ART = '(max-width: 720px)';

/**
 * True while the viewport is narrow enough for the portrait illustrations. The illustrations are
 * laid out in design coordinates, so a phone needs the design's own portrait composition rather
 * than the landscape one scaled down; crossing the breakpoint swaps the layout and remounts the
 * scene, which lets its motion rebuild on the axis it now runs along.
 */
export function useMobileArt() {
  const [mobile, setMobile] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(MOBILE_ART).matches));
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_ART);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}

/**
 * A fixed-size design canvas (1x px from Figma) that scales to fill its box while keeping its
 * aspect ratio, so layers can be placed in design coordinates and still fit every breakpoint.
 * The card CSS positions and sizes the outer box (`.ff__art--*`); `--k` is the fitted scale.
 * `layout` reaches the motion modules as `data-layout`, so a scene can animate along the axis its
 * portrait composition runs on.
 */
export function Stage({
  id,
  width,
  height,
  className,
  layout = 'desktop',
  children,
}: {
  id: string;
  width: number;
  height: number;
  className: string;
  layout?: 'desktop' | 'mobile';
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => el.style.setProperty('--k', String(el.clientWidth / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div
      ref={ref}
      className={`ff__il ${className}`}
      data-il={id}
      data-layout={layout}
      style={{ aspectRatio: `${width} / ${height}` }}
      aria-hidden="true"
    >
      <div className="ff__stage" style={{ width, height }}>
        {children}
      </div>
    </div>
  );
}

/** URL of a layer exported from the Figma file (public/figma/features/parts), or an absolute path as given. */
export const part = (name: string) => (name.startsWith('/') ? name : `/figma/features/parts/${name}`);
/** URL of a layer exported from the bento section's Figma node (public/figma/bento). */
export const B = (name: string) => `/figma/bento/${name}`;

/** An exported layer placed at design coordinates. */
export function Layer({ src, x, y, w, h, className, style }: { src: string; x: number; y: number; w: number; h: number; className?: string; style?: React.CSSProperties }) {
  return <img className={className} src={part(src)} alt="" style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }} />;
}

/** An inline SVG (imported `?raw`) placed at design coordinates, so its paths can be drawn. */
export function Strokes({ svg, x, y, w, h, className, style }: { svg: string; x: number; y: number; w: number; h: number; className?: string; style?: React.CSSProperties }) {
  return <div className={`il-svg${className ? ` ${className}` : ''}`} style={{ left: x, top: y, width: w, height: h, ...style }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

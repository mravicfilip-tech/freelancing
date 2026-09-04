import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A fixed-size design canvas (1x px from Figma) that scales to fill its box while keeping its
 * aspect ratio, so layers can be placed in design coordinates and still fit every breakpoint.
 * The card CSS positions and sizes the outer box (`.ff__art--*`); `--k` is the fitted scale.
 */
export function Stage({ id, width, height, className, children }: { id: string; width: number; height: number; className: string; children: ReactNode }) {
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
    <div ref={ref} className={`ff__il ${className}`} data-il={id} style={{ aspectRatio: `${width} / ${height}` }} aria-hidden="true">
      <div className="ff__stage" style={{ width, height }}>
        {children}
      </div>
    </div>
  );
}

/** URL of a layer exported from the Figma file (public/figma/features/parts), or an absolute path as given. */
export const part = (name: string) => (name.startsWith('/') ? name : `/figma/features/parts/${name}`);

/** An exported layer placed at design coordinates. */
export function Layer({ src, x, y, w, h, className, style }: { src: string; x: number; y: number; w: number; h: number; className?: string; style?: React.CSSProperties }) {
  return <img className={className} src={part(src)} alt="" style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }} />;
}

/** An inline SVG (imported `?raw`) placed at design coordinates, so its paths can be drawn. */
export function Strokes({ svg, x, y, w, h, className, style }: { svg: string; x: number; y: number; w: number; h: number; className?: string; style?: React.CSSProperties }) {
  return <div className={`il-svg${className ? ` ${className}` : ''}`} style={{ left: x, top: y, width: w, height: h, ...style }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

import { useEffect, useState } from 'react';
import { content } from '../../../../shared/content';
import { t6 } from '../copy-hero6';
import { VIEWS, type View } from './geometry';
import '../hero6-still.css';

// Beat 4 on phones and wherever WebGL does not run. Two stills from the same camera, all schematic
// underneath and all render on top, registered to the pixel, and the render still's clip follows
// p, so the seam slides in CSS and no WebGL runs. The seam line and its two mono tags ride on the
// clip edge. The scene's labels are drawn by Hero6, not here. Reduced motion holds p at 0.
//
// The pairs exist for tall and mid. wide has no pair and shows its one still, seam at the middle.

const SEAM_START = 0.5; // the middle of the specimen at p 0
const SEAM_END = 0.15; // 15 percent from its left end at p 1
const CHAR = 7.68; // Azeret Mono 12px, advance 0.6em plus 0.04em tracking
const TAG_PAD = 16;

const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep, in and out

// The seam as a fraction of the box width, left to right, for progress p. Beat 4's one mapping.
export function seamAt(p: number) {
  const q = Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
  return SEAM_START + (SEAM_END - SEAM_START) * ease(q);
}

function useReduced() {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setOn(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return on;
}

function readLang() {
  return new URLSearchParams(window.location.search).get('lang') === 'de' ? 'de' : 'en';
}

export function StillSeam({ view, p, alt }: { view: Exclude<View, 'wide'> | 'wide'; p: number; alt: string }) {
  const reduced = useReduced();
  const aspect = VIEWS[view].aspect;
  if (view === 'wide') {
    return <img className="h6s__one" src="/render/hero6-wide.webp" width={VIEWS.wide.nominal[0]} height={VIEWS.wide.nominal[1]} alt={alt} decoding="async" draggable={false} />;
  }

  const x = t6(content[readLang()]);
  const tagL = x.schematic.toLocaleUpperCase(readLang());
  const tagR = x.render.toLocaleUpperCase(readLang());
  const wL = Math.round(tagL.length * CHAR - 0.5 + TAG_PAD);
  const pct = seamAt(reduced ? 0 : p) * 100;
  const [w, h] = VIEWS[view].nominal;

  return (
    <div className="h6s" style={{ aspectRatio: String(aspect), ['--x' as string]: `${pct.toFixed(3)}%`, ['--wl' as string]: `${wL}px` }}>
      <img className="h6s__img h6s__img--schem" src={`/render/hero6-${view}-schematic.webp`} width={w} height={h} alt="" decoding="async" draggable={false} />
      <img className="h6s__img h6s__img--render" src={`/render/hero6-${view}-render.webp`} width={w} height={h} alt={alt} decoding="async" draggable={false} />
      <div className="h6s__edge" aria-hidden="true">
        <span className="h6s__line" />
        <span className="h6s__tagbox h6s__tagbox--l">
          <span className="h6s__tag">{tagL}</span>
        </span>
        <span className="h6s__tag h6s__tag--r">{tagR}</span>
      </div>
    </div>
  );
}

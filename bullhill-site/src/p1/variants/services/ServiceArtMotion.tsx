import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ServiceArt } from '../../art';
import { motionOn } from '../../motion/motion';
import { svcVariant } from './params';
import type { SvcN } from './params';
import { plan } from './plan';
import type { Kind } from './plan';
import './services.css';

// The dot art of one service card, in the four versions behind ?svc, see params.ts. The dots are
// the ones ServiceArt draws, same positions, sizes, tones and opacity. With motion off the plain
// ServiceArt is returned, so reduced motion, ?motion=off and automated shots see it as it was.
// The svg carries data-go, which the CSS reads.
//   no     waiting for the card to enter, the dots are hidden (versions 1 and 3)
//   yes    the move is playing or done, and in version 3 data-loop says whether the loop may run
//   live   on screen, so the loop runs (version 2)
//   off    off screen, so the loop is paused (version 2)
//   idle   still, waiting for the pointer (version 4)

const PERIOD: Record<Kind, number> = { trench: 5, ducts: 6, house: 5.4, layers: 4.6 };
const PITCH = 360 / 64;

function useGo(ref: React.RefObject<SVGSVGElement | null>, v: SvcN) {
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const set = (s: string) => svg.setAttribute('data-go', s);
    const once = (margin: string, then: () => void) => {
      const io = new IntersectionObserver(
        (es) => {
          if (!es.some((e) => e.isIntersecting)) return;
          io.disconnect();
          then();
        },
        { rootMargin: margin },
      );
      io.observe(svg);
      return () => io.disconnect();
    };
    if (v === 1) {
      set('no');
      return once('0px 0px -12% 0px', () => set('yes'));
    }
    if (v === 3) {
      // assemble once, then the loop runs only while the card is on screen
      set('no');
      let vis: IntersectionObserver | null = null;
      const stop = once('0px 0px -12% 0px', () => {
        set('yes');
        vis = new IntersectionObserver((es) => svg.setAttribute('data-loop', es[es.length - 1].isIntersecting ? 'live' : 'off'));
        vis.observe(svg);
      });
      return () => {
        stop();
        vis?.disconnect();
      };
    }
    if (v === 2) {
      set('off');
      const io = new IntersectionObserver((es) => set(es[es.length - 1].isIntersecting ? 'live' : 'off'));
      io.observe(svg);
      return () => io.disconnect();
    }
    // version 4
    set('idle');
    const replay = () => {
      set('idle');
      void svg.getBoundingClientRect();
      set('yes');
    };
    if (window.matchMedia('(min-width: 1200px) and (hover: hover)').matches) {
      const card = svg.closest('li') ?? svg;
      let busy = 0;
      const enter = () => {
        const now = performance.now();
        if (now < busy) return;
        busy = now + 1800;
        replay();
      };
      card.addEventListener('pointerenter', enter);
      return () => card.removeEventListener('pointerenter', enter);
    }
    // no hover, once as the card reaches the middle of the screen
    return once('-45% 0px -45% 0px', replay);
  }, [ref, v]);
}

export function ServiceArtMotion({ kind, className, index = 0 }: { kind: Kind; className?: string; index?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const on = motionOn();
  const v = svcVariant();
  useGo(ref, on ? v : 1);
  if (!on) return <ServiceArt kind={kind} className={className} />;

  const items = plan(kind, v);
  const circle = (it: (typeof items)[number], i: number) => {
    const { dot: d, a, l, v: vars } = it;
    const style: Record<string, number> = {};
    for (const k in vars) style[`--${k}`] = vars[k];
    return (
      <circle
        key={i}
        cx={Math.round(d.x * 10) / 10}
        cy={Math.round(d.y * 10) / 10}
        r={Math.round(d.r * 10) / 10}
        opacity={d.o === 1 ? undefined : Math.round(d.o * 100) / 100}
        className={`d${d.t}`}
        data-a={a}
        data-l={l}
        style={style as CSSProperties}
      />
    );
  };
  const spin = (v === 2 || v === 3) && kind === 'ducts';
  const ring = items.map((it, i) => (spin && it.g ? circle(it, i) : null));
  const rest = items.map((it, i) => (spin && it.g ? null : circle(it, i)));
  const svgStyle = {
    '--per': `${PERIOD[kind]}s`,
    '--co': `${(index * 0.9).toFixed(1)}s`,
    '--turn': `${PITCH * 3}deg`,
  } as CSSProperties;

  return (
    <svg
      ref={ref}
      className={`${className ?? ''} svs`}
      data-v={v}
      viewBox="0 0 240 300"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      style={svgStyle}
    >
      {spin && <g className="svs__spin">{ring}</g>}
      {rest}
    </svg>
  );
}

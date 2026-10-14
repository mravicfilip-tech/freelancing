import './r3-process.css';
import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, RefObject } from 'react';
import type { Content } from '../shared/content';
import { Media } from '../shared/Media';
import { CUT_EDGE, CUT_PINS, CUT_VB, TrenchCut, type CutId } from './art';
import { sh } from './copy';
import { RadialCloud } from './motion/RadialCloud';
import { Rise } from './motion/Rise';
import { clamp01, motionOn, onScroll, useInView } from './motion/motion';
import { tp } from './copy-process';

const pct = (v: number, o: number, s: number) => `${(((v - o) / s) * 100).toFixed(3)}%`;

// A square cross with a hairline box, the tag icon of the labels.
function TagIcon() {
  return (
    <svg className="cl__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" />
      <path d="M4.5 4.5 L11.5 11.5 M11.5 4.5 L4.5 11.5" />
    </svg>
  );
}

// The notched photo frame of round 3 note 1. A hairline frame 8px outside the photo, crosshairs
// at the frame corners and the skewed bar in the notch.
function Frame({ c, i }: { c: Content; i: number }) {
  const s = c.process.steps[i];
  const shot = { id: `s${i + 1}`, brief: tp(c).stepBrief, photo: s.photo };
  return (
    <div className="pframe">
      {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
        <i key={k} className={`pframe__xh pframe__xh--${k}`} aria-hidden="true" />
      ))}
      <div className="pframe__clip">
        <Media shot={shot} lang={c.lang} label={c.ui.photo} className="pframe__ph" sizes="(min-width: 1200px) 58vw, (min-width: 768px) 45vw, 92vw" />
      </div>
      <span className="pframe__bar" aria-hidden="true" />
    </div>
  );
}

const CUT_ORDER = Object.keys(CUT_PINS);

// The drawing traces itself once, the first time it enters, in r3-process.css. Dashes run on
// pathLength, and the strokes keep their 1px by --cs, the drawing's scale on screen, because
// non-scaling-stroke and pathLength do not agree on what a dash length is.
function useTrace(figRef: RefObject<HTMLElement | null>) {
  useInView(figRef);
  useLayoutEffect(() => {
    const fig = figRef.current;
    const svg = fig?.querySelector<SVGSVGElement>('.pfig__svg');
    if (!fig || !svg || !motionOn()) return;
    const set = () => fig.style.setProperty('--cs', (svg.getBoundingClientRect().width / CUT_VB.w).toFixed(4));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [figRef]);
}

// The layer list reads one row at a time. Each row gets --lw, 1 when its middle sits at the middle
// of the viewport and 0 one row height away, eased, and the css mixes pale to ink by it.
function useLayerReader(listRef: RefObject<HTMLOListElement | null>) {
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !motionOn()) return;
    const rows = Array.from(list.children) as HTMLElement[];
    const last = rows.map(() => -1);
    return onScroll((vh) => {
      const rects = rows.map((r) => r.getBoundingClientRect());
      rects.forEach((r, i) => {
        const d = Math.abs(r.top + r.height / 2 - vh / 2);
        const t = clamp01(1 - d / Math.max(r.height, 1));
        const w = t * t * (3 - 2 * t);
        if (Math.abs(w - last[i]) < 1e-3) return;
        last[i] = w;
        rows[i].style.setProperty('--lw', w.toFixed(3));
      });
    });
  }, [listRef]);
}

// A step row. The photo unmasks upward once as the row enters and the number and title rise after it.
function StepRow({ c, i, total }: { c: Content; i: number; total: string }) {
  const s = c.process.steps[i];
  const ref = useRef<HTMLLIElement>(null);
  useInView(ref);
  return (
    <li ref={ref} className="step gc" data-flip={i % 2 === 1 ? 'true' : undefined}>
      <div className="step__media">
        <Frame c={c} i={i} />
      </div>
      <div className="step__text">
        <div className="step__top">
          <p className="mono step__n">
            {s.n} / {total}
          </p>
          <h3 className="step__title display">{sh(c, s.title)}</h3>
        </div>
        <ul className="step__ticks">
          {(tp(c).ticks[s.n] ?? []).map((t, k) => (
            <li key={t} className="step__tick" style={{ '--k': k } as CSSProperties}>
              <svg className="step__check" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
                <path d="M2.5 8.5 L6.5 12.5 L13.5 4" />
              </svg>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function Process({ c }: { c: Content }) {
  const total = String(c.process.steps.length).padStart(2, '0');
  const figRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  useTrace(figRef);
  useLayerReader(listRef);
  return (
    <section id="process" className="proc" aria-labelledby="proc-title">
      <div className="proc__field" aria-hidden="true">
        <RadialCloud className="art art--light proc__field-d" w={1440} h={900} inner={430} />
        <RadialCloud className="art art--light proc__field-p" w={390} h={760} inner={150} />
      </div>
      <div className="g">
        <div className="proc__head gc">
          <Rise as="p" body className="mono kicker proc__kicker">
            {c.process.kicker}
          </Rise>
          <Rise id="proc-title" className="proc__title display">
            {sh(c, c.process.title)}
          </Rise>
          <Rise as="p" body className="proc__lede">
            {c.process.lede}
          </Rise>
        </div>

        <figure className="pfig" aria-hidden="true" ref={figRef}>
          <span className="pfig__hill" />
          <div className="pfig__clip">
            <div className="pfig__box">
              <TrenchCut className="pfig__svg" />
              {c.process.layers.map((l, i) => {
                const p = CUT_PINS[l.id as CutId];
                if (!p) return null;
                const n = String(i + 1).padStart(2, '0');
                const edge = { left: pct(CUT_EDGE[p.side], CUT_VB.x, CUT_VB.w), top: pct(p.ty, CUT_VB.y, CUT_VB.h), '--li': CUT_ORDER.indexOf(l.id) } as CSSProperties;
                return (
                  <span key={l.id}>
                    <span className={`cl cl--${p.side}`} style={edge}>
                      <TagIcon />
                      <span className="cl__l">{l.label}</span>
                    </span>
                    <span className={`cn cn--${p.side} mono`} style={edge}>
                      {n}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </figure>

        <ol className="layers" ref={listRef}>
          {c.process.layers.map((l, i) => (
            <li key={l.id} className={`layer gc layer--${l.id}${l.id === 'ducts' ? ' layer--focus' : ''}`}>
              <span className="layer__k mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="layer__l display">{sh(c, l.label)}</span>
              <span className="layer__note mono">{l.note}</span>
            </li>
          ))}
        </ol>
        <p className="layers__depth mono">{c.process.note}</p>

        <ol className="steps">
          {c.process.steps.map((st, i) => (
            <StepRow key={st.n} c={c} i={i} total={total} />
          ))}
        </ol>
      </div>
    </section>
  );
}

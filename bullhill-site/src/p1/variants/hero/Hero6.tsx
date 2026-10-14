import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { t6 } from './copy-hero6';
import { ANCHORS, CAMS, VIEWS, project, type LayerId, type View } from './hero6/geometry';
import './hero.css';
import './hero6.css';

// Hero 6, the cable through ground specimen, after Other Matter. One block of ground cut open with
// the duct bundle through it. The left half is a schematic, the right half a render, split at the
// middle of the stage, both drawn with one camera. The scene is a lazy chunk, so heroes 1 to 5
// never load three.js. Phones, reduced motion and browsers without WebGL get a still rendered
// from the same scene by scripts/render-hero6.mjs, and the same still is the poster until the
// first frame. The labels are placed here by projecting 3D points with that camera, so a leader
// ends on its part at every size.

const Scene = lazy(() => import('./hero6/Scene'));

const CHAR = 7.68; // Azeret Mono 12px, advance 0.6em plus 0.04em tracking
const TAG_H = 22;
const TAG_GAP = 32;
const ORDER: LayerId[] = ['surface', 'base', 'tape', 'backfill', 'ducts', 'sand'];

function useBox(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setSize([Math.round(el.clientWidth), Math.round(el.clientHeight)]);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function useMedia(q: string, initial: boolean) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [q]);
  return on;
}

function hasWebgl() {
  try {
    const cv = document.createElement('canvas');
    return !!(cv.getContext('webgl2') || cv.getContext('webgl'));
  } catch {
    return false;
  }
}

// Still render mode, for scripts/render-hero6.mjs. Only the scene, on a transparent page.
function StillStage({ view }: { view: View }) {
  const [w, h] = VIEWS[view].nominal;
  return (
    <div className="h6-still" style={{ width: w, height: h }}>
      <Suspense fallback={null}>
        <Scene view={view} still onReady={() => undefined} />
      </Suspense>
    </div>
  );
}

export function Hero6({ c }: { c: Content }) {
  const still = new URLSearchParams(window.location.search).get('still');
  if (still === 'wide' || still === 'mid' || still === 'tall') return <StillStage view={still} />;
  return <Specimen c={c} />;
}

function Specimen({ c }: { c: Content }) {
  const x = t6(c);
  const stage = useRef<HTMLDivElement>(null);
  const [cw, ch] = useBox(stage);
  const desk = useMedia('(min-width: 768px)', true);
  const wide = useMedia('(min-width: 1200px)', true);
  const reduced = useMedia('(prefers-reduced-motion: reduce)', false);
  const [gl] = useState(hasWebgl);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setMounted(true), []);
  // the poster stays a moment after the first frame, so the canvas is on screen before it goes
  const onReady = useCallback(() => {
    window.setTimeout(() => setReady(true), 700);
  }, []);

  const view: View = wide ? 'wide' : desk ? 'mid' : 'tall';
  const live = desk && gl && !reduced;
  const spec = VIEWS[view];

  // the box the specimen fills, centred in the stage, always the view's own aspect
  const box = useMemo(() => {
    if (!cw || !ch) return null;
    const w = view === 'tall' ? cw : Math.min(cw, ch * spec.aspect);
    const h = Math.round(w / spec.aspect);
    return { w: Math.round(w), h, x: Math.round((cw - w) / 2), y: Math.round((ch - h) / 2) };
  }, [cw, ch, view, spec.aspect]);

  const labels = useMemo(() => {
    if (!box) return null;
    const cam = CAMS[view];
    const layers = c.process.layers;
    const items = ORDER.map((id) => {
      const l = layers.find((q) => q.id === id)!;
      const [fx, fy] = project(cam, box.w / box.h, ANCHORS[id]);
      const text = l.label.toLocaleUpperCase(c.lang);
      return { id, text, w: Math.round(text.length * CHAR - 0.5 + 16), px: box.x + fx * box.w, py: box.y + fy * box.h, ty: 0 };
    }).sort((a, b) => a.py - b.py);
    // tags keep the order of their parts and a clear gap, shifted together if they run out of room
    let prev = -Infinity;
    for (const it of items) {
      it.ty = Math.max(it.py, prev + TAG_GAP);
      prev = it.ty;
    }
    const over = items[items.length - 1].ty + TAG_H / 2 - (ch - 2);
    const top = items[0].ty - TAG_H / 2;
    const shift = over > 0 ? Math.min(over, Math.max(0, top - 2)) : 0;
    for (const it of items) it.ty -= shift;
    return items;
  }, [box, view, c, ch]);

  const seamX = box ? box.x + box.w / 2 : 0;
  const tagL = x.schematic.toLocaleUpperCase(c.lang);
  const tagR = x.render.toLocaleUpperCase(c.lang);
  const wL = Math.round(tagL.length * CHAR - 0.5 + 16);
  const wR = Math.round(tagR.length * CHAR - 0.5 + 16);

  return (
    <section className="hero hv hv6" data-hero="6" aria-labelledby="hv6-title">
      <div className="hv6__in g">
        <div className="hv6__top gc">
          <h1 id="hv6-title" className="hv6__title display">
            <span>{c.hero.split[0]}</span> <span>{c.hero.split[1]}</span>
          </h1>
        </div>

        <div ref={stage} className="hv6__stage" role="img" aria-label={x.figure}>
          {box ? (
            <div className="hv6__box" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
              <img className="hv6__poster" data-ready={ready && live ? 'yes' : 'no'} src={`/render/hero6-${view}.webp`} width={box.w} height={box.h} alt="" draggable={false} />
              {live && mounted ? (
                <div className="hv6__canvas">
                  <Suspense fallback={null}>
                    <Scene view={view} onReady={onReady} />
                  </Suspense>
                </div>
              ) : null}
            </div>
          ) : null}
          {box && labels ? (
            <svg className="hv6__over" width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`} aria-hidden="true" focusable="false">
              <line className="hv6__seam" x1={seamX} y1={box.y} x2={seamX} y2={box.y + box.h} />
              <g transform={`translate(${seamX - wL} ${box.y + box.h - TAG_H})`}>
                <rect className="hv6__tag" x="0.5" y="0.5" width={wL - 1} height={TAG_H - 1} />
                <text className="hv6__t" x="8" y="15" textLength={wL - 16} lengthAdjust="spacing">
                  {tagL}
                </text>
              </g>
              <g transform={`translate(${seamX} ${box.y + box.h - TAG_H})`}>
                <rect className="hv6__tag" x="0.5" y="0.5" width={wR - 1} height={TAG_H - 1} />
                <text className="hv6__t" x="8" y="15" textLength={wR - 16} lengthAdjust="spacing">
                  {tagR}
                </text>
              </g>
              {labels.map((l) => (
                <g key={l.id}>
                  <line className="hv6__line" x1={l.w} y1={l.ty} x2={l.px} y2={l.py} />
                  <circle className="hv6__end" cx={l.px} cy={l.py} r="3" />
                  <rect className="hv6__tag" x="0.5" y={l.ty - TAG_H / 2 + 0.5} width={l.w - 1} height={TAG_H - 1} />
                  <text className="hv6__t" x="8" y={l.ty + 4} textLength={l.w - 16} lengthAdjust="spacing">
                    {l.text}
                  </text>
                </g>
              ))}
            </svg>
          ) : null}
        </div>

        <div className="hv6__bot gc">
          <div className="hv6__side">
            <p className="hv6__lede mono-body">{c.hero.lede}</p>
            <div className="hv__cta">
              <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
              <Bracket href="#contact">{c.ui.send}</Bracket>
            </div>
          </div>
          <aside className="hv6__card">
            <p className="hv6__code mono">{x.code}</p>
            <p className="hv6__name mono-body">{x.name}</p>
            <p className="hv6__note mono">{x.note}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

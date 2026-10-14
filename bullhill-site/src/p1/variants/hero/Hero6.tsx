import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { t6 } from './copy-hero6';
import { ANCHORS, VIEWS, clamp01, dollyCam, project, seamAt, smooth, type LayerId, type View } from './hero6/geometry';
import { useProgress } from './hero6/progress';
import './hero.css';
import './hero6.css';

// Hero 6, the cable through ground specimen, after Other Matter. One block of ground cut open with
// the duct bundle through it. The left half is a schematic, the right half a render, split at the
// middle of the stage, both drawn with one camera. The scene is a lazy chunk, so heroes 1 to 5
// never load three.js. Phones, reduced motion and browsers without WebGL get a still rendered
// from the same scene by scripts/render-hero6.mjs, and the same still is the poster until the
// first frame. The labels are placed here by projecting 3D points with that camera, so a leader
// ends on its part at every size.
//
// Beat 4. The stage is pinned with position sticky for 70svh of extra scroll, 50svh on phones, and
// p runs 0 to 1 across it (hero6/progress.ts). The scene reads p every frame, sets the seam and the
// dolly, draws, and then calls paint(p) here, so the seam line, its two tags and the labels move in
// the same animation frame as the canvas. Phones and no WebGL keep the poster, and StillSeam goes in its place at merge. Reduced motion gets no pin and the poster.

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

// Still render mode, for scripts/render-hero6.mjs. Only the scene, on a transparent page. `&seam=`
// sets the split, 0 all render and 1 all schematic, for the phone stills of beat 4.
function StillStage({ view, seam }: { view: View; seam: number }) {
  const [w, h] = VIEWS[view].nominal;
  return (
    <div className="h6-still" style={{ width: w, height: h }}>
      <Suspense fallback={null}>
        <Scene view={view} still seam={seam} onReady={() => undefined} />
      </Suspense>
    </div>
  );
}

type Meta = { id: LayerId; text: string; w: number };
type Item = Meta & { px: number; py: number; ty: number; op: number };
type Box = { w: number; h: number; x: number; y: number };

// Where every moving piece of the overlay sits at ease e, in stage pixels. The part of a label is
// real once the seam has gone left of its anchor, and its leader fades out while the tag stays.
function place(view: View, box: Box, ch: number, metas: Meta[], e: number, moveCam: boolean) {
  const cam = dollyCam(view, moveCam ? e : 0);
  const sf = seamAt(view, e);
  const items: Item[] = metas
    .map((m) => {
      const [fx, fy] = project(cam, box.w / box.h, ANCHORS[m.id]);
      return { ...m, px: box.x + fx * box.w, py: box.y + fy * box.h, ty: 0, op: clamp01((sf - fx + 0.01) / 0.03) };
    })
    .sort((a, b) => a.py - b.py);
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
  return { seamX: box.x + sf * box.w, items };
}

type Els = { lead: SVGGElement | null; line: SVGLineElement | null; dot: SVGCircleElement | null; tag: SVGGElement | null };

export function Hero6({ c }: { c: Content }) {
  const q = new URLSearchParams(window.location.search);
  const still = q.get('still');
  const seam = q.has('seam') ? Number(q.get('seam')) : 0.5;
  if (still === 'wide' || still === 'mid' || still === 'tall') return <StillStage view={still} seam={Number.isFinite(seam) ? seam : 0.5} />;
  return <Specimen c={c} />;
}

function Specimen({ c }: { c: Content }) {
  const x = t6(c);
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
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
  const pinned = !reduced;
  const spec = VIEWS[view];
  const progress = useProgress(section, pin, pinned);

  // the box the specimen fills, centred in the stage, always the view's own aspect
  const box = useMemo<Box | null>(() => {
    if (!cw || !ch) return null;
    const w = view === 'tall' ? cw : Math.min(cw, ch * spec.aspect);
    const h = Math.round(w / spec.aspect);
    return { w: Math.round(w), h, x: Math.round((cw - w) / 2), y: Math.round((ch - h) / 2) };
  }, [cw, ch, view, spec.aspect]);

  const metas = useMemo<Meta[]>(
    () =>
      ORDER.map((id) => {
        const text = c.process.layers.find((q) => q.id === id)!.label.toLocaleUpperCase(c.lang);
        return { id, text, w: Math.round(text.length * CHAR - 0.5 + 16) };
      }),
    [c],
  );

  const tagL = x.schematic.toLocaleUpperCase(c.lang);
  const tagR = x.render.toLocaleUpperCase(c.lang);
  const wL = Math.round(tagL.length * CHAR - 0.5 + 16);
  const wR = Math.round(tagR.length * CHAR - 0.5 + 16);

  // the overlay is placed by React once and then moved by paint, straight on the elements, so a
  // scroll never re-renders the page
  const seamEl = useRef<SVGLineElement>(null);
  const tagLEl = useRef<SVGGElement>(null);
  const tagREl = useRef<SVGGElement>(null);
  const els = useRef<Partial<Record<LayerId, Els>>>({});
  const ctx = useRef({ view, box, ch, metas, live, wL });
  ctx.current = { view, box, ch, metas, live, wL };

  const text = (p: number) => {
    const t = smooth(clamp01((p - 2 / 3) * 3));
    const el = pin.current;
    if (!el) return;
    el.style.setProperty('--h6-t', t.toFixed(4));
    el.dataset.gone = t > 0.98 ? 'yes' : 'no';
  };
  const paint = (p: number) => {
    text(p);
    const k = ctx.current;
    if (!k.box) return;
    // without the live scene the poster is a still at p 0, so the overlay holds there
    const e = k.live ? smooth(p) : 0;
    const { seamX, items } = place(k.view, k.box, k.ch, k.metas, e, k.live);
    const top = k.box.y + k.box.h - TAG_H;
    seamEl.current?.setAttribute('x1', String(seamX));
    seamEl.current?.setAttribute('x2', String(seamX));
    tagLEl.current?.setAttribute('transform', `translate(${seamX - k.wL} ${top})`);
    tagREl.current?.setAttribute('transform', `translate(${seamX} ${top})`);
    for (const it of items) {
      const o = els.current[it.id];
      if (!o) continue;
      o.line?.setAttribute('y1', String(it.ty));
      o.line?.setAttribute('x2', String(it.px));
      o.line?.setAttribute('y2', String(it.py));
      o.dot?.setAttribute('cx', String(it.px));
      o.dot?.setAttribute('cy', String(it.py));
      o.lead?.setAttribute('opacity', it.op.toFixed(3));
      o.tag?.setAttribute('transform', `translate(0 ${it.ty})`);
    }
  };
  const paintRef = useRef(paint);
  paintRef.current = paint;
  useLayoutEffect(() => paint(progress.sample()));
  // headline, lede and buttons follow the scroll on their own, the overlay follows the scene's frame
  useEffect(() => {
    if (!pinned) return;
    return progress.subscribe((p) => text(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, pinned, live]);
  const drive = useMemo(() => ({ progress, onFrame: (p: number) => paintRef.current(p) }), [progress]);

  const p0 = progress.sample();
  const first = box ? place(view, box, ch, metas, smooth(p0), live) : null;
  const seamX = first ? first.seamX : 0;
  const slot = (id: LayerId) => (els.current[id] ??= { lead: null, line: null, dot: null, tag: null });

  return (
    <section ref={section} className="hero hv hv6" data-hero="6" data-pin={pinned ? 'yes' : 'no'} aria-labelledby="hv6-title">
      <div ref={pin} className="hv6__pin" data-gone="no">
        <div className="hv6__in g">
          <div className="hv6__top gc">
            <h1 id="hv6-title" className="hv6__title display">
              <span>{c.hero.split[0]}</span> <span>{c.hero.split[1]}</span>
            </h1>
          </div>

          <div ref={stage} className="hv6__stage" role="img" aria-label={x.figure}>
            {box ? (
              <div className="hv6__box" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
                {/* the phone and no WebGL path mounts StillSeam in place of this poster */}
                <img className="hv6__poster" data-ready={ready && live ? 'yes' : 'no'} src={`/render/hero6-${view}.webp`} width={box.w} height={box.h} alt="" draggable={false} />
                {live && mounted ? (
                  <div className="hv6__canvas">
                    <Suspense fallback={null}>
                      <Scene view={view} onReady={onReady} drive={pinned ? drive : undefined} />
                    </Suspense>
                  </div>
                ) : null}
              </div>
            ) : null}
            {box && first ? (
              <svg className="hv6__over" width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`} aria-hidden="true" focusable="false">
                <line ref={seamEl} className="hv6__seam" x1={seamX} y1={box.y} x2={seamX} y2={box.y + box.h} />
                <g ref={tagLEl} transform={`translate(${seamX - wL} ${box.y + box.h - TAG_H})`}>
                  <rect className="hv6__tag" x="0.5" y="0.5" width={wL - 1} height={TAG_H - 1} />
                  <text className="hv6__t" x="8" y="15" textLength={wL - 16} lengthAdjust="spacing">
                    {tagL}
                  </text>
                </g>
                <g ref={tagREl} transform={`translate(${seamX} ${box.y + box.h - TAG_H})`}>
                  <rect className="hv6__tag" x="0.5" y="0.5" width={wR - 1} height={TAG_H - 1} />
                  <text className="hv6__t" x="8" y="15" textLength={wR - 16} lengthAdjust="spacing">
                    {tagR}
                  </text>
                </g>
                {first.items.map((l) => (
                  <g key={l.id}>
                    <g ref={(n) => void (slot(l.id).lead = n)} opacity={l.op}>
                      <line ref={(n) => void (slot(l.id).line = n)} className="hv6__line" x1={l.w} y1={l.ty} x2={l.px} y2={l.py} />
                      <circle ref={(n) => void (slot(l.id).dot = n)} className="hv6__end" cx={l.px} cy={l.py} r="3" />
                    </g>
                    <g ref={(n) => void (slot(l.id).tag = n)} transform={`translate(0 ${l.ty})`}>
                      <rect className="hv6__tag" x="0.5" y={-TAG_H / 2 + 0.5} width={l.w - 1} height={TAG_H - 1} />
                      <text className="hv6__t" x="8" y="4" textLength={l.w - 16} lengthAdjust="spacing">
                        {l.text}
                      </text>
                    </g>
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
      </div>
      {pinned ? <div className="hv6__run" aria-hidden="true" /> : null}
    </section>
  );
}

import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { motionOn } from '../../motion/motion';
import { Rise } from '../../motion/Rise';
import { t6 } from './copy-hero6';
import { ANCHORS, VIEWS, clamp01, dollyCam, driftCam, project, seamAt, smooth, type LayerId, type View } from './hero6/geometry';
import { useProgress, useProgressValue, type Progress } from './hero6/progress';
import { StillSeam } from './hero6/StillSeam';
import { DigCanvas } from './hero6/DigCanvas';
import { restoreAt, seamEase } from './hero6/acts';
import { LoadClock, SETTLED, assembleAt, riseEase, urlFreeze } from './hero6/timeline';
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
// Beat 4, dig, lay, restore (hero6/acts.ts). The stage is pinned with position sticky for 120svh of
// extra scroll, 30svh on phones, and p runs 0 to 1 across it (hero6/progress.ts). The scene reads p
// every frame, opens the trench, lifts and drops the ground's points, slides the ducts in, sets the
// seam and the dolly, draws, and then calls paint(p) here, so the seam line, its two tags and the
// labels move in the same animation frame as the canvas. Phones and no WebGL show StillSeam, the
// still pair with the seam sliding in CSS, and DigCanvas plays the ground's points over it in 2D.
// With motionOn() false there are no acts, the seam keeps its old mapping. Reduced motion gets no
// pin and p 0.
//
// Beats 1 to 3 (hero6/timeline.ts). The h1 is the shared Rise, the lede and buttons rise after its
// last line in CSS, and the assemble is built by a LoadClock that the scene, the overlay and the
// CSS read. Phones and no WebGL run beats 1 and 2 in CSS on the stills. With motionOn() false the
// clock does not exist and the hero is its settled state, as before beats 1 to 3. `?t=` freezes the
// clock for shots, and the CSS follows it through animation-delay and --h6-fz.

const Scene = lazy(() => import('./hero6/Scene'));

const CHAR = 7.68; // Azeret Mono 12px, advance 0.6em plus 0.04em tracking
const TAG_H = 22;
const TAG_GAP = 32;
// phone framing. The block sits between the two headline halves, TALL_GAP clear of each, and runs
// TALL_OVER of the stage past its right edge, just enough to bleed while the duct ends stay in frame. TALL_HALF is one half, two lines of the 40px phone
// headline, and TALL_FOOT the space under the second half, both set in hero6.css. The still's visible
// part runs from TALL_VIS_TOP of the box height for TALL_VIS_H of it, from public/render/hero6-tall-*.
const TALL_OVER = 0.06;
const TALL_HALF = 80;
const TALL_GAP = 24;
const TALL_FOOT = 40;
const TALL_VIS_TOP = 0.1825;
const TALL_VIS_H = 0.7025;
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

// Where every moving piece of the overlay sits, in stage pixels, the camera at ease e and the seam at se. The part of a label is
// real once the seam has gone left of its anchor, and its leader fades out while the tag stays.
function place(view: View, box: Box, ch: number, metas: Meta[], e: number, se: number, moveCam: boolean, yaw = 0, pitch = 0) {
  const cam = driftCam(dollyCam(view, moveCam ? e : 0), moveCam ? yaw : 0, moveCam ? pitch : 0);
  const sf = seamAt(view, se);
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

// Phones and no WebGL, beat 4 on the still pair. Its own component, so a scroll re-renders the two
// stills and not the whole hero.
// With the acts on, the seam waits for restore, the same as the live scene, and the ground's points
// play over the pair on a 2D canvas.
function SeamStill({ view, progress, enabled, animate, acts }: { view: View; progress: Progress; enabled: boolean; animate: boolean; acts: boolean }) {
  const p = useProgressValue(progress, enabled);
  return <StillSeam view={view} p={acts ? restoreAt(p) : p} alt="" animate={animate} />;
}

// Beat 1 with the clock frozen by ?t=. The words of the headline are set to where the rise has got
// to at t, the same curve and steps as the CSS (--m-rise 600ms, --m-step 80ms, --m-ease).
function freezeHeadline(sec: HTMLElement, t: number) {
  sec.querySelectorAll<HTMLElement>('.hv6__title .rise__w').forEach((w) => {
    const li = Number(w.style.getPropertyValue('--li')) || 0;
    const k = riseEase(clamp01((t - li * 80) / 600));
    const i = w.querySelector<HTMLElement>('.rise__i');
    if (i) {
      i.style.transition = 'none';
      i.style.transform = `translateY(${((1 - k) * 115).toFixed(3)}%)`;
    }
  });
  sec.querySelectorAll<HTMLElement>('.hv6__title .rise__shy').forEach((n) => {
    n.style.transition = 'none';
    n.style.opacity = t > 600 ? '1' : '0';
  });
}

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
  const [clock] = useState(() => (motionOn() ? new LoadClock(urlFreeze()) : null));
  const frozen = clock?.frozen ?? null;
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setMounted(true), []);
  // the poster stays a moment after the first frame, so the canvas is on screen before it goes
  const onReady = useCallback(() => {
    window.setTimeout(() => setReady(true), 700);
  }, []);

  const view: View = wide ? 'wide' : desk ? 'mid' : 'tall';
  const live = desk && gl && !reduced;
  // with motion the poster never shows, the scene builds the specimen itself
  const pinned = !reduced;
  // the still pair exists for tall and mid, wide without WebGL keeps its one poster
  const stills = !live && view !== 'wide';
  // phones show the specimen clean, no layer tags or leader lines, the seam and its two tags stay
  const tags = view !== 'tall';
  const spec = VIEWS[view];
  const progress = useProgress(section, pin, pinned);

  // the box the specimen fills, centred in the stage, always the view's own aspect
  const box = useMemo<Box | null>(() => {
    if (!cw || !ch) return null;
    // phones, the block fills the room between the headline halves and runs off the right screen
    // edge, the stage already sits one side padding in, so the box ends TALL_OVER past its right edge
    if (view === 'tall') {
      const room = Math.max(120, ch - 2 * TALL_HALF - 2 * TALL_GAP - TALL_FOOT);
      const h = Math.round(room / TALL_VIS_H);
      return { w: h, h, x: Math.round(cw + cw * TALL_OVER - h), y: Math.round(TALL_HALF + TALL_GAP - h * TALL_VIS_TOP) };
    }
    const w = Math.min(cw, ch * spec.aspect);
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
  const ctx = useRef({ view, box, ch, metas, live, stills, wL, tags });
  ctx.current = { view, box, ch, metas, live, stills, wL, tags };

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
    // the still pair follows p with a fixed camera, the one poster is a still at p 0 and the overlay holds there
    const e = k.live || k.stills ? smooth(p) : 0;
    const se = k.live || k.stills ? seamEase(p, !!clock) : 0;
    const ck = clock;
    const { seamX, items } = place(k.view, k.box, k.ch, k.metas, e, se, k.live, ck?.view.yaw, ck?.view.pitch);
    const top = k.box.y + k.box.h - TAG_H;
    // beat 2 on the overlay, the seam drops, the two tags and the leaders come in
    const st = ck ? assembleAt(ck.a()) : SETTLED;
    seamEl.current?.setAttribute('x1', String(seamX));
    seamEl.current?.setAttribute('x2', String(seamX));
    seamEl.current?.setAttribute('y2', String(k.box.y + k.box.h * st.seam));
    tagLEl.current?.setAttribute('transform', `translate(${seamX - k.wL} ${top})`);
    tagREl.current?.setAttribute('transform', `translate(${seamX} ${top})`);
    tagLEl.current?.setAttribute('opacity', st.tags.toFixed(3));
    tagREl.current?.setAttribute('opacity', st.tags.toFixed(3));
    items.forEach((it, i) => {
      const o = els.current[it.id];
      if (!o) return;
      const d = st.leader(i);
      const x1 = it.w;
      o.line?.setAttribute('y1', String(it.ty));
      o.line?.setAttribute('x2', String(x1 + (it.px - x1) * d));
      o.line?.setAttribute('y2', String(it.ty + (it.py - it.ty) * d));
      o.dot?.setAttribute('cx', String(it.px));
      o.dot?.setAttribute('cy', String(it.py));
      o.dot?.setAttribute('opacity', clamp01((d - 0.85) / 0.15).toFixed(3));
      o.lead?.setAttribute('opacity', it.op.toFixed(3));
      o.tag?.setAttribute('transform', `translate(0 ${it.ty})`);
      o.tag?.setAttribute('opacity', clamp01(d * 5).toFixed(3));
    });
  };
  const paintRef = useRef(paint);
  paintRef.current = paint;
  useLayoutEffect(() => paint(progress.sample()));
  // headline, lede and buttons follow the scroll on their own, the overlay follows the scene's frame,
  // and without the scene the overlay follows the scroll too
  useEffect(() => {
    if (!pinned) return;
    return progress.subscribe((p) => (live ? text(p) : paintRef.current(p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, pinned, live]);
  const drive = useMemo(() => ({ progress, load: clock ?? undefined, acts: !!clock, onFrame: (p: number) => paintRef.current(p) }), [progress, clock]);

  // ---- beats 1 to 3
  // The hero's own CSS reads data-load (off, run, done), data-idle (wait, run, pause, frozen) and
  // the variables --h6-last, --h6-fz and --h6-bd. All written here, never by React, so a re-render
  // cannot undo them.
  useLayoutEffect(() => {
    const sec = section.current;
    if (!sec) return;
    if (!clock) {
      sec.dataset.load = 'off';
      return;
    }
    sec.dataset.load = clock.assembled() ? 'done' : 'run';
    if (frozen !== null) {
      sec.style.setProperty('--h6-fz', `${frozen}ms`);
      sec.style.setProperty('--h6-ps', 'paused');
      sec.style.setProperty('--h6-bd', `${-Math.max(0, frozen - 2800)}ms`);
    }
    const mark = () => {
      // the last line of the headline, read from the lines Rise has measured
      let last = 0;
      sec.querySelectorAll<HTMLElement>('.hv6__title .rise__w').forEach((w) => {
        last = Math.max(last, Number(w.style.getPropertyValue('--li')) || 0);
      });
      sec.style.setProperty('--h6-last', String(last));
      if (frozen !== null) freezeHeadline(sec, frozen);
    };
    mark();
    let alive = true;
    document.fonts?.ready.then(() => alive && mark());
    const h1 = sec.querySelector('.hv6__title');
    const ro = new ResizeObserver(mark);
    if (h1) ro.observe(h1);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [clock, frozen, c.lang]);

  // the clock's state to the CSS, the idle glow runs while assembled and on screen
  useEffect(() => {
    const pinEl = pin.current;
    const sec = section.current;
    if (!clock || !pinEl || !sec) return;
    const sync = () => {
      sec.dataset.load = clock.assembled() ? 'done' : 'run';
      pinEl.dataset.idle = frozen !== null ? (clock.assembled() ? 'frozen' : 'wait') : !clock.assembled() ? 'wait' : clock.isVisible() ? 'run' : 'pause';
    };
    sync();
    return clock.on(sync);
  }, [clock, frozen]);

  // on screen and tab visible, the idle loop pauses when either is false
  useEffect(() => {
    const el = section.current;
    if (!clock || !el || frozen !== null) return;
    let inView = true;
    let shown = !document.hidden;
    const apply = () => clock.setVisible(inView && shown);
    const io = new IntersectionObserver((es) => {
      inView = es[es.length - 1].isIntersecting;
      apply();
    });
    io.observe(el);
    const vis = () => {
      shown = !document.hidden;
      apply();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [clock, frozen]);

  // a small tilt towards the pointer, desktop with a mouse only
  useEffect(() => {
    if (!clock || !live || frozen !== null || !window.matchMedia('(pointer: fine)').matches) return;
    const move = (e: PointerEvent) => {
      clock.pointer.x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
      clock.pointer.y = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2));
      clock.poke();
    };
    const leave = () => {
      clock.pointer.x = 0;
      clock.pointer.y = 0;
      clock.poke();
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [clock, live, frozen]);

  // Without the scene (phones, no WebGL) the clock starts at once, 0.6s in, and the overlay is driven
  // by a frame loop that lasts only as long as the assemble. With the scene it starts on the first
  // frame, and a slow or failed load starts it after 8s so the page never waits on it.
  useEffect(() => {
    if (!clock || frozen !== null) return;
    if (live) {
      const id = window.setTimeout(() => clock.begin(), 8000);
      return () => window.clearTimeout(id);
    }
    clock.begin();
    if (!tags) return;
    let raf = 0;
    const tick = () => {
      paintRef.current(progress.sample());
      if (!clock.assembled()) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clock, frozen, live, tags, progress]);

  // scrolling during the load completes it at once. The scene does this on its frames, this covers the CSS.
  useEffect(() => {
    if (!clock || frozen !== null) return;
    return progress.subscribe((p) => {
      if (p > 0) clock.skip();
    });
  }, [clock, frozen, progress]);

  const p0 = progress.sample();
  const first = box ? place(view, box, ch, metas, live || stills ? smooth(p0) : 0, live || stills ? seamEase(p0, !!clock) : 0, live) : null;
  const seamX = first ? first.seamX : 0;
  const slot = (id: LayerId) => (els.current[id] ??= { lead: null, line: null, dot: null, tag: null });

  return (
    <section ref={section} className="hero hv hv6" data-hero="6" data-pin={pinned ? 'yes' : 'no'} aria-labelledby="hv6-title">
      <div ref={pin} className="hv6__pin" data-gone="no">
        <div className="hv6__in g">
          <div className="hv6__top gc">
            <Rise as="h1" id="hv6-title" className="hv6__title display">
              {[c.hero.split[0], c.hero.split[1]]}
            </Rise>
          </div>

          <div ref={stage} className="hv6__stage" role="img" aria-label={x.figure}>
            {box ? (
              <div className="hv6__box" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
                {stills ? (
                  <SeamStill view={view} progress={progress} enabled={pinned} animate={!!clock} acts={!!clock} />
                ) : (
                  <img className="hv6__poster" data-ready={(ready || !!clock) && live ? 'yes' : 'no'} data-anim={clock && !live ? 'yes' : undefined} src={`/render/hero6-${view}.webp`} width={box.w} height={box.h} alt="" draggable={false} />
                )}
                {!live && clock && pinned ? <DigCanvas view={view} progress={progress} /> : null}
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
                {stills ? null : <line ref={seamEl} className="hv6__seam" x1={seamX} y1={box.y} x2={seamX} y2={box.y + box.h} />}
                <g ref={tagLEl} transform={`translate(${seamX - wL} ${box.y + box.h - TAG_H})`} display={stills ? 'none' : undefined}>
                  <rect className="hv6__tag" x="0.5" y="0.5" width={wL - 1} height={TAG_H - 1} />
                  <text className="hv6__t" x="8" y="15" textLength={wL - 16} lengthAdjust="spacing">
                    {tagL}
                  </text>
                </g>
                <g ref={tagREl} transform={`translate(${seamX} ${box.y + box.h - TAG_H})`} display={stills ? 'none' : undefined}>
                  <rect className="hv6__tag" x="0.5" y="0.5" width={wR - 1} height={TAG_H - 1} />
                  <text className="hv6__t" x="8" y="15" textLength={wR - 16} lengthAdjust="spacing">
                    {tagR}
                  </text>
                </g>
                {(tags ? first.items : []).map((l) => (
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
                {view === 'tall' ? null : <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>}
                <Bracket variant="fill" href="#contact">{c.ui.send}</Bracket>
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

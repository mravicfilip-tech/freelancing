import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { motionOn } from '../../motion/motion';
import { Rise } from '../../motion/Rise';
import { t7 } from './copy-hero7';
import { urlProgress, useProgress, type Progress } from './hero6/progress';
import { LoadClock, urlFreeze } from './hero6/timeline';
import { FRAMES, frameFades, labelAt, stepAt, textGone } from './hero7/acts';
import './hero.css';
import './hero6.css';
import './hero7.css';

// Hero 7, the excavator, the five steps of the work as one continuous shot along one route, from a
// house at one end to the street at the other, see briefs/website/hero7-excavator.md. Ahead of the
// machine's seam the route is the schematic of hero 6, white hairlines, station ticks and a stipple of
// dots on the black, and behind it the same ground is the render. The seam is a world x set in the
// ground's own material, so the scene is drawn once. The scene is a lazy chunk, so the other heroes
// never load three.js.
//
// Desktop and tablet, 768 and up, are live. The stage is pinned for 300svh of scroll and p runs 0 to 1 across
// it (hero6/progress.ts, `?p=` pins a frame, and the p the scene reads is the glided one). The scene sets
// the machine, the ground, the spoil, the ducts and the house from p, draws, and calls paint(p) here, and
// the step label is written straight on its elements. The canvas reaches up behind the headline, so the
// ground and the plan fill the height of the stage. At load the route draws in from the street to the house
// on the LoadClock of hero 6 (`?t=` freezes it) and the machine idles on its tracks.
//
// Phones under 768 never run WebGL. They flip through 27 stills of the scene, held and crossfaded between
// neighbours by scroll, rendered by scripts/render-hero7.mjs from this same scene at a tall framing, with hero 6's phone layout and its
// CSS classes, the headline in two halves, the box between them, the words that stay. Reduced motion and
// browsers without WebGL get the last frame, the restored route, as a still, wide on a desktop and tall on
// a phone, with no pin.

const Scene = lazy(() => import('./hero7/Scene'));

function useMedia(q: string) {
  const [on, setOn] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [q]);
  return on;
}

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

function hasWebgl() {
  try {
    const cv = document.createElement('canvas');
    return !!(cv.getContext('webgl2') || cv.getContext('webgl'));
  } catch {
    return false;
  }
}

// Beat 1 with the clock frozen by ?t=. The headline's blocks are held where the reveal has got to at
// t, the same lines and steps as the CSS (motion/motion.css, --rz is the time, --rp pauses).
function freezeHeadline(sec: HTMLElement, t: number) {
  sec.querySelectorAll<HTMLElement>('.hv7__title, .hv7__lede, .hv6__title, .hv6__lede').forEach((r) => {
    r.style.setProperty('--rz', `${t}ms`);
    r.style.setProperty('--rp', 'paused');
  });
}

// The load, shared by the live hero and the phone's. The hero's own CSS reads data-load (run, done) and
// data-idle (wait, run, pause, frozen) and the variables --h6-last, --h6-fz, --h6-ps and --h6-bd, written
// here and never by React. The live scene starts the clock on its first frame, and a slow or failed scene
// starts it after 8s so the page never waits on it. Without a scene it starts at once.
function useLoad(section: React.RefObject<HTMLElement | null>, pin: React.RefObject<HTMLElement | null>, clock: LoadClock | null, live: boolean, progress: Progress, lang: string) {
  const frozen = clock?.frozen ?? null;
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
      sec.querySelectorAll<HTMLElement>('.hv7__title .rise__w, .hv6__title .rise__w').forEach((w) => {
        last = Math.max(last, Number(w.style.getPropertyValue('--li')) || 0);
      });
      sec.style.setProperty('--h6-last', String(last));
      if (frozen !== null) freezeHeadline(sec, frozen);
    };
    mark();
    let alive = true;
    document.fonts?.ready.then(() => alive && mark());
    const h1 = sec.querySelector('.hv7__title, .hv6__title');
    const ro = new ResizeObserver(mark);
    if (h1) ro.observe(h1);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [clock, frozen, lang, section]);

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
  }, [clock, frozen, pin, section]);

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
  }, [clock, frozen, section]);

  useEffect(() => {
    if (!clock || frozen !== null) return;
    if (live) {
      const id = window.setTimeout(() => clock.begin(), 8000);
      return () => window.clearTimeout(id);
    }
    clock.begin();
  }, [clock, frozen, live]);

  // scrolling during the load completes it at once
  useEffect(() => {
    if (!clock || frozen !== null) return;
    return progress.subscribe((p) => {
      if (p > 0) clock.skip();
    });
  }, [clock, frozen, progress]);
}

// the step name, written straight on its elements, the old one fades out before the new one fades in
function useStepLabel(stepEl: React.RefObject<HTMLElement | null>, cls: string) {
  const labels = useRef<HTMLElement[] | null>(null);
  return useCallback(
    (p: number) => {
      const lab = stepEl.current;
      if (!lab) return;
      lab.dataset.step = String(stepAt(p) + 1);
      labels.current ??= Array.from(lab.querySelectorAll<HTMLElement>(cls));
      const ls = labels.current;
      for (let i = 0; i < ls.length; i++) ls[i].style.opacity = labelAt(p, i).toFixed(3);
    },
    [stepEl, cls],
  );
}

// ---- still render mode, for scripts/render-hero7.mjs. Only the scene, on a transparent page, at the still's
// own framing and size. `&p=` is the step state.
const STILL_SIZE = { wide: [1376, 760], tall: [360, 360] } as const;
function StillStage({ view, p }: { view: 'wide' | 'tall'; p: number }) {
  const [w, h] = STILL_SIZE[view];
  return (
    <div className="h7-still" style={{ width: w, height: h }}>
      <Suspense fallback={null}>
        <Scene still={{ view, p, w, h }} onReady={() => undefined} />
      </Suspense>
    </div>
  );
}

export function Hero7({ c }: { c: Content }) {
  const q = new URLSearchParams(window.location.search);
  const still = q.get('still');
  if (still === 'wide' || still === 'tall') return <StillStage view={still} p={urlProgress() ?? 0} />;
  return <Specimen c={c} />;
}

function Specimen({ c }: { c: Content }) {
  const desk = useMedia('(min-width: 768px)');
  const [gl] = useState(hasWebgl);
  const [motion] = useState(motionOn);
  if (desk && gl && motion) return <Live c={c} />;
  if (!desk) return <Phone c={c} animate={motion} />;
  return <Poster c={c} />;
}

// ---- the live hero, 768 and up
function Live({ c }: { c: Content }) {
  const x = t7(c);
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const stepEl = useRef<HTMLDivElement>(null);
  const [clock] = useState(() => new LoadClock(urlFreeze()));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const progress = useProgress(section, pin, true);
  const label = useStepLabel(stepEl, '.hv7__stepi');

  // the headline, lede and buttons leave in the last part of step 5, and the step label follows p
  const text = useCallback(
    (p: number) => {
      const el = pin.current;
      if (!el) return;
      const t = textGone(p);
      el.style.setProperty('--h7-t', t.toFixed(4));
      el.dataset.gone = t > 0.98 ? 'yes' : 'no';
      label(p);
    },
    [label],
  );
  const onReady = useCallback(() => clock.begin(), [clock]);
  const drive = useMemo(() => ({ progress, clock, onFrame: text }), [progress, clock, text]);
  // the scene's frame writes the label from the damped p, so the label and the canvas move together
  useLayoutEffect(() => text(progress.current()));
  useLoad(section, pin, clock, true, progress, c.lang);

  return (
    <section ref={section} className="hero hv hv7" data-hero="7" data-pin="yes" aria-labelledby="hv7-title">
      <div ref={pin} className="hv7__pin" data-gone="no">
        <div className="hv7__in g">
          <div className="hv7__top gc">
            <Rise as="h1" id="hv7-title" className="hv7__title display">
              {[c.hero.split[0], c.hero.split[1]]}
            </Rise>
          </div>

          <div className="hv7__stage" role="img" aria-label={x.figure}>
            {mounted ? (
              <div className="hv7__canvas">
                <Suspense fallback={null}>
                  <Scene drive={drive} onReady={onReady} />
                </Suspense>
              </div>
            ) : null}
            <div ref={stepEl} className="hv7__step" aria-hidden="true">
              {x.steps.map((name, i) => (
                <p key={name} className="hv7__stepi mono" style={{ opacity: 0 }}>
                  <span className="hv7__stepn">{`0${i + 1} / 05`}</span>
                  <span className="hv7__stepw">{name}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="hv7__bot gc">
            <div className="hv7__side">
              <Rise as="p" body className="hv7__lede mono-body">
                {c.hero.lede}
              </Rise>
              <div className="hv__cta">
                <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
                <Bracket variant="fill" href="#contact">{c.ui.send}</Bracket>
              </div>
            </div>
            <aside className="hv7__card">
              <p className="hv7__code mono">{x.code}</p>
              <p className="hv7__name mono-body">{x.name}</p>
              <p className="hv7__note mono">{x.note}</p>
            </aside>
          </div>
        </div>
      </div>
      <div className="hv7__run" aria-hidden="true" />
    </section>
  );
}

// ---- reduced motion and no WebGL on a desktop or a tablet, the restored route as one still, no pin
function Poster({ c }: { c: Content }) {
  const x = t7(c);
  return (
    <section className="hero hv hv7 hv7--still" data-hero="7" data-pin="no" aria-labelledby="hv7-title">
      <div className="hv7__pin" data-gone="no">
        <div className="hv7__in g">
          <div className="hv7__top gc">
            <Rise as="h1" id="hv7-title" className="hv7__title display">
              {[c.hero.split[0], c.hero.split[1]]}
            </Rise>
          </div>
          <div className="hv7__stage" role="img" aria-label={x.figure}>
            <div className="hv7__canvas">
              <img className="hv7__poster" src="/render/hero7-wide.webp" width={1376} height={760} alt="" draggable={false} />
            </div>
          </div>
          <div className="hv7__bot gc">
            <div className="hv7__side">
              <Rise as="p" body className="hv7__lede mono-body">
                {c.hero.lede}
              </Rise>
              <div className="hv__cta">
                <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
                <Bracket variant="fill" href="#contact">{c.ui.send}</Bracket>
              </div>
            </div>
            <aside className="hv7__card">
              <p className="hv7__code mono">{x.code}</p>
              <p className="hv7__name mono-body">{x.name}</p>
              <p className="hv7__note mono">{x.note}</p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- phones, under 768. hero 6's phone layout, its classes and its CSS. The block sits centred between the
// two headline halves, TALL_GAP clear of each, as big as the room between them or the stage's width allows,
// Filip, 14 October 2026, "bigger and central". TALL_HALF is one half, two lines of the 40px phone headline,
// and TALL_FOOT the space under the second half, both set in hero6.css. The scene fills the part of the still
// from TALL_VIS_LEFT for TALL_VIS_W of the box width and from TALL_VIS_TOP for TALL_VIS_H of its height,
// measured from public/render/hero7-tall-*.
const TALL_HALF = 80;
const TALL_GAP = 16;
const TALL_FOOT = 48;
const TALL_VIS_LEFT = 0;
const TALL_VIS_W = 1;
const TALL_VIS_TOP = 0.16;
const TALL_VIS_H = 0.68;
const frameSrc = (i: number) => `/render/hero7-tall-f${String(i).padStart(2, '0')}.webp`;
const FRAME_PX = 720;

// The flipbook. Each frame is a still of the scene, they hold and crossfade with their neighbour (acts.ts,
// frameFades), and the opacities are written straight on the images from p, so a scroll never re-renders the
// hero. A frame more than one from the one on top has display none, so a phone holds at most three of them
// on the GPU. The first frame comes with the page. The rest are asked for after it has loaded, the nearest to
// where the scroll is first and then outwards, two at a time, and the ones just ahead are decoded early.
function PhoneStills({ progress, load }: { progress: Progress; load: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ims = Array.from(el.querySelectorAll<HTMLImageElement>('.h7st__img'));
    const o: number[] = new Array(FRAMES).fill(0);
    const last = ims.map((im) => im.style.opacity);
    const shown = ims.map((im) => im.style.display !== 'none');
    const wanted = ims.map((im) => !!im.getAttribute('src'));
    let top = 0;
    const decode = (i: number) => {
      const im = ims[i];
      if (im && wanted[i]) void im.decode?.().catch(() => undefined);
    };
    const apply = (p: number) => {
      const t = frameFades(p, o);
      if (t !== top) {
        top = t;
        for (let d = -2; d <= 2; d++) decode(top + d);
      }
      ims.forEach((im, i) => {
        const keep = o[i] > 0 || Math.abs(i - top) <= 1;
        if (keep !== shown[i]) {
          shown[i] = keep;
          im.style.display = keep ? '' : 'none';
        }
        const v = o[i].toFixed(3);
        if (v !== last[i]) {
          last[i] = v;
          im.style.opacity = v;
        }
      });
    };
    apply(progress.current());
    let live = true;
    let busy = 0;
    // the nearest frame not yet asked for, ahead of the scroll first
    const pump = () => {
      while (live && load && busy < 2) {
        let pick = -1;
        for (let d = 0; d < FRAMES && pick < 0; d++) {
          for (const i of [top + d, top - d]) if (i >= 0 && i < FRAMES && !wanted[i]) { pick = i; break; }
        }
        if (pick < 0) return;
        wanted[pick] = true;
        busy++;
        const im = ims[pick];
        const done = () => {
          busy--;
          if (Math.abs(pick - top) <= 2) decode(pick);
          pump();
        };
        im.onload = done;
        im.onerror = done;
        im.src = frameSrc(pick);
      }
    };
    pump();
    const un = progress.subscribe((p) => {
      apply(p);
      pump();
    });
    return () => {
      live = false;
      un();
    };
  }, [progress, load]);
  return (
    <div ref={box} className="h7st" aria-hidden="true">
      {Array.from({ length: FRAMES }, (_, i) => (
        <img key={i} className="h7st__img" src={i === 0 ? frameSrc(0) : undefined} width={FRAME_PX} height={FRAME_PX} alt="" decoding="async" fetchPriority={i === 0 ? 'high' : 'low'} draggable={false} style={{ display: i === 0 ? undefined : 'none' }} />
      ))}
    </div>
  );
}

function Phone({ c, animate }: { c: Content; animate: boolean }) {
  const x = t7(c);
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stepEl = useRef<HTMLDivElement>(null);
  const [cw, ch] = useBox(stage);
  const [clock] = useState(() => (animate ? new LoadClock(urlFreeze()) : null));
  const progress = useProgress(section, pin, animate);
  const label = useStepLabel(stepEl, '.hv6__stepi');
  const [stillsLoad, setStillsLoad] = useState(false);
  // the five stills load once the page has, so the first view needs only the first
  useEffect(() => {
    if (!animate) return;
    let id = 0;
    const go = () => {
      id = window.setTimeout(() => setStillsLoad(true), 300);
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('load', go);
    };
  }, [animate]);
  useEffect(() => {
    if (!animate) return;
    return progress.subscribe(label);
  }, [animate, progress, label]);
  useLayoutEffect(() => {
    if (animate) label(progress.current());
  });
  useLoad(section, pin, clock, false, progress, c.lang);

  // the box the scene fills, centred in the room between the headline halves and as wide as the stage
  const box = useMemo(() => {
    if (!cw || !ch) return null;
    const room = Math.max(120, ch - 2 * TALL_HALF - 2 * TALL_GAP - TALL_FOOT);
    const s = Math.round(Math.min(room / TALL_VIS_H, cw / TALL_VIS_W));
    return {
      w: s,
      h: s,
      x: Math.round((cw - s * TALL_VIS_W) / 2 - s * TALL_VIS_LEFT),
      y: Math.round(TALL_HALF + TALL_GAP + (room - s * TALL_VIS_H) / 2 - s * TALL_VIS_TOP),
    };
  }, [cw, ch]);

  return (
    <section ref={section} className="hero hv hv6 hv7p" data-hero="7" data-pin={animate ? 'yes' : 'no'} aria-labelledby="hv7-title">
      <div ref={pin} className="hv6__pin" data-gone="no">
        <div className="hv6__in g">
          <div className="hv6__top gc">
            <Rise as="h1" id="hv7-title" className="hv6__title display">
              {[c.hero.split[0], c.hero.split[1]]}
            </Rise>
          </div>

          <div ref={stage} className="hv6__stage" role="img" aria-label={x.figure}>
            {box ? (
              <div className="hv6__box" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
                {animate ? (
                  <PhoneStills progress={progress} load={stillsLoad} />
                ) : (
                  <img className="h7st__still" src={frameSrc(FRAMES - 1)} width={FRAME_PX} height={FRAME_PX} alt="" draggable={false} />
                )}
              </div>
            ) : null}
            {animate ? (
              <div ref={stepEl} className="hv6__step" aria-hidden="true">
                {x.steps.map((name, i) => (
                  <p key={name} className="hv6__stepi mono" style={{ opacity: 0 }}>
                    <span className="hv6__stepn">{`0${i + 1} / 05`}</span>
                    <span className="hv6__stepw">{name}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="hv6__bot gc">
            <div className="hv6__side">
              <Rise as="p" body className="hv6__lede mono-body">
                {c.hero.lede}
              </Rise>
              <div className="hv__cta">
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
      {animate ? <div className="hv6__run" aria-hidden="true" /> : null}
    </section>
  );
}

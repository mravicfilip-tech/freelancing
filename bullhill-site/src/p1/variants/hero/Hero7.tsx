import { Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { motionOn } from '../../motion/motion';
import { Rise } from '../../motion/Rise';
import { t7 } from './copy-hero7';
import { StepList } from './StepList';
import { urlProgress, useProgress, type Progress } from './hero6/progress';
import { useAutoplay } from './hero7/autoplay';
import { LoadClock, urlFreeze } from './hero6/timeline';
import { FLIP, FRAMES, FRAME_P, frameFades, labelAt, stepAt, textGone } from './hero7/acts';
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
// Phones under 768 are one screen, no pin and no scroll driven story. The scene fills the whole first screen
// behind the header, the headline and the foot sit over it on black scrims, and the story plays by itself in
// about 12 seconds once the load has shown the headline, pauses while the hero is off screen and holds the lit
// house at the end (hero7/autoplay.ts). A phone that can take it runs the same scene live, see phoneLiveOk.
// Every other phone flips through 28 stills of the scene in the same lens, dissolved into one another by the
// same time, rendered by scripts/render-hero7.mjs. Reduced motion gets the last frame, the restored route, as a
// still and does not play, and browsers without WebGL on a desktop or a tablet get the wide one. `?flip=1`
// forces the flipbook, `?p=` pins a frame.

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
  sec.querySelectorAll<HTMLElement>('.hv7__title, .hv7__lede, .hv7p__title, .hv7p__lede').forEach((r) => {
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
      sec.querySelectorAll<HTMLElement>('.hv7__title .rise__w, .hv7p__title .rise__w').forEach((w) => {
        last = Math.max(last, Number(w.style.getPropertyValue('--li')) || 0);
      });
      sec.style.setProperty('--h6-last', String(last));
      if (frozen !== null) freezeHeadline(sec, frozen);
    };
    mark();
    let alive = true;
    document.fonts?.ready.then(() => alive && mark());
    const h1 = sec.querySelector('.hv7__title, .hv7p__title');
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
// The tall one is the whole phone screen at the reference size of the flipbook (FLIP in hero7/acts.ts), and
// the script crops its strip out of it.
const STILL_SIZE = { wide: [1376, 760], tall: [FLIP.w, FLIP.h] } as const;
function StillStage({ view, p }: { view: 'wide' | 'tall'; p: number }) {
  const [w, h] = STILL_SIZE[view];
  return (
    <div className="h7-still" style={{ width: w, height: h }}>
      <Suspense fallback={null}>
        <Scene still={{ view, p, w, h, cy: view === 'tall' ? FLIP.cy : undefined }} onReady={() => undefined} />
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

// A phone runs the live scene when it can take it, WebGL2, four cores or more, 3GB of memory or more or not
// said, no data saver and no reduced motion. `?flip=1` forces the flipbook for a check. Every other phone gets
// the flipbook, and reduced motion and no WebGL get the poster.
function phoneLiveOk(motion: boolean) {
  if (!motion || new URLSearchParams(window.location.search).get('flip') === '1') return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if ((nav.hardwareConcurrency ?? 0) < 4) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 3) return false;
  if (nav.connection?.saveData === true) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

// The live scene is never left blank. A WebGL context that cannot be made, or is lost and not back in about
// 2s, drops a phone to the flipbook and a desktop or a tablet to the poster. `?glfail=1` and `?glfail=lost`
// force each failure.
class LiveBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Specimen({ c }: { c: Content }) {
  const desk = useMedia('(min-width: 768px)');
  const [gl] = useState(hasWebgl);
  const [motion] = useState(motionOn);
  const [liveOk] = useState(() => phoneLiveOk(motion));
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  if (desk && gl && motion && !failed) return <Live c={c} onFail={fail} />;
  if (!desk) return <Phone c={c} mode={!motion ? 'poster' : liveOk && !failed ? 'live' : 'flip'} onFail={fail} />;
  return <Poster c={c} />;
}

// ---- the live hero, 768 and up
function Live({ c, onFail }: { c: Content; onFail: () => void }) {
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

          <div className="hv7__stage" role="img" aria-label={x.figure} aria-describedby="hv7-steps">
            {mounted ? (
              <div className="hv7__canvas">
                <LiveBoundary onFail={onFail}>
                  <Suspense fallback={null}>
                    <Scene drive={drive} onReady={onReady} onFail={onFail} />
                  </Suspense>
                </LiveBoundary>
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
      <StepList id="hv7-steps" steps={x.steps} />
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
          <div className="hv7__stage" role="img" aria-label={x.figure} aria-describedby="hv7-steps">
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
      <StepList id="hv7-steps" steps={x.steps} />
    </section>
  );
}

// ---- phones, under 768. The scene fills the whole first screen, 100svh, edge to edge, behind the header,
// Filip, 15 October 2026, "take way more of the screen like full VH". There is no pin and no scroll driven
// story, the page scrolls straight on into the work section after one screen. A black scrim over the top
// carries the headline in one block, a black scrim over the foot carries the step name, the lede and the
// button, and the action sits in the clear band between them. The band is measured from the two blocks, so a
// longer German headline or lede moves it and the scene follows, the middle of the picture on the middle of
// the band (phoneLens in hero7/world.ts). The story plays by itself (hero7/autoplay.ts).
//
// The soft edge of each scrim is FADE px, set in hero7.css as --h7p-fade and read from there, and the band
// takes half of it at each end, since the scene is half there.
// the route takes 1.5s to draw (ROUTE_MS in hero7/Scene.tsx), the story starts just after
const ARM_AT = 1600;
const frameSrc = (i: number) => `/render/hero7-tall-f${String(i).padStart(2, '0')}.webp`;

// The flipbook. Each frame is a still of the scene in the same lens as the live one, a strip of the screen
// around the clear band, FLIP.rows tall at a 390 wide screen, with black baked into its top and bottom edges.
// They dissolve into one another as the story plays (acts.ts, frameFades), and the opacities are written
// straight on the images, so the hero never re-renders. A frame more than one from the one on top has
// display none, so a phone holds at most three of them on the GPU. The first frame comes with the page, the
// rest are asked for after the page has loaded, the next ones ahead of the story first, three at a time, and the
// ones just ahead are decoded early. `gate` tells the story whether the two frames it is between have
// arrived, so a slow connection holds the story where it is and it goes on when the next one is in. A frame
// that failed does not hold it, the picture stays on the one before.
const WAIT = 0;
const ASKED = 1;
const IN = 2;
const LOST = 3;
function PhoneStills({ progress, load, gate }: { progress: Progress; load: boolean; gate: (fn: ((p: number) => boolean) | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ims = Array.from(el.querySelectorAll<HTMLImageElement>('.h7st__img'));
    const o: number[] = new Array(FRAMES).fill(0);
    const last = ims.map((im) => im.style.opacity);
    const shown = ims.map((im) => im.style.display !== 'none');
    const state = ims.map((im) => (!im.getAttribute('src') ? WAIT : im.complete ? (im.naturalWidth > 0 ? IN : LOST) : ASKED));
    ims.forEach((im, i) => {
      if (state[i] === ASKED) {
        im.onload = () => (state[i] = IN);
        im.onerror = () => (state[i] = LOST);
      }
    });
    let top = 0;
    const decode = (i: number) => {
      const im = ims[i];
      if (im && state[i] === IN) void im.decode?.().catch(() => undefined);
    };
    const apply = (p: number) => {
      const t = frameFades(p, o);
      if (t !== top) {
        top = t;
        for (let d = -1; d <= 2; d++) decode(top + d);
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
    // the nearest frame not yet asked for, ahead of the story first
    const pump = () => {
      // before the page has loaded only the first two after the first are asked for, the story needs them
      const reach = load ? FRAMES : 3;
      while (live && busy < 3) {
        let pick = -1;
        for (let d = 0; d < FRAMES && pick < 0; d++) {
          for (const i of [top + d, top - d]) if (i >= 0 && i < reach && state[i] === WAIT) { pick = i; break; }
        }
        if (pick < 0) return;
        state[pick] = ASKED;
        busy++;
        const im = ims[pick];
        const done = (ok: boolean) => {
          busy--;
          state[pick] = ok ? IN : LOST;
          if (ok && pick - top <= 2) decode(pick);
          pump();
        };
        im.onload = () => done(true);
        im.onerror = () => done(false);
        im.src = frameSrc(pick);
      }
    };
    pump();
    gate((p) => {
      let i = 0;
      while (i < FRAMES - 2 && p >= FRAME_P[i + 1]) i++;
      return state[i] >= IN && state[i + 1] >= IN;
    });
    const un = progress.subscribe((p) => {
      apply(p);
      pump();
    });
    return () => {
      live = false;
      gate(null);
      un();
    };
  }, [progress, load, gate]);
  return (
    <div ref={box} className="h7st" aria-hidden="true">
      {Array.from({ length: FRAMES }, (_, i) => (
        <img key={i} className="h7st__img" src={i === 0 ? frameSrc(0) : undefined} width={FLIP.w * 2} height={FLIP.rows * 2} alt="" decoding="async" fetchPriority={i === 0 ? 'high' : 'low'} draggable={false} style={{ display: i === 0 ? undefined : 'none' }} />
      ))}
    </div>
  );
}

// the clear band, in pixels from the top of the screen, from the two blocks. null until measured.
type Band = { w: number; h: number; top: number; bot: number };
function useBand(pin: React.RefObject<HTMLElement | null>, top: React.RefObject<HTMLElement | null>, foot: React.RefObject<HTMLElement | null>) {
  const [band, setBand] = useState<Band | null>(null);
  useLayoutEffect(() => {
    const p = pin.current;
    const t = top.current;
    const f = foot.current;
    if (!p || !t || !f) return;
    const read = () => {
      const fade = parseFloat(getComputedStyle(p).getPropertyValue('--h7p-fade')) || 56;
      const w = p.clientWidth;
      const h = p.clientHeight;
      const b: Band = { w, h, top: Math.round(t.offsetHeight - fade / 2), bot: Math.round(h - f.offsetHeight + fade / 2) };
      setBand((o) => (o && o.w === b.w && o.h === b.h && o.top === b.top && o.bot === b.bot ? o : b));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(p);
    ro.observe(t);
    ro.observe(f);
    return () => ro.disconnect();
  }, [pin, top, foot]);
  return band;
}

function Phone({ c, mode, onFail }: { c: Content; mode: 'live' | 'flip' | 'poster'; onFail: () => void }) {
  const x = t7(c);
  const animate = mode !== 'poster';
  const live = mode === 'live';
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const topEl = useRef<HTMLDivElement>(null);
  const footEl = useRef<HTMLDivElement>(null);
  const stepEl = useRef<HTMLDivElement>(null);
  const band = useBand(pin, topEl, footEl);
  const [clock] = useState(() => (animate ? new LoadClock(urlFreeze()) : null));
  const progress = useAutoplay(section, animate);
  const label = useStepLabel(stepEl, '.hv7p__stepi');
  const [stillsLoad, setStillsLoad] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // the flipbook's frames load once the page has, so the first view needs only the first
  useEffect(() => {
    if (mode !== 'flip') return;
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
  }, [mode]);
  // the live scene writes the label from its own frame, the flipbook from the story's time
  useEffect(() => {
    if (mode !== 'flip') return;
    return progress.subscribe(label);
  }, [mode, progress, label]);
  useLayoutEffect(() => {
    if (animate) label(progress.current());
  });
  // the story starts when the load has shown the headline and drawn the route, and a frozen load (?t=) holds it
  // The story starts when the route is drawn, ARM_AT ms after the assemble began, a little before the load's
  // own end. The clock's change ticks come ASSEMBLE after the call to begin, which is earlier than the end of
  // the assemble when begin comes before 0.6s, so the time is waited out here and not read from the ticks.
  useEffect(() => {
    if (!clock || clock.frozen !== null) return;
    let id = 0;
    const sync = () => {
      window.clearTimeout(id);
      const a = clock.a();
      if (a >= ARM_AT) progress.arm(true);
      else if (a >= 0) id = window.setTimeout(sync, ARM_AT - a + 20);
    };
    sync();
    const off = clock.on(sync);
    return () => {
      window.clearTimeout(id);
      off();
    };
  }, [clock, progress]);
  // the pin's p, for a check of the timing, as a plain attribute so the page is not styled by it
  useEffect(() => {
    const el = pin.current;
    if (!el || !animate) return;
    const w = (p: number) => {
      el.dataset.p = p.toFixed(3);
    };
    w(progress.current());
    return progress.subscribe(w);
  }, [progress, animate]);
  const onReady = useCallback(() => clock?.begin(), [clock]);
  const drive = useMemo(() => (clock ? { progress, clock, onFrame: label } : null), [progress, clock, label]);
  const frame = useMemo(() => (band ? { cy: (band.top + band.bot) / 2 } : undefined), [band]);
  useLoad(section, pin, clock, live, progress, c.lang);

  // the flipbook's strip, as wide as the screen, its band on the screen's band
  const strip = useMemo(() => {
    if (!band) return null;
    const k = band.w / FLIP.w;
    return { top: Math.round((band.top + band.bot) / 2 - (FLIP.cy - FLIP.top) * k), height: Math.round(FLIP.rows * k) };
  }, [band]);

  return (
    <section ref={section} className="hero hv hv7 hv7p" data-hero="7" data-pin="no" data-mode={mode} aria-labelledby="hv7-title">
      <div ref={pin} className="hv7p__pin">
        <div className="hv7p__scene" role="img" aria-label={x.figure} aria-describedby="hv7-steps">
          {live ? (
            mounted && drive && frame ? (
              <div className="h7live">
                <LiveBoundary onFail={onFail}>
                  <Suspense fallback={null}>
                    <Scene drive={drive} phone frame={frame} onReady={onReady} onFail={onFail} />
                  </Suspense>
                </LiveBoundary>
              </div>
            ) : null
          ) : strip ? (
            <div className="h7flip" style={{ top: strip.top, height: strip.height }}>
              {animate ? <PhoneStills progress={progress} load={stillsLoad} gate={progress.hold} /> : <img className="h7st__still" src={frameSrc(FRAMES - 1)} width={FLIP.w * 2} height={FLIP.rows * 2} alt="" draggable={false} />}
            </div>
          ) : null}
        </div>

        <div ref={topEl} className="hv7p__top">
          <Rise as="h1" id="hv7-title" className="hv7p__title display">
            {[c.hero.split[0], c.hero.split[1]]}
          </Rise>
        </div>

        <div className="hv7p__glow" aria-hidden="true" />

        <div ref={footEl} className="hv7p__foot">
          {animate ? (
            <div ref={stepEl} className="hv7p__step" aria-hidden="true">
              {x.steps.map((name, i) => (
                <p key={name} className="hv7p__stepi mono" style={{ opacity: 0 }}>
                  <span className="hv7p__stepn">{`0${i + 1} / 05`}</span>
                  <span className="hv7p__stepw">{name}</span>
                </p>
              ))}
            </div>
          ) : null}
          <Rise as="p" body className="hv7p__lede mono-body">
            {c.hero.lede}
          </Rise>
          <div className="hv__cta">
            <Bracket variant="fill" href="#contact">{c.ui.send}</Bracket>
          </div>
        </div>
      </div>
      <StepList id="hv7-steps" steps={x.steps} />
    </section>
  );
}

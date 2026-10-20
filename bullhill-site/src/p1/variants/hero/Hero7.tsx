import { param } from '../../../shared/env';
import { Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { motionOn } from '../../motion/motion';
import { Rise } from '../../motion/Rise';
import { t7 } from './copy-hero7';
import { StepList } from './StepList';
import { urlProgress, useProgress, type Progress } from './hero6/progress';
import { videoAt } from './hero7/autoplay';
import { LoadClock, urlFreeze } from './hero6/timeline';
import { FLIP, labelAt, stepAt, textGone } from './hero7/acts';
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
// about 18 seconds once the load has shown the headline, pauses while the hero is off screen and holds the lit
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
function StillStage({ view, p: p0 }: { view: 'wide' | 'tall'; p: number }) {
  const [w, h] = STILL_SIZE[view];
  // scripts/render-hero7-video.mjs steps p frame by frame on one page, so the shaders compile once. Review
  // builds only, the public build never reaches a still.
  const [p, setP] = useState(p0);
  useEffect(() => {
    const win = window as unknown as { __h7still?: (p: number) => void; __h7at?: (ms: number) => number };
    win.__h7still = setP;
    win.__h7at = videoAt;
    return () => {
      delete win.__h7still;
      delete win.__h7at;
    };
  }, []);
  return (
    <div className="h7-still" style={{ width: w, height: h }}>
      <Suspense fallback={null}>
        <Scene still={{ view, p, w, h, cy: view === 'tall' ? FLIP.cy : undefined }} onReady={() => undefined} />
      </Suspense>
    </div>
  );
}

export function Hero7({ c }: { c: Content }) {
  const still = param('still');
  if (still === 'wide' || still === 'tall') return <StillStage view={still} p={urlProgress() ?? 0} />;
  return <Specimen c={c} />;
}

// The live scene is never left blank. A WebGL context that cannot be made, or is lost and not back in about
// 2s, drops a desktop or a tablet to the poster. `?glfail=1` and `?glfail=lost`
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
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  if (desk && gl && motion && !failed) return <Live c={c} onFail={fail} />;
  if (!desk) return <Phone c={c} mode={motion ? 'video' : 'poster'} />;
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
// longer German headline or lede moves the strip with it.
//
// The story is a video, Filip, 20 October 2026, "yes go with the video hero", after the live scene and the
// flipbook were rejected for their timeline and for not starting on landing. It is rendered from the same
// scene in the same lens (scripts/render-hero7-video.mjs), about 10 seconds on the pace of
// hero7/video-pace.json, a strip of the screen around the clear band with black baked into its top and bottom
// edges. It plays muted and inline from the moment the page shows, the first frame is its poster, it plays
// once and holds the lit house. It pauses while the hero is off screen and goes on when it is back. The
// phone's video decoder does the work, so the page scrolls free of it. The step label follows the video's own
// time through the pace's curve. Reduced motion, or a phone that refuses to play it, low power mode on an
// iPhone for one, shows the last frame, the restored route, as a still.
//
// The soft edge of each scrim is FADE px, set in hero7.css as --h7p-fade and read from there, and the band
// takes half of it at each end, since the scene is half there.
const VIDEO_SRC = '/render/hero7-phone.mp4';
const VIDEO_WEBM = '/render/hero7-phone.webm';
const POSTER_SRC = '/render/hero7-phone-poster.webp';
const END_SRC = '/render/hero7-phone-end.webp';

// the clear band, in pixels from the top of the screen, from the two blocks. null until measured.
// top and bot are the middle of each scrim's fade, vt and vb where its solid black ends, so the scene shows
// only between vt and vb
type Band = { w: number; h: number; top: number; bot: number; vt: number; vb: number };
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
      const b: Band = {
        w,
        h,
        top: Math.round(t.offsetHeight - fade / 2),
        bot: Math.round(h - f.offsetHeight + fade / 2),
        vt: Math.max(0, Math.floor(t.offsetHeight - fade) - 2),
        vb: Math.min(h, Math.ceil(h - f.offsetHeight + fade) + 2),
      };
      setBand((o) => (o && o.w === b.w && o.h === b.h && o.top === b.top && o.bot === b.bot && o.vt === b.vt && o.vb === b.vb ? o : b));
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

function Phone({ c, mode }: { c: Content; mode: 'video' | 'poster' }) {
  const x = t7(c);
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const topEl = useRef<HTMLDivElement>(null);
  const footEl = useRef<HTMLDivElement>(null);
  const stepEl = useRef<HTMLDivElement>(null);
  // state, not a ref, since the video mounts only once the band is measured and the effects wait for it
  const [v, setVideo] = useState<HTMLVideoElement | null>(null);
  const band = useBand(pin, topEl, footEl);
  const label = useStepLabel(stepEl, '.hv7p__stepi');
  // a phone that will not play it gets the end still in its place
  const [still, setStill] = useState(mode === 'poster');
  const [clock] = useState(() => (still ? null : new LoadClock(urlFreeze())));
  const progress = useMemo(() => noProgress, []);
  useLoad(section, pin, clock, false, progress, c.lang);

  // the step label from the video's time, once a frame while it plays
  useLayoutEffect(() => {
    label(still ? 1 : 0);
  }, [still, label]);
  useEffect(() => {
    if (still || !v) return;
    let id = 0;
    const tick = () => {
      label(videoAt(v.currentTime * 1000));
      id = v.paused || v.ended ? 0 : requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(id);
      id = requestAnimationFrame(tick);
    };
    const end = () => label(1);
    v.addEventListener('playing', run);
    v.addEventListener('seeked', run);
    v.addEventListener('ended', end);
    return () => {
      cancelAnimationFrame(id);
      v.removeEventListener('playing', run);
      v.removeEventListener('seeked', run);
      v.removeEventListener('ended', end);
    };
  }, [v, still, label]);
  // plays on landing, pauses off screen and goes on when back, never starts over after the end
  useEffect(() => {
    const el = section.current;
    if (still || !v || !el) return;
    let seen = true;
    // a play refused by the browser, low power mode on an iPhone for one, shows the end frame. A play cut off
    // by a pause from the observer is not a refusal.
    const go = () => {
      if (!seen || document.hidden || v.ended) return;
      v.play().catch((e: DOMException) => {
        if (e.name !== 'AbortError') setStill(true);
      });
    };
    v.addEventListener('error', () => setStill(true), { once: true });
    const io = new IntersectionObserver((es) => {
      seen = es[es.length - 1].intersectionRatio >= 0.25;
      if (seen) go();
      else v.pause();
    }, { threshold: [0, 0.25, 1] });
    io.observe(el);
    const vis = () => (document.hidden ? v.pause() : go());
    document.addEventListener('visibilitychange', vis);
    go();
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [v, still]);

  // the strip, as wide as the screen, its band on the screen's band
  const strip = useMemo(() => {
    if (!band) return null;
    const k = band.w / FLIP.w;
    return { top: Math.round((band.top + band.bot) / 2 - (FLIP.cy - FLIP.top) * k), height: Math.round(FLIP.rows * k) };
  }, [band]);

  return (
    <section ref={section} className="hero hv hv7 hv7p" data-hero="7" data-pin="no" data-mode={still ? 'poster' : 'video'} aria-labelledby="hv7-title">
      <div ref={pin} className="hv7p__pin">
        <div className="hv7p__scene" role="img" aria-label={x.figure} aria-describedby="hv7-steps">
          {strip ? (
            <div className="h7vid" style={{ top: strip.top, height: strip.height }}>
              {still ? (
                <img className="h7vid__media" src={END_SRC} width={FLIP.w * 2} height={FLIP.rows * 2} alt="" draggable={false} />
              ) : (
                <video ref={setVideo} className="h7vid__media" poster={POSTER_SRC} width={FLIP.w * 2} height={FLIP.rows * 2} muted playsInline autoPlay preload="auto" disablePictureInPicture disableRemotePlayback aria-hidden="true">
                  <source src={VIDEO_SRC} type="video/mp4" />
                  {/* the last source failing means no format played, see the effect above */}
                  <source src={VIDEO_WEBM} type="video/webm" onError={() => setStill(true)} />
                </video>
              )}
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
          <div ref={stepEl} className="hv7p__step" aria-hidden="true">
            {x.steps.map((name, i) => (
              <p key={name} className="hv7p__stepi mono" style={{ opacity: 0 }}>
                <span className="hv7p__stepn">{`0${i + 1} / 05`}</span>
                <span className="hv7p__stepw">{name}</span>
              </p>
            ))}
          </div>
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

// the phone has no scroll progress, the load only reads it to skip its own start on a scroll
const noProgress: Progress = { sample: () => 0, current: () => 0, subscribe: () => () => undefined };

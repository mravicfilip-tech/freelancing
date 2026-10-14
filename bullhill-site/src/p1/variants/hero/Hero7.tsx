import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { motionOn } from '../../motion/motion';
import { Rise } from '../../motion/Rise';
import { Hero6 } from './Hero6';
import { t7 } from './copy-hero7';
import { useProgress } from './hero6/progress';
import { labelAt, stepAt, textGone } from './hero7/acts';
import './hero.css';
import './hero7.css';

// Hero 7, the excavator. One route along a village verge, seen from a low three quarter angle that
// tracks along with the machine. Ahead of the machine's seam the route is the schematic of hero 6, white
// hairlines, station ticks and a stipple of dots on the black, and behind it the same ground is the
// render. The machine stands on the route line facing back down it and reverses along it while it digs,
// the way a real excavator trenches, so the trench opens in front of it and grows away from the camera,
// the spoil heaps along the far side, and the seam rides with the machine. The seam is a world x set in
// the ground's own material, so the scene is drawn once. The scene is a lazy chunk, so the other heroes
// never load three.js.
//
// Same page structure as hero 6, the headline in two halves, the lede and Send the job, a pinned
// stage over 200svh of scroll and a step label slot. p runs 0 to 1 across the pin (hero6/progress.ts,
// `?p=` pins a frame). The scene reads the damped p every frame, sets the machine, the trench, the seam,
// the spoil and the camera from it, draws, and calls paint(p) here, and the step label is written straight
// on its elements. The canvas reaches up behind the headline, so the ground and the plan fill the height
// of the stage. Step 2, Dig, is built (hero7/world.ts, p 0.15 to 0.45), the other four steps hold its end
// state until they are. Phones under 768, reduced motion and browsers without WebGL get hero 6 as it
// is, its phone path and its poster, and hero 7's own phone stills come with the other steps.

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

// `?t=<ms>` freezes the load, the way `?p=` freezes the scroll, for shots
function urlFreeze(): number | null {
  const v = new URLSearchParams(window.location.search).get('t');
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

// the load ends this long after the scene's first frame, and the headline's reveal runs inside it
const LOAD_END = 2800;

// Beat 1 with the clock frozen by ?t=. The headline's blocks are held where the reveal has got to at
// t, the same lines and steps as the CSS (motion/motion.css, --rz is the time, --rp pauses).
function freezeHeadline(sec: HTMLElement, t: number) {
  sec.querySelectorAll<HTMLElement>('.hv7__title, .hv7__lede').forEach((r) => {
    r.style.setProperty('--rz', `${t}ms`);
    r.style.setProperty('--rp', 'paused');
  });
}

export function Hero7({ c }: { c: Content }) {
  const desk = useMedia('(min-width: 768px)');
  const [gl] = useState(hasWebgl);
  const [motion] = useState(motionOn);
  if (!desk || !gl || !motion) return <Hero6 c={c} />;
  return <Dig c={c} />;
}

function Dig({ c }: { c: Content }) {
  const x = t7(c);
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const stepEl = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLElement[] | null>(null);
  const frozen = useMemo(urlFreeze, []);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const progress = useProgress(section, pin, true);

  // the headline, lede and buttons leave in the last part of step 5, and the step label follows p
  const text = useCallback((p: number) => {
    const el = pin.current;
    if (!el) return;
    const t = textGone(p);
    el.style.setProperty('--h7-t', t.toFixed(4));
    el.dataset.gone = t > 0.98 ? 'yes' : 'no';
    const lab = stepEl.current;
    if (lab) {
      lab.dataset.step = String(stepAt(p) + 1);
      labels.current ??= Array.from(lab.querySelectorAll<HTMLElement>('.hv7__stepi'));
      const ls = labels.current;
      for (let i = 0; i < ls.length; i++) ls[i].style.opacity = labelAt(p, i).toFixed(3);
    }
  }, []);
  const drive = useMemo(() => ({ progress, onFrame: text }), [progress, text]);
  // the scene's frame writes the label from the damped p, so the label and the canvas move together
  useLayoutEffect(() => text(progress.current()));

  // ---- the load. The hero's own CSS reads data-load (run, done), data-idle (wait, run, pause, frozen)
  // and the variables --h6-last, --h6-fz, --h6-ps and --h6-bd, written here and never by React. The
  // load starts on the scene's first frame, and a slow or failed scene starts it after 8s so the page
  // never waits on it.
  const [begun, setBegun] = useState(false);
  const onReady = useCallback(() => setBegun(true), []);
  useEffect(() => {
    if (frozen !== null) return;
    const id = window.setTimeout(() => setBegun(true), 8000);
    return () => window.clearTimeout(id);
  }, [frozen]);

  useLayoutEffect(() => {
    const sec = section.current;
    const pinEl = pin.current;
    if (!sec || !pinEl) return;
    let id = 0;
    if (frozen !== null) {
      sec.dataset.load = frozen >= LOAD_END ? 'done' : 'run';
      pinEl.dataset.idle = frozen >= LOAD_END ? 'frozen' : 'wait';
      sec.style.setProperty('--h6-fz', `${frozen}ms`);
      sec.style.setProperty('--h6-ps', 'paused');
      sec.style.setProperty('--h6-bd', `${-Math.max(0, frozen - LOAD_END)}ms`);
    } else {
      sec.dataset.load = 'run';
      pinEl.dataset.idle = 'wait';
      if (begun) {
        id = window.setTimeout(() => {
          sec.dataset.load = 'done';
          pinEl.dataset.idle = 'run';
        }, LOAD_END - 600);
      }
    }
    const mark = () => {
      // the last line of the headline, read from the lines Rise has measured
      let last = 0;
      sec.querySelectorAll<HTMLElement>('.hv7__title .rise__w').forEach((w) => {
        last = Math.max(last, Number(w.style.getPropertyValue('--li')) || 0);
      });
      sec.style.setProperty('--h6-last', String(last));
      if (frozen !== null) freezeHeadline(sec, frozen);
    };
    mark();
    let alive = true;
    document.fonts?.ready.then(() => alive && mark());
    const h1 = sec.querySelector('.hv7__title');
    const ro = new ResizeObserver(mark);
    if (h1) ro.observe(h1);
    return () => {
      alive = false;
      window.clearTimeout(id);
      ro.disconnect();
    };
  }, [frozen, begun, c.lang]);

  // the red glow breathes while the hero is on screen and the tab is visible, and holds still when not
  useEffect(() => {
    const el = section.current;
    const pinEl = pin.current;
    if (!el || !pinEl || frozen !== null) return;
    let inView = true;
    let shown = !document.hidden;
    const apply = () => {
      if (pinEl.dataset.idle === 'wait') return;
      pinEl.dataset.idle = inView && shown ? 'run' : 'pause';
    };
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
  }, [frozen]);

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

import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/azeret-mono';
import './foundry.css';
import './motion/motion.css';
import { startTransition, useEffect, useState } from 'react';
import { useContent } from '../shared/lang';
import { Audiences } from './Audiences';
import { Closing } from './Closing';
import { Contact } from './Contact';
import { Crew } from './Crew';
import { Faq } from './Faq';
import { Header } from './Header';
import { Hero } from './Hero';
import { Process } from './Process';
import { Projects } from './Projects';
import { Services } from './Services';
import { Work } from './Work';
import { ButtonLab } from './variants/buttons/Lab';
import { HERO_VARIANTS } from './variants/hero';
import { useGround } from './motion/ground';
import { motionOn } from './motion/motion';
import { useSmoothScroll } from './motion/smoothScroll';
import { blkVariant, heroVariant, lab } from './variants/params';

// The sections after the hero, in page order. They mount after it, one a frame, so
// the first render is the header and the hero alone and the hero's start plays on a free main thread.
// Mounting the whole page at once held the main thread for about a second on a phone at the start.
const LATER = [Work, Services, Process, Projects, Crew, Audiences, Faq, Contact];
const ALL = LATER.length + 1; // and the closing

// A reload, a back or forward, an anchor or a page already scrolled needs the whole page at once,
// so the browser can put the reader back where they were.
function needAll() {
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  return !!window.location.hash || window.scrollY > 0 || nav?.type === 'reload' || nav?.type === 'back_forward';
}

export default function Foundry() {
  const [c, setLang] = useContent();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const hv = heroVariant();
  const [motion] = useState(motionOn);
  const HeroN = hv === 1 ? Hero : HERO_VARIANTS[hv];
  // with motion off there is no start to protect, so the page mounts whole, and shots stay exact
  const [shown, setShown] = useState(() => (needAll() || !motion ? ALL : 0));
  useEffect(() => {
    if (shown >= ALL) return;
    // The first section waits for the hero's first frames, the rest follow in idle time, one at a time.
    // They followed one animation frame apart, so on a phone running the live hero each one waited for a
    // scene frame and the page below the hero took seconds to arrive, growing under the visitor's thumb.
    // Idle time with a 120ms cap is not tied to the scene's frames.
    const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 16));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    let id = 0;
    const t = window.setTimeout(
      () => {
        id = ric(() => startTransition(() => setShown((n) => Math.min(ALL, n + 1))), { timeout: 120 });
      },
      shown === 0 ? 400 : 0,
    );
    return () => {
      window.clearTimeout(t);
      cic(id);
    };
  }, [shown]);
  // the first scroll, touch or key mounts the rest at once, so nothing is missing where the visitor is going
  const done = shown >= ALL;
  useEffect(() => {
    if (done) return;
    const all = () => setShown(ALL);
    const opts = { once: true, passive: true } as const;
    const evs = ['wheel', 'touchstart', 'keydown', 'scroll'] as const;
    evs.forEach((e) => window.addEventListener(e, all, opts));
    return () => evs.forEach((e) => window.removeEventListener(e, all));
  }, [done]);
  useGround(root, shown >= ALL);
  // off screen sections skip rendering once every section has been laid out once and its size remembered
  useEffect(() => {
    if (!done || !root || !motion) return;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => (root.dataset.cv = 'on'));
    });
    return () => cancelAnimationFrame(id);
  }, [done, root, motion]);
  useSmoothScroll();
  if (lab() === 'buttons') {
    return (
      <div className="p1" id="top" ref={setRoot} lang={c.lang}>
        <Header c={c} setLang={setLang} root={root} />
        <main>
          <ButtonLab c={c} />
        </main>
      </div>
    );
  }
  return (
    <div className="p1" id="top" ref={setRoot} lang={c.lang} data-motion={motion ? 'on' : 'off'} data-blk={blkVariant()}>
      <Header c={c} setLang={setLang} root={root} />
      <main>
        <HeroN c={c} />
        {LATER.slice(0, shown).map((S, i) => (
          <S key={i} c={c} />
        ))}
      </main>
      {shown >= ALL ? <Closing c={c} /> : null}
    </div>
  );
}

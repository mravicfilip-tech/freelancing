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
    // the first section waits for the hero's first frames, the rest follow one frame apart
    let id = 0;
    const t = window.setTimeout(
      () => {
        id = requestAnimationFrame(() => startTransition(() => setShown((n) => Math.min(ALL, n + 1))));
      },
      shown === 0 ? 400 : 0,
    );
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(id);
    };
  }, [shown]);
  useGround(root, shown >= ALL);
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

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { REDUCED, rise, pop, useSectionMotion } from '../../lib/motion';
import { useThemeEpoch } from '../../lib/theme';
import { BoxOnboard } from './boxes/BoxOnboard';
import { BoxCustody } from './boxes/BoxCustody';
import { BoxBonus } from './boxes/BoxBonus';
import { BoxMarkets } from './boxes/BoxMarkets';
import type { SectionMotion } from '../../lib/motion';
import './Bento.css';


/* Card A: Make Your First Forecast in 60 Seconds (BoxOnboard) */

/* Card B: Your Funds Stay Yours (BoxCustody) */

/* Card C: Your First Deposit, Doubled (BoxBonus) */

/* Card D: Forecast Global Markets in One Place (BoxMarkets) */

/* Entrance -------------------------------------------------------------------
   The glow blooms, the header rises, then the four cards arrive one after
   another with their copy and artwork trailing each shell, so the grid reads as
   four arrivals rather than one block appearing. Every tween is a `from`, which
   leaves the resting markup as the finished state: if the script never runs the
   section is simply there. Illustration motion lives in `motion/<x>.ts`, not in
   this timeline.

   Each card module waits for this timeline to finish before it plays its own
   load-in (see motion/shared.ts), so every tenth of a second added here delays
   all four illustrations. Keep the band short (about 1.24s). */
const CARDS_AT = 0.22;
const CARD_STEP = 0.08;
/** How far each card's copy and artwork trail its own shell. */
const CARD_FILL = 0.12;

function buildBento({ q, tl }: SectionMotion) {
  const glow = q('.bento__glow')[0];

  // The DOM runs down one column and then the other, so sort by position to get
  // the order a person actually reads the grid in at any breakpoint.
  const cards = q('.bcard').sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return ra.top - rb.top || ra.left - rb.left;
  });

  if (glow) {
    tl.from(glow, { opacity: 0, scale: 1.08, duration: 0.8, ease: 'power2.out', clearProps: 'transform' }, 0);
  }
  // The frame fades with everything else. If it painted immediately, an empty
  // outlined box would show before its contents and read as a failed load.
  rise(tl, q('.bento__card'), 0, { y: 0, duration: 0.55 });
  rise(tl, q('.bento__title'), 0.05, { duration: 0.6 });
  rise(tl, q('.bento__sub'), 0.12, { duration: 0.6 });
  rise(tl, cards, CARDS_AT, { y: 14, duration: 0.7, stagger: CARD_STEP });

  cards.forEach((card, i) => {
    const at = CARDS_AT + i * CARD_STEP + CARD_FILL;
    const copy = Array.from(card.querySelectorAll<HTMLElement>('.bcard__title, .bcard__body, .bento__cta'));
    // Every box names its own artwork root, so this list must carry all of
    // them. A root missing here fails silently: the entrance just skips it.
    const art = card.querySelector<HTMLElement>(
      '.onb__art, .custody__art, .box-bonus__art, .mk__stage',
    );

    if (art) pop(tl, art, at - 0.04, { scale: 0.94, duration: 0.7, transformOrigin: '50% 60%' });
    if (copy.length) rise(tl, copy, at, { y: 8, duration: 0.5, stagger: 0.06 });
  });
}

/* Illustration motion ---------------------------------------------------------
   Each card's load-in and ambient loop live in their own module, `motion/<x>.ts`
   exporting `<x>(card) => teardown`, matched to `.bcard--<x>`. Globbed rather
   than imported by name so a card without a module simply stays still, and
   loaded on demand so the section costs nothing until it is reached. */
type CardMotion = Record<string, ((card: HTMLElement) => () => void) | undefined>;
/**
 * onboard, funds, bonus, markets. `motion/shared.ts` sits under the same glob
 * and is skipped (there is no `.bcard--shared`), so the shared plumbing is
 * warmed by the same prefetch as the four card modules.
 */
const CARD_MOTION = import.meta.glob<CardMotion>('./motion/*.ts');

/**
 * Fetch the illustration modules at idle, well before the band is reached, and
 * hand back the same promises when it is. Importing them on intersection puts a
 * network round trip on the critical path and leaves the revealed cards with
 * empty artwork for seconds. The map is module-scoped, so a second mount reuses
 * the warm promises.
 */
const warmed = new Map<string, Promise<CardMotion>>();

function warm() {
  for (const [path, load] of Object.entries(CARD_MOTION)) {
    if (!warmed.has(path)) warmed.set(path, load().catch((err) => {
      // Let the real consumer below surface it; a failed prefetch must not
      // become an unhandled rejection, and it must not poison the cache.
      warmed.delete(path);
      throw err;
    }));
  }
}

function prefetchCardMotion() {
  if (REDUCED) return;
  const go = () => warm();
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(go, { timeout: 3000 });
  else window.setTimeout(go, 800);
}

function useCardMotion(ref: RefObject<HTMLElement | null>) {
  /* The card loops read their colours from resolved custom properties at build
     time and cache them for the life of the loop (the packet head, the lit chip
     stroke, a market tile's brightness). These modules are attached by an
     observer in their own effect, so they need the theme epoch as a dependency
     too; without it a theme change leaves them animating the old palette. */
  const themeEpoch = useThemeEpoch();
  // Start warming as soon as the hero says the delicate part of its entrance is
  // over, so the fetches share the same quiet window the 3D mark waits for.
  useEffect(() => {
    if (REDUCED) return;
    const hero = document.querySelector<HTMLElement>('.hero');
    if (!hero || hero.dataset.motionDone) { prefetchCardMotion(); return; }
    const on = () => prefetchCardMotion();
    hero.addEventListener('motion:ready', on, { once: true });
    hero.addEventListener('motion:done', on, { once: true });
    const cap = window.setTimeout(on, 5000);
    return () => {
      window.clearTimeout(cap);
      hero.removeEventListener('motion:ready', on);
      hero.removeEventListener('motion:done', on);
    };
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root || REDUCED) return;

    const teardowns: Array<() => void> = [];
    let cancelled = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        for (const [path, load] of Object.entries(CARD_MOTION)) {
          const name = path.slice(path.lastIndexOf('/') + 1, -'.ts'.length);
          const card = root.querySelector<HTMLElement>(`.bcard--${name}`);
          if (!card) continue;

          // Whatever the prefetch already started, rather than a fresh import.
          warm();
          (warmed.get(path) ?? load())
            .then((mod) => {
              const start = mod[name];
              if (cancelled || typeof start !== 'function') return;
              teardowns.push(start(card));
            })
            .catch((err) => console.error(`bento: ${name} motion failed to load`, err));
        }
      },
      // Deliberately earlier than the section's own entrance. A card module's
      // first act is to park its illustration at a start state (an undrawn
      // chart line, an empty ring), which is only safe while the band is still
      // hidden by `data-motion="pending"`. On the same margin as the entrance
      // this races, and losing shows one frame of settled artwork. Attaching a
      // quarter of a screen early removes the race. Each module then waits for
      // the band's `motion:done` before it plays (see motion/shared.ts).
      { threshold: 0, rootMargin: '0px 0px 25% 0px' },
    );
    io.observe(root);

    return () => {
      cancelled = true;
      io.disconnect();
      teardowns.forEach((stop) => stop());
    };
  }, [ref, themeEpoch]);
}

export function Bento() {
  // The section has to climb a quarter of the screen before it opens. Enough to
  // ignore the sliver that shows under the hero before anyone has scrolled, and
  // early enough that the band is never caught part-built on the way in.
  const ref = useSectionMotion<HTMLElement>(buildBento);
  useCardMotion(ref);

  return (
    <section ref={ref} className="bento" id="why" aria-labelledby="why-title" data-motion="pending">
      {/* Three blurred discs, in the order Figma paints them: dark-red halo, then
          the orange body, then the peach core on top. See Bento.css. */}
      <div className="bento__glows" aria-hidden="true">
        <div className="bento__glow-frame glow-fade">
          <span className="bento__glow">
            <span className="bento__g bento__g--ember" />
            <span className="bento__g bento__g--orange" />
            <span className="bento__g bento__g--peach" />
          </span>
        </div>
      </div>
      <div className="container">
        <div className="bento__card">
          <header className="bento__head">
            <h2 id="why-title" className="bento__title">Why Forecasters Choose Phorcast</h2>
            <p className="bento__sub">The future of prediction markets: faster to enter, easier to explore, and built around your control.</p>
          </header>
          <div className="bento__grid">
            <div className="bento__col bento__col--left">
              <BoxOnboard />
              <BoxCustody />
            </div>
            <div className="bento__col bento__col--right">
              <BoxBonus />
              <BoxMarkets />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

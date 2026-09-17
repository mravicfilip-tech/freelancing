import { useEffect } from 'react';
import type { RefObject } from 'react';
import { REDUCED, rise, pop, useSectionMotion } from '../../lib/motion';
import { BoxOnboard } from './boxes/BoxOnboard';
import { BoxCustody } from './boxes/BoxCustody';
import { BoxBonus } from './boxes/BoxBonus';
import { BoxMarkets } from './boxes/BoxMarkets';
import type { SectionMotion } from '../../lib/motion';
import './Bento.css';


/* Card A — Open an account in 60 seconds */

/* Card B — Your funds leave whenever you want */

/* Card C — Double your capital on first deposit */

/* Card D — Trade every market from one account */

/* Entrance -------------------------------------------------------------------
   The glow blooms, the header rises, then the four cards arrive one after
   another with their copy and artwork trailing each shell, so the grid reads as
   four arrivals rather than one block appearing. Every tween is a `from`, which
   leaves the resting markup as the finished state: if the script never runs the
   section is simply there. Illustration-level motion is chosen separately in
   the /lab pages and is not part of this timeline. */
const CARDS_AT = 0.3;
const CARD_STEP = 0.09;

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
    tl.from(glow, { opacity: 0, scale: 1.08, duration: 1, ease: 'power2.out', clearProps: 'transform' }, 0);
  }
  // The frame fades with everything else. Left out of the sequence it was the
  // one part that painted immediately, so on the way in there was a moment of
  // empty outlined box waiting for its contents -- which reads as the section
  // failing to load rather than as it arriving.
  rise(tl, q('.bento__card'), 0, { y: 0, duration: 0.7 });
  rise(tl, q('.bento__title'), 0.08);
  rise(tl, q('.bento__sub'), 0.18);
  rise(tl, cards, CARDS_AT, { y: 14, duration: 0.8, stagger: CARD_STEP });

  cards.forEach((card, i) => {
    const at = CARDS_AT + i * CARD_STEP + 0.16;
    const copy = Array.from(card.querySelectorAll<HTMLElement>('.bcard__title, .bcard__body, .bento__cta'));
    // Every box names its own artwork root, so this list has to carry all of
    // them. A card whose root is missing here is not an error -- the entrance
    // simply skips it, which looks exactly like broken animation rather than a
    // selector that missed, so it is worth stating the full set explicitly.
    const art = card.querySelector<HTMLElement>(
      '.onb__art, .custody__art, .box-bonus__art, .mk__stage',
    );

    if (art) pop(tl, art, at - 0.04, { scale: 0.94, duration: 0.8, transformOrigin: '50% 60%' });
    if (copy.length) rise(tl, copy, at, { y: 8, duration: 0.55, stagger: 0.07 });
  });
}

/* Illustration motion ---------------------------------------------------------
   Each card's load-in and ambient loop live in their own module, `motion/<x>.ts`
   exporting `<x>(card) => teardown`, matched to `.bcard--<x>`. Globbed rather
   than imported by name so a card without a module simply stays still, and
   loaded on demand so the section costs nothing until it is reached. */
type CardMotion = Record<string, ((card: HTMLElement) => () => void) | undefined>;
/**
 * The illustration loops are off while the rebuilt boxes have no motion of their
 * own.
 *
 * Every module under ./motion was written against the markup these four boxes
 * replaced. Three of them now match nothing and would simply do nothing, which
 * is harmless. `markets.ts` is not harmless: it still matches `.mk__tile` and
 * `.mk__orbits`, and it writes `boxShadow` on each tile every frame. The tiles
 * paint their sub-pixel rings with an *inset* box-shadow -- a border cannot hold
 * a 0.74px weight, Chrome snaps it to 1px -- so the loop was overwriting the
 * ring with a drop shadow. Measured: `rgba(0,0,0,0.09) 0 0 0 0.74px inset` at
 * 1.2s, `rgba(22,12,9,0.14) 0 4px 11px -8px` by 6s.
 *
 * Rather than half-port them, the glob is pointed at nothing and the files stay
 * as reference for the motion rebuild.
 */
const CARD_MOTION = import.meta.glob<CardMotion>('./motion-disabled/*.ts');

/**
 * Fetch the illustration modules well before anyone reaches the band, and hand
 * back the same promises when it is.
 *
 * They used to be imported at the moment the section came into view, which put
 * a network round trip on the critical path: measured on a scroll from the top,
 * the section revealed itself and then sat with empty artwork for 4.2 seconds
 * while five modules were fetched. Warming them at idle costs nothing anyone
 * can see -- the page has already settled -- and turns the arrival into a cache
 * read. The map is module-scoped, so a second mount reuses the warm promises
 * rather than starting again.
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
      // The same penetration margin as the section's own entrance, so the
      // illustrations start their loops on the same scroll position.
      { threshold: 0, rootMargin: '0px 0px -25% 0px' },
    );
    io.observe(root);

    return () => {
      cancelled = true;
      io.disconnect();
      teardowns.forEach((stop) => stop());
    };
  }, [ref]);
}

export function Bento() {
  // The section has to climb a quarter of the screen before it opens. Enough to
  // ignore the sliver that shows under the hero before anyone has scrolled, and
  // early enough that the band is never caught part-built on the way in.
  const ref = useSectionMotion<HTMLElement>(buildBento);
  useCardMotion(ref);

  return (
    <section ref={ref} className="bento" id="why" aria-labelledby="why-title" data-motion="pending">
      <div className="bento__glows glow-fade" aria-hidden="true"><span className="bento__glow" /></div>
      <div className="container">
        <div className="bento__card">
          <header className="bento__head">
            <h2 id="why-title" className="bento__title">Why Traders Move to Phorecast</h2>
            <p className="bento__sub">The tools incumbents can't give you, on infrastructure that never holds your funds.</p>
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

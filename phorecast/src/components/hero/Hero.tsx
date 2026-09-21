import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { REDUCED, useSectionMotion } from '../../lib/motion';
import { heroBuild, heroIdle, slideIn } from './entrance';
import { Nav } from '../Nav';
import { Roll } from '../Roll';
import { Position } from './Position';
import { TickerCard, type Ticker } from './TickerCard';
import { SlideAccount } from './slides/SlideAccount';
import { SlideBonus, BonusCountdown } from './slides/SlideBonus';
import { SlideFuture } from './slides/SlideFuture';
import { HeroLogo } from '../HeroLogo';
import { LiveDot } from '../LiveDot';
import apple from '../../assets/icons/apple.svg';
import tesla from '../../assets/icons/tesla.svg';
import bitcoin from '../../assets/icons/bitcoin.svg';
import gold from '../../assets/icons/gold.svg';
import './Hero.css';

/**
 * The strip's four cards.
 *
 * WHAT A CARD IS NOW. It was a spot quote -- an asset, a dollar price and a
 * percentage move -- which is the furniture of an exchange, and it framed the
 * page as somewhere you buy the asset and keep the move. You do not buy the
 * asset here. You buy a contract on an outcome, and a winning contract pays
 * $1, so the only number a reader can act on is what that contract costs right
 * now. The four slots the card already had take it without being rebuilt:
 *
 *   symbol   the market                          AAPL
 *   contract the contract, and when it settles   Up/Down . 5 min
 *   price    what one contract costs             62c
 *   change   what that cost has done             +3c
 *
 * Two contract types over two rungs of the ladder, each pair once, so the
 * strip states the product's range rather than repeating one corner of it.
 * The rungs are the two the client's copy names -- five minutes and monthly --
 * and not an invented one in between.
 *
 * SPORTS IS MISSING and is not an oversight: it is a market category now, but
 * this strip identifies a market by its instrument icon and `src/assets` has
 * no sports mark. A fifth card would need artwork nobody has supplied.
 */
const TICKERS: Ticker[] = [
  { symbol: 'AAPL', contract: 'Up/Down · 5 min', price: '62¢', change: '+3¢', up: true, icon: apple, mono: true },
  { symbol: 'TSLA', contract: 'Price Hit · 5 min', price: '41¢', change: '−2¢', up: false, icon: tesla },
  { symbol: 'BTC/USD', contract: 'Price Hit · monthly', price: '58¢', change: '+1¢', up: true, icon: bitcoin },
  { symbol: 'XAU/USD', contract: 'Up/Down · monthly', price: '47¢', change: '−3¢', up: false, icon: gold },
];

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  cta: string;
  href: string;
  visual: ReactNode;
  /** Extra copy-column content, between the lede and the CTA. */
  aside?: ReactNode;
  foot?: ReactNode;
};

/**
 * The contract strip, below the pager.
 *
 * WHOSE CONTENT IS THIS? It is rendered outside `.hero__stage`, as a sibling of
 * the pager, and the slides that do not carry it fall back to an EMPTY box of
 * the same class -- an admission in the markup itself that the strip's slot
 * belongs to the hero rather than to slide 1. Desktop can afford to treat it as
 * slide 1's alone, because `min-height: 1080px` swallows the difference. A
 * phone cannot: four cards wrapped 2 x 2 are 332px taller than the empty box,
 * so the document grew and shrank by 332px every seven seconds, moving
 * everything below the hero under the reader's thumb.
 *
 * So on a phone it is hero furniture and is shown on every slide (see
 * `compact` below). Nothing changes at 721px and up.
 *
 * THE NOTE ABOVE THE CARDS carries the one fact that makes four two-digit cent
 * figures mean anything: the contract they price pays $1. Stated once, over the
 * row, rather than four times inside cards that have no room for it -- and it
 * has to be on the strip rather than in slide 1's lede, because on a phone the
 * strip is under all four slides and only one of them has that lede.
 */
const MARKET_SNAPSHOT = (
  <div className="hero__snapshot">
    <p className="hero__snapshot-note">Each winning contract pays $1.</p>
    <ul className="hero__foot" aria-label="Contract snapshot">
      {TICKERS.map((t) => <TickerCard key={t.symbol} t={t} />)}
    </ul>
  </div>
);

const SLIDES: Slide[] = [
  {
    id: 'mark',
    eyebrow: 'Global Markets. One Platform.',
    title: 'The Future\nof Trading',
    lede: 'Phorcast is a prediction market for crypto, stocks, indices, commodities, forex and sports. No leverage, no liquidations.',
    cta: 'Get Started',
    href: '#signup',
    visual: null,
    foot: MARKET_SNAPSHOT,
  },
  {
    id: 'account',
    eyebrow: 'Global Markets. One Platform.',
    title: 'One account.\nEvery market.',
    lede: 'Open Phorcast in under two minutes and take a position on any market we list. Your maximum loss is always what you stake.',
    cta: 'Create account',
    href: '#signup',
    visual: <SlideAccount />,
  },
  {
    id: 'bonus',
    eyebrow: 'Global Markets. One Platform.',
    title: 'Half this stack\nis on us.',
    lede: 'Fund your account and Phorcast matches it,\ndollar for dollar, up to $200.',
    cta: 'Get your bonus',
    href: '#signup',
    visual: <SlideBonus />,
    aside: <BonusCountdown />,
  },
  {
    id: 'future',
    eyebrow: 'Global Markets. One Platform.',
    title: 'The Future\nof Trading',
    lede: 'Phorcast is a prediction market for crypto, stocks, indices, commodities, forex and sports. No leverage, no liquidations.',
    cta: 'Get Started',
    href: '#signup',
    visual: <SlideFuture />,
  },
];

const AUTOPLAY_MS = 7000;

/* Below this the slide collapses to one column (see Hero.css), so the mark has
   to come down with it. It is the SAME number as the stacking rule on purpose:
   the mark and the illustration it replaces are the same slot. */
const STACKED = '(max-width: 1180px)';

/* The phone range. Hero.css's own `@media (max-width: 720px)` block, read from
   script: below it the hero is a single narrow column whose vertical budget is
   a viewport rather than a 1080px frame, and two things have to know it --
   where the market snapshot lives, and how large the mark is drawn. */
const COMPACT = '(max-width: 720px)';

/**
 * Where the 3D mark lives.
 *
 * Two columns: the mark is a layer over the whole hero, placed into the empty
 * right-hand half by `markPlacement` below. One column: there is no right-hand
 * half, so the layer has nowhere to be and it belongs in slide 1's own visual
 * slot, under the copy, exactly where every other slide puts its illustration.
 *
 * It really is a move and not two marks. `.heroLogo` is mounted once either
 * way, and crossing this breakpoint rebuilds the WebGL scene -- which the
 * component already does on its own 767/1279 queries, because the placement
 * differs. So the cost of the move is a cost that was already being paid.
 */
function useMedia(query: string) {
  return useSyncExternalStore(
    useCallback((onChange) => {
      const q = window.matchMedia(query);
      q.addEventListener('change', onChange);
      return () => q.removeEventListener('change', onChange);
    }, [query]),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** `?slide=3` opens on a given slide (handy for review) and pauses autoplay. */
function initialSlide() {
  const n = Number(new URLSearchParams(window.location.search).get('slide'));
  return n >= 1 && n <= SLIDES.length ? n - 1 : 0;
}

export function Hero() {
  const [index, setIndex] = useState(initialSlide);
  const [paused, setPaused] = useState(() => initialSlide() !== 0);
  const reduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    const onChange = () => { reduced.current = mq.matches; };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Is any of the hero on screen? The carousel and the market-price loop both
  // ask, and neither should run for a reader who is three bands further down.
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    if (paused || !onScreen || reduced.current) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, onScreen, index]);

  const go = useCallback((i: number) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length), []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  };

  const active = SLIDES[index];
  // Slide 1 is the only one that shows the mark; it sits where the static SVG did.
  // The hero is above the fold, so the observer in useSectionMotion fires at
  // once; the hook still holds the timeline until the browser has painted.
  const heroRef = useSectionMotion<HTMLElement>(
    useCallback(({ el, tl }) => heroBuild(el, tl), []),
    { immediate: true, idle: heroIdle },
  );

  // Off screen, the carousel holds. It was advancing every seven seconds
  // whatever was under the reader's eye, and a slide change is not a cheap
  // thing to do unwatched: it re-renders the stage, swaps the background
  // modifier, and builds a fresh slideIn -- a masked line reveal carrying 12px
  // of blur across the display type and 7px across the lede, plus the
  // illustration's pop.
  //
  // Holding, not stopping. The interval is cleared and a new one is started
  // when the hero comes back, so the reader who scrolls up finds the slide they
  // left on, given a full seven seconds before it moves -- rather than the
  // slide the page would have reached, or a run of catch-up changes, or slide
  // one. `index` is React state and is never touched here.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [heroRef]);

  // Each slide change replays the copy choreography, so the mask reveal and the
  // glare are seen on every slide rather than only the first. Skipped on the
  // very first render, which the entrance above already covers.
  // Keyed on the index actually animated, not a "first render" flag: StrictMode
  // runs this twice on mount, and a boolean guard lets the second run replay the
  // copy from zero — which looked exactly like the entrance stuttering.
  const shown = useRef<number | null>(null);
  useEffect(() => {
    if (shown.current === index) return;
    const previous = shown.current;
    shown.current = index;
    if (previous === null) return; // the entrance covers the first slide
    const el = heroRef.current;
    if (!el || REDUCED) return;

    const slide = el.querySelector<HTMLElement>('.hero__slide.is-active');
    if (!slide) return;

    // A context scoped to the slide, so teardown can put back everything the
    // timeline touched. The old cleanup killed the timeline where it stood and
    // then cleared props from a hand-written list of selectors, which left
    // every element not on that list -- the illustration's parts, above all --
    // frozen at the start values `from` had written: an illustration stuck at
    // 92% and, when a change landed mid-flight, a Get Started button stranded
    // at opacity 0. revert() restores what GSAP set, all of it, by construction.
    let guard = 0;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      slideIn(slide, tl, 0);

      // The CSS crossfade takes 600ms; if the copy tweens are still holding
      // their start values after that plus their own run, force the settled state.
      guard = window.setTimeout(() => {
        if (tl.progress() < 1) tl.progress(1);
      }, 2600);
    }, slide);

    return () => { window.clearTimeout(guard); ctx.revert(); };
  }, [index]);

  const stacked = useMedia(STACKED);
  const compact = useMedia(COMPACT);
  // Two columns: the mark sits in the empty right-hand half of the hero.
  // One column: its box IS the visual slot, so it simply fills it, centred.
  // LogoScene sizes the mark against `canvas.parentElement`, i.e. `.heroLogo`
  // itself, so these fractions are read against whichever box it is given.
  //
  // On a phone the height fraction is the binding one. LogoScene takes the
  // SMALLER of `heightFraction * h` and `widthFraction * w`, so at 390px the
  // old 0.7 width fraction won and drew a 221-unit mark inside a 257px box --
  // a mark that read as small and sat low. 0.94 takes width out of the way and
  // hands the decision to the box, which is the point of giving it a box.
  //
  // 0.88 and not 0.96, because `size` is not the mark's drawn height: the
  // silhouette is about 1.084 times taller than the number it is given (240px
  // drawn from a size of 221.4, measured). At 0.96 the mark rendered 328px in
  // a 315.8px box and `.heroLogo`'s `overflow: hidden` took 6px off the top
  // and the bottom. 0.88 draws it at 301 with 7px of air either side.
  const markPlacement = useMemo(
    () => (compact
      ? { heightFraction: 0.88, widthFraction: 0.94, cx: 0.5, cy: 0.5 }
      : stacked
        ? { heightFraction: 0.86, widthFraction: 0.7, cx: 0.5, cy: 0.5 }
        : { heightFraction: 0.56, widthFraction: 0.33, cx: 0.735, cy: 0.42 }),
    [stacked, compact],
  );

  const mark = (
    <HeroLogo
      hostRef={heroRef}
      variant="lined"
      placement={markPlacement}
      className={`hero__logo${index === 0 ? ' is-visible' : ''}`}
    />
  );

  return (
    <section
      ref={heroRef}
      data-motion="pending"
      className="hero"
      id="top"
      aria-roledescription="carousel"
      aria-label="Phorcast highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKey}
    >
      <div className={`hero__bg hero__bg--${SLIDES[index].id}`} aria-hidden="true">
        <span className="hero__glow hero__glow--ember" />
        <span className="hero__glow hero__glow--peach" />
        <span className="hero__glow hero__glow--orange" />
        <span className="hero__glow hero__glow--core" />
        <span className="hero__glow hero__glow--cream" />
        <span className="hero__horizon" />
      </div>

      {stacked ? null : mark}

      <div className="container container--wide hero__inner">
        <Nav />

        <div className="hero__stage">
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`hero__slide${i === index ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={i !== index}
            >
              <div className="hero__copy">
                <div className="hero__heading">
                  <p className="eyebrow">
                    <LiveDot />
                    {s.eyebrow}
                  </p>
                  <h1 className="display hero__title">{s.title}</h1>
                </div>
                <p className="lede hero__lede">{s.lede}</p>
                {s.aside}
                <a href={s.href} className="btn btn--primary hero__cta" tabIndex={i === index ? 0 : -1}><Roll>{s.cta}</Roll></a>
              </div>
              {/* Slide 1's visual IS the mark once the slide is one column. */}
              <div className="hero__visual">{stacked && i === 0 ? mark : s.visual}</div>
            </div>
          ))}
        </div>

        <div className="hero__position">
          <Position
            index={index}
            count={SLIDES.length}
            onSelect={go}
            periodMs={AUTOPLAY_MS}
            paused={paused || !onScreen || reduced.current}
            // The hero leaving or returning starts a fresh interval above, so
            // the track has to start a fresh run with it. Without this it
            // resumed the elapsed time it had banked when the reader scrolled
            // away and filled to the end several seconds before the slide it
            // is describing actually changed.
            cycleKey={onScreen}
          />
        </div>

        {compact ? MARKET_SNAPSHOT : active.foot ?? <div className="hero__snapshot" />}
      </div>
    </section>
  );
}

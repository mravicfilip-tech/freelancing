import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { REDUCED, useSectionMotion } from '../../lib/motion';
import { heroBuild, slideIn } from './entrance';
import { Nav } from '../Nav';
import { Roll } from '../Roll';
import { Position } from './Position';
import { SlideAccount } from './slides/SlideAccount';
import { SlideBonus, BonusCountdown } from './slides/SlideBonus';
import { SlideFuture } from './slides/SlideFuture';
import { HeroLogo } from '../HeroLogo';
import { LiveDot } from '../LiveDot';
import { ctaProps, type CtaKey } from '../../lib/cta';
import './Hero.css';

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  cta: string;
  /** Where the button goes: a key into lib/cta.ts, not an href. */
  link: CtaKey;
  /** Small print under the button (slide 3's bonus terms). */
  terms?: string;
  visual: ReactNode;
  /** Extra copy-column content, between the lede and the CTA. */
  aside?: ReactNode;
};

/*
 * There is no market snapshot under the pager any more. The client asked for
 * the row to go: at a laptop's 1280 x 800 it started flush on the pager, 0px
 * under it, with the AAPL card running 114px under the rail and the next arrow,
 * and the whole row sat below the fold. It also held the hero 148px taller on
 * slide 1 than on the other three at 1440 x 900, where `min(1080px, 100svh)` is
 * 900 and swallows nothing, so the page under the hero jumped by that much at
 * every change to or from slide 1. The slot it reserved on every slide was an
 * empty box whose only job was 70px of floor; that floor is now the hero's own
 * (`.hero__inner`'s padding in Hero.css), so slides 2 to 4 did not move.
 */

const SLIDES: Slide[] = [
  {
    id: 'mark',
    eyebrow: 'FINANCIAL MARKETS. FUTURE OUTCOMES.',
    title: 'Put Your Market\nView in Play.',
    lede: 'Take a position on price targets, market milestones, and the events shaping stocks, crypto, commodities, and the wider economy.',
    cta: 'Explore Markets',
    link: 'heroMarkets',
    visual: null,
  },
  {
    id: 'account',
    eyebrow: 'SPORTS MARKETS. BUILT FOR FANS.',
    title: 'Your Sports Knowledge\nHas a Market.',
    lede: 'Take a position on match winners, tournament champions, player milestones, and the moments that define every season.',
    cta: 'Explore Sports Markets',
    link: 'heroSports',
    visual: <SlideAccount />,
  },
  {
    id: 'bonus',
    eyebrow: 'LIMITED-TIME WELCOME BONUS',
    title: 'Your First Deposit.\nDoubled.',
    lede: 'Open your Phorcast account and get a 100% match on your first deposit, up to $200.',
    cta: 'Claim Your Bonus',
    link: 'heroBonus',
    terms: 'Terms and eligibility apply.',
    visual: <SlideBonus />,
    aside: <BonusCountdown />,
  },
  {
    id: 'future',
    eyebrow: 'INTRODUCING THE PHORCAST TOKEN',
    title: 'Built for the Future\nof Prediction Markets.',
    lede: 'Discover the token at the heart of the Phorcast ecosystem, connecting our markets, community, and vision for what comes next.',
    cta: 'Explore the Token',
    link: 'heroToken',
    visual: <SlideFuture />,
  },
];

const AUTOPLAY_MS = 7000;

/* Where keyboard focus holds the carousel: its own parts, the slides and the
   pager. The nav shares the section but is not the carousel, and tabbing
   through it should not stop the slides. The play control is left out on
   purpose, as the APG carousel pattern does: a keyboard reader standing on
   "Play" has to be able to press it and watch the slides move. */
const HOLDS_FOCUS = '.hero__stage, .hero__position';
const PLAY_CONTROL = '.hero__play';

/** True when `el` is a keyboard focus inside the carousel that should hold it.
 *  `:focus-visible` is how a pointer's focus is told apart from a keyboard's:
 *  clicking a pager segment focuses the rail, and that click is a request to
 *  go to a slide, not to stop the carousel on it. */
function holdsFocus(el: Element | null) {
  return !!el && !!el.closest(HOLDS_FOCUS) && !el.closest(PLAY_CONTROL) && el.matches(':focus-visible');
}

/* Below this the slide collapses to one column (see Hero.css), so the mark has
   to come down with it. It is the SAME number as the stacking rule on purpose:
   the mark and the illustration it replaces are the same slot. */
const STACKED = '(max-width: 1180px)';

/* The phone range. Hero.css's own `@media (max-width: 720px)` block, read from
   script: below it the hero is a single narrow column whose vertical budget is
   a viewport rather than a 1080px frame, and the mark has to know it to size
   itself. */
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

/** `?slide=3` opens on a given slide (handy for review). It used to pause
 *  autoplay as well; it no longer does, so a shared link to a slide behaves
 *  like the page does. To hold a slide for review, press the play control. */
function initialSlide() {
  const n = Number(new URLSearchParams(window.location.search).get('slide'));
  return n >= 1 && n <= SLIDES.length ? n - 1 : 0;
}

/**
 * Which slides show the 3D mark, and where.
 *
 * Two of the four do: slide 1, where it is the whole illustration, and slide 4,
 * where it is one part of the network diagram (Figma 390:3609, a 370 x 370
 * square at 734, 242 inside group 365:803 -- `.sl4__mark-slot`). There is one
 * scene, not two, so the fourth slide is not a second mark: it is the same one,
 * moved.
 *
 * Slide 4's mark belongs to the two-column layout only. Below `STACKED` the
 * mark is slide 1's own visual (see the render below) and cannot be in two
 * slides at once, and slide 4's phone crop is chosen so the slot falls outside
 * the window anyway (SlideFuture.css).
 */
const SLOT_SLIDE = 3;

/**
 * How tall the mark is drawn inside its slot, as a fraction of the slot.
 *
 * Figma's render of 390:3609 puts a 232 x 268 mark in the middle of its 370
 * square, so this is 268/370. Measured on the rendered pixels, both numbers:
 * the design's render and the page are diffed against the same page with the
 * layer hidden, and the bounding box of what differs is the mark.
 */
const MARK_IN_SLOT = 268 / 370;

/**
 * The mark's drawn height over the `size` LogoScene is given.
 *
 * `placement` is not the mark's drawn size -- the silhouette is taller than the
 * number it is handed, because `size` is the height of the pivot and the mark
 * is turned inside it. Measured at 1440 on slide 1: a 507px mark from a size of
 * 475.2. Together with the fraction above it lands a 202px mark in a 277.5px
 * slot, against the design's 201.
 */
const MARK_DRAWN_OVER_SIZE = 1.0669;

export function Hero() {
  // `from` is the slide being left, kept because the mark's two homes are one
  // object: see `markOnSlot` below.
  const [{ index, from }, setSlide] = useState(() => ({ index: initialSlide(), from: initialSlide() }));
  /*
   * WHAT HOLDS THE CAROUSEL, and what no longer does.
   *
   * It used to hold on `mouseenter` and on any focus inside the section. On a
   * laptop the hero IS the viewport -- 940px tall at 1440 x 900 -- so a cursor
   * resting anywhere on the page's first screen stopped it, and it never moved:
   * measured with the cursor parked mid-hero, 0 advances in 30s. A click on a
   * pager segment focused the rail and held it there too, and `?slide=` opened
   * paused. Hover no longer holds it and a pointer's focus no longer holds it.
   *
   * What does:
   *   - the reader, with the play control beside the pager (WCAG 2.2.2);
   *   - keyboard focus on the slides or the pager (see `holdsFocus`), which is
   *     the standard carousel behaviour and lets a keyboard reader read;
   *   - the hero being off screen (see the observer below);
   *   - reduced motion, where it never advances and has no control to show.
   */
  const [userPaused, setUserPaused] = useState(false);
  const [focusHeld, setFocusHeld] = useState(false);
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');

  // Is any of the hero on screen? The carousel asks, and should not run for a
  // reader who is three bands further down.
  const [onScreen, setOnScreen] = useState(true);

  const held = userPaused || focusHeld || !onScreen || reducedMotion;

  /*
   * THE CLOCK. One run per slide: a slide change, however it happened, starts
   * a fresh 7s from the slide it lands on, so a click never lands on a slide
   * that moves on a moment later. A hold BANKS the time already spent and a
   * release spends only what is left, which is exactly what Position's track
   * does with the same `paused` and the same reset keys -- so the track filling
   * and the slide changing stay the same moment. (The old interval restarted a
   * full 7s on every release while the track resumed where it stood, so after
   * any hold the track ran out seconds before the slide changed.) Measured at
   * 1440: paused with the track 0.715 full and released 12s later, the slide
   * changed 2011ms after the release, against the 1995 the track had left, and
   * the track read 0.97 to 1.0 full at every change it made on its own.
   *
   * The reset is its own effect, declared first: on a change React runs every
   * cleanup and then every effect in order, so the timer below always reads
   * the run that belongs to the slide now showing.
   */
  const run = useRef({ start: 0, banked: 0 });
  useEffect(() => { run.current = { start: performance.now(), banked: 0 }; }, [index, onScreen]);
  useEffect(() => {
    if (held) return;
    const r = run.current;
    r.start = performance.now() - r.banked;
    const id = window.setTimeout(
      () => setSlide((s) => ({ from: s.index, index: (s.index + 1) % SLIDES.length })),
      Math.max(0, AUTOPLAY_MS - r.banked),
    );
    return () => { window.clearTimeout(id); r.banked = performance.now() - r.start; };
  }, [held, index, onScreen]);

  const go = useCallback(
    (i: number) => setSlide((s) => ({ from: s.index, index: ((i % SLIDES.length) + SLIDES.length) % SLIDES.length })),
    [],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
    // A rail focused by a click and then driven from the keyboard is keyboard
    // focus from here on, and holds like any other.
    setFocusHeld(holdsFocus(document.activeElement));
  };

  // Slides 1 and 4 show the mark: slide 1 where the static SVG used to sit, and
  // slide 4 on `.sl4__mark-slot` (see SLOT_SLIDE above). One scene serves both.
  // The hero is above the fold, so the observer in useSectionMotion fires at
  // once; the hook still holds the timeline until the browser has painted.
  const heroRef = useSectionMotion<HTMLElement>(
    useCallback(({ el, tl }) => heroBuild(el, tl), []),
    { immediate: true },
  );

  // Off screen, the carousel holds. It was advancing every seven seconds
  // whatever was under the reader's eye, and a slide change is not a cheap
  // thing to do unwatched: it re-renders the stage, swaps the background
  // modifier, and builds a fresh slideIn -- a masked line reveal carrying 12px
  // of blur across the display type and 7px across the lede, plus the
  // illustration's pop.
  //
  // Holding, not stopping. The timer is cleared and a fresh run is started
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
    // 92% and, when a change landed mid-flight, a slide button stranded
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
  }, [index, heroRef]);

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
  //
  // Two columns, `cy` is a fraction of the hero, and the hero on slide 1 lost
  // the market snapshot's 148px at 1440 x 900 (1088 to 940). 0.42 is kept on
  // purpose rather than raised to hold the old spot. The old spot was set
  // against a hero carrying the snapshot, and it hung the mark 54 to 65px below
  // the middle of the copy at every laptop size. At 0.42 on the shorter hero
  // the mark rose 62px and its middle lands on the copy's middle: -2.9, -7.6,
  // -6.9 and +18.8px at 1280, 1366, 1440 and 1512, with 52 to 75px of clear
  // air under the nav. Its SIZE is unmoved, because at every one of those
  // widths the width fraction is the one that binds.
  const markPlacement = useMemo(
    () => (compact
      ? { heightFraction: 0.88, widthFraction: 0.94, cx: 0.5, cy: 0.5 }
      : stacked
        ? { heightFraction: 0.86, widthFraction: 0.7, cx: 0.5, cy: 0.5 }
        : { heightFraction: 0.56, widthFraction: 0.33, cx: 0.735, cy: 0.42 }),
    [stacked, compact],
  );

  /**
   * Slide 4 puts the mark on `.sl4__mark-slot`, and it is MOVED there rather
   * than re-placed.
   *
   * `placement` is a dependency of the effect in HeroLogo that constructs the
   * scene, so handing slide 4 a placement of its own would dispose the
   * WebGLRenderer and build a fresh one on every carousel advance -- eight
   * rebuilds a minute, for the life of the page, none of it visible in a
   * screenshot. Measured, three full carousel cycles at 1440 driven by the
   * pager: 13 scene constructions with `markPlacement` keyed on `index`, one
   * for the build and one for each of the twelve changes. With the transform
   * below, 1 -- and 1 again under live autoplay.
   *
   * So the layer keeps its box and its placement, and the canvas inside it
   * wears a transform instead (see Hero.css for why the canvas and not the
   * layer). A transform raises no ResizeObserver, so LogoScene does not even
   * re-lay-out, let alone rebuild; nothing about the scene knows this happened.
   *
   * The numbers have to be measured because none of them is expressible in CSS.
   * The scale is a ratio of two lengths, which calc() cannot divide, and the
   * slot's position depends on the nav's height -- so this reads the boxes and
   * writes custom properties that Hero.css spends.
   */
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero || stacked) return;
    const logo = hero.querySelector<HTMLElement>('.hero__logo');
    const stage = hero.querySelector<HTMLElement>('.hero__stage');
    const slot = hero.querySelector<HTMLElement>('.sl4__mark-slot');
    const visual = slot?.closest<HTMLElement>('.hero__visual');
    if (!logo || !stage || !slot || !visual) return;

    const place = () => {
      // The slot's SETTLED box. `.hero__visual` carries the slide's entrance
      // (translateY(18px) scale(0.985) until the slide is active, then 800ms
      // back to none), so its rect is whatever that transition is holding right
      // now and the slot's rect is the same lie. `.hero__stage` is the visual's
      // containing block and is never transformed, so the visual's own scale
      // is the ratio of the two widths -- divide it out and the slot is back on
      // the coordinates CSS states for it, whenever this is asked.
      const heroBox = hero.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      const visualBox = visual.getBoundingClientRect();
      const slotBox = slot.getBoundingClientRect();
      const settling = visualBox.width / stageBox.width;
      const side = slotBox.width / settling;
      const cx = stageBox.left + (slotBox.left - visualBox.left) / settling + side / 2 - heroBox.left;
      const cy = stageBox.top + (slotBox.top - visualBox.top) / settling + side / 2 - heroBox.top;

      // `.hero__logo` is `inset: 0` on the hero, so the layer's box is the
      // hero's box -- and the same box LogoScene measures the mark against.
      const { width: w, height: h } = heroBox;
      const P = markPlacement;
      const size = Math.min(P.heightFraction * h, P.widthFraction * w); // LogoScene.layout()
      const drawn = side * MARK_IN_SLOT;
      const k = drawn / MARK_DRAWN_OVER_SIZE / size;
      hero.style.setProperty('--mark-k', String(k));
      hero.style.setProperty('--mark-tx', `${cx - k * P.cx * w}px`);
      hero.style.setProperty('--mark-ty', `${cy - k * P.cy * h}px`);
      // The static fallback is an <img> and is placed rather than scaled: see
      // Hero.css. Its centre and its drawn height, in the layer's own box.
      hero.style.setProperty('--mark-cx', `${cx}px`);
      hero.style.setProperty('--mark-cy', `${cy}px`);
      hero.style.setProperty('--mark-h', `${drawn}px`);
    };

    place();
    // BOTH boxes, and the slot is not the redundant one. The layer's height,
    // and with it the mark's place in it, is the hero's to report whenever the
    // viewport moves it. The slot's size comes from `--u`,
    // which is `100cqw` of `.sl4`, and container units are resolved from the
    // container's size at the last layout rather than the current one. Measured
    // at 1440: the first pass read a 1350px stage and a 274.2px slot in the
    // same frame -- a slot still sized against the 1334px column the page had
    // while it was reserving room for a scrollbar -- and the hero's own resize
    // fired while that lag was still in force, so watching the hero alone left
    // the mark 1.2% small for the life of the page. The slot's box settling is
    // its own event and this waits for it.
    const ro = new ResizeObserver(place);
    ro.observe(hero);
    ro.observe(slot);
    return () => ro.disconnect();
  }, [heroRef, stacked, markPlacement, index]);

  // Below STACKED the mark IS slide 1's visual and cannot also be slide 4's.
  const markOnSlot = !stacked && index === SLOT_SLIDE;
  const mark = (
    <HeroLogo
      hostRef={heroRef}
      variant="lined"
      placement={markPlacement}
      className={[
        'hero__logo',
        index === 0 || markOnSlot ? 'is-visible' : '',
        markOnSlot ? 'is-onSlot' : '',
        // The move is transitioned only when the mark was already on screen
        // when the slide changed -- which is to say, only when somebody could
        // see it move. Every other change to the transform happens at opacity
        // 0, where a jump is not a jump, and a 600ms glide into a slide that is
        // still arriving would be one more thing competing with its load-in.
        from === 0 || from === SLOT_SLIDE ? 'is-moving' : '',
      ].filter(Boolean).join(' ')}
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
      onFocus={(e) => setFocusHeld(holdsFocus(e.target))}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusHeld(false); }}
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
                <a {...ctaProps(s.link)} className="btn btn--primary hero__cta" tabIndex={i === index ? 0 : -1}><Roll>{s.cta}</Roll></a>
                {s.terms && <p className="hero__terms">{s.terms}</p>}
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
            paused={held}
            // The hero leaving or returning starts a fresh run above, so
            // the track has to start a fresh run with it. Without this it
            // resumed the elapsed time it had banked when the reader scrolled
            // away and filled to the end several seconds before the slide it
            // is describing actually changed.
            cycleKey={onScreen}
          />
          {/* The pause the carousel owes a reader (WCAG 2.2.2): it advances
              every 7s for as long as the page is open, and no longer stops for
              a resting cursor. Drawn in the pager's own vocabulary -- the
              arrows' circle, border, ink and 1.6 stroke -- and without their
              hover, since nothing new here moves under the pointer. The label
              names what a press will do, and swaps with it. Not rendered under
              reduced motion, where there is no rotation to stop. */}
          {reducedMotion ? null : (
            <button
              type="button"
              className="hero__play"
              aria-label={userPaused ? 'Play slide rotation' : 'Pause slide rotation'}
              onClick={() => setUserPaused((p) => !p)}
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                {userPaused
                  ? <path d="M5.5 3.6 L12 8 L5.5 12.4 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  : <path d="M6 3.5 V12.5 M10 3.5 V12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* "Familiar Trading. Better Infrastructure." — the section's load-in.
 *
 * The argument the band makes is "the app you already know, on better rails",
 * so the phone is the one object the section is about and everything else is
 * staged around its arrival.
 *
 * THE SEQUENCE (2.25s end to end). Times below are measured from the end of
 * the held lead-in beat, which every cue is offset by — see LEAD.
 *   0.00  The eyebrow, then the two-line heading 0.10s behind it: the label on
 *         the band, quiet and small, so the stage is named before anything
 *         fills it — and named at once, because it is the only thing in this
 *         section a reader can actually read.
 *   0.34  THE PHONE. The lead, alone, for three quarters of a beat: it rises
 *         140 design pixels from slightly small and decelerates into place on
 *         `expo.out`, so it reads as landing rather than fading up.
 *   1.10  The two market panels inside its screen — the French election and
 *         the BTC row — rise into the settled handset, which is the app doing
 *         its job rather than a screenshot appearing.
 *   1.15  The floating ECB and NVDA cards slide in from the left, towards the
 *         phone, 0.13s apart. They are the detail that makes the stage feel
 *         inhabited, so they travel further than the copy does.
 *   1.20  The two prediction cards settle in from the right, 0.13s apart and
 *         mirroring the pair on the left: the outer one first and travelling
 *         furthest, the inner one behind it and travelling less, so they do
 *         not read as one block sliding. The quietest arrivals on the stage.
 *   1.25  The right-hand copy and the Start Trading button, tightly staggered.
 *   1.38  The category pills across the bottom band, left to right.
 *
 * ON A PHONE the same beats are taken at 0.42 of the times above, with the
 * staggers inside them at 0.7 — see CUE and STEP — and the last two trade
 * places, because the things they move do: below 700px the category strip sits
 * between the handset and the copy rather than under everything, so it arrives
 * at 1.25 and the copy closes the section at 1.38. Measured on the built page
 * at 390, clock starting the frame the section crosses the viewport bottom:
 * first content 833ms and the last beat at 4684 before, 247 and 1631 after.
 * The ECB card is on this timeline at that width now, which it was not: the
 * mobile frame keeps it.
 *
 * WHAT CHANGED, AND WHY. This ran 4.0s after a third of a second of stillness,
 * and on a phone that meant 612ms before a word of it could be read and 4.05s
 * before the last chip stopped moving — measured at 390 wide from the frame the
 * section was scrolled into view. Every beat is still here, in the same order,
 * travelling the same distances in the same direction, on the same `expo.out`.
 * They simply overlap the way `expo.out` invites them to: it is 98% travelled
 * at 60% of its duration, so a beat that waits for the one before it to run its
 * full clock is waiting on nothing anybody can see. The held lead-in is halved
 * with them, for the reason recorded at LEAD.
 *
 * Distances are stated in the design's own 1920-wide pixels and scaled by the
 * stage's measured width, so the entrance is proportionally identical at every
 * breakpoint instead of travelling twice as far, relatively, on a laptop.
 *
 * Every tween is a `from`: the resting markup is the finished state, so a build
 * that never runs leaves the section simply present. Nothing overshoots and
 * nothing rotates; every ease here is `expo.out`.
 */
import { EASE, one, rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';

/**
 * One design pixel, in the CSS pixels this viewport actually renders it as.
 *
 * The stage does all its geometry in `--u`, and every distance below is stated
 * in the design's own pixels so the entrance is proportionally identical at
 * every width instead of travelling twice as far, relatively, on a laptop as on
 * a desktop. So the factor has to be `--u` itself.
 *
 * It cannot be read off `getComputedStyle`: `--u` is written in container query
 * units, so the property hands back the unresolved `calc(100cqw / 1920)` token
 * stream rather than a length. Nor can it be derived as width / 1920, because
 * under 1100px the stage re-bases itself to a 1400-wide design and that guess
 * is then 37% wrong. A probe sized in `--u` and measured makes the browser
 * resolve it, correctly at every breakpoint and with no knowledge here of what
 * the breakpoints are. It is appended, measured and removed inside one
 * synchronous block, before the timeline is built, so it cannot be seen.
 */
function unit(el: HTMLElement): number {
  const stage = one(el, '.fam__stage');
  if (!stage) return 0.75;

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;top:0;left:0;height:0;visibility:hidden;pointer-events:none;width:calc(1000 * var(--u))';
  stage.appendChild(probe);
  const u = probe.getBoundingClientRect().width / 1000;
  probe.remove();

  if (u > 0) return u;
  // The probe could not resolve -- no container support, a detached stage.
  // Fall back to the full-width design, which is right above 1100px.
  const w = stage.getBoundingClientRect().width;
  return w > 0 ? w / 1920 : 0.75;
}

/**
 * A held beat before the first element moves.
 *
 * The section is revealed and the timeline starts in the same frame, and that
 * frame is the most expensive one this band ever has: the observer fires, React
 * runs a layout effect, and the browser lays out and paints a full-bleed stage
 * with a phone, four cards and a blurred glow field that have never been
 * painted before. Anything scheduled at zero spends that window travelling
 * unseen.
 *
 * It was a third of a second, against a 588ms first paint measured on the dev
 * server at desktop width. Re-measured since, at both widths and on the same
 * harness as the timings above: the band drops `data-motion="pending"` 242 to
 * 367ms after the scroll at 390, and 311 to 777ms at 1600. So a third of a
 * second is most of a phone's whole reveal spent holding still on top of it,
 * and the eyebrow was not readable until 612ms.
 *
 * Halved. The remainder still covers the frame the reveal lands on, and the
 * beat it opens is short enough that being caught part-way through it on a
 * slow desktop paint costs a readable eyebrow rather than a finished one. That
 * is the right way round: the earlier fault was a sequence finishing unseen,
 * and nothing here can finish in 150ms.
 */
const LEAD = 0.15;

/**
 * Sections whose arrival has already been performed, start to finish, in this
 * page's life.
 *
 * `useSectionMotion` rebuilds whenever its effect re-runs, and that is right:
 * React mounts, tears down and mounts again inside a single frame, and the
 * first build is reverted before a paint, so refusing to rebuild would leave
 * the band settled and silent — the exact fault `lib/motion.ts` records against
 * an earlier version of the hook. But a rebuild can also arrive long after the
 * band has landed and been watched, with the section still on screen. Then the
 * observer refires immediately and the entrance performs itself a second time.
 *
 * Measured on the dev server: `Familiar.loop.ts` was saved at 14:28:50, vite
 * propagated the hot update to its importer `Familiar.tsx`, React re-mounted
 * the section on the same DOM node, and the trace recorded the teardown at
 * 7306ms and a second full build at 7624ms — two 131px phone landings in one
 * page view. Wiring the loop in is what put the loop's module on this
 * component's import path, which is why the double play appeared with it.
 *
 * So the two cases are told apart by whether the previous timeline actually
 * reached its end. The mark below is the last thing on the timeline, so a build
 * that is reverted mid-flight — StrictMode's, always — never sets it and the
 * next build plays in full. One that ran to completion does, and the next build
 * adds no tweens at all: the hook reveals the section, the empty timeline
 * completes, and the band is simply there, already landed, with the ambient
 * loop restarting over it.
 *
 * Keyed on the element, so a genuinely new section node performs its arrival
 * properly. Editing this file resets the set with the module, which is what you
 * want while working on the motion itself.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * THE PHONE SCHEDULE. The same treatment the footer, the bento, the steps, the
 * built band and the fan were given this morning, and for the complaint that
 * prompted all five: animation delaying the entry of content.
 *
 * Measured here before touching it, at 390 wide on the built page, clock
 * starting the frame the section's top crosses the viewport bottom: the
 * eyebrow was readable at 833ms and the last beat stopped at 4684ms; after,
 * 247 and 1631, over three runs each and stable to a few milliseconds. A band
 * this tall is most of three screens on a phone and is usually still moving
 * under the reader, so a beat cued at four and a half seconds is played to an
 * empty seat.
 *
 * TWO NUMBERS, because the two kinds of gap answer to different things. CUE
 * scales where a BEAT starts, which is the wait worth cutting because nothing
 * is happening during it. STEP scales the gap between things INSIDE one beat
 * and is barely cut at all: it is what makes the strip fill left to right
 * rather than switch on, and the six chips still arrive 42ms apart. Durations
 * are untouched, so the beats simply overlap more — which is what `expo.out`
 * invites anyway, being 98% travelled at 60% of its clock.
 *
 * The first beat does not move. LEAD is a fixed cost rather than a cue — it
 * buys back the expensive first frame, which is no cheaper on a phone — so it
 * is added after the scaling rather than scaled with it, and the eyebrow is
 * still the thing that arrives first and alone. First one object comes out,
 * the rest follow, closer together.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/**
 * The element, but only if this width actually draws it.
 *
 * Below 700px this band drops the NVDA card, and below 1100 it drops both
 * floating prediction cards — see the media blocks in `Familiar.css`. The ECB
 * card is NOT dropped any more: Figma frame `538:4601`, the section's mobile
 * artboard, keeps it alone and at full size, so on a phone it is drawn and
 * this helper hands it back and step 4 below animates it in.
 * `display: none` leaves the other two in the DOM, so every selector
 * here still finds them and every tween below would still be built, spending
 * its 1.15 seconds moving something with no box. That is not a visible bug,
 * which is exactly why it is worth refusing: a timeline whose cues are half
 * addressed to nothing is a timeline nobody can reason about, and the next
 * person to add a beat inherits the confusion.
 *
 * `offsetParent` is null for a `display: none` element and for every
 * descendant of one; the rect check catches the `position: fixed` case it
 * misses, which this section does not have but a copy of this helper might.
 */
function shown(el: HTMLElement | undefined): HTMLElement | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : undefined;
}

export function buildFamiliar({ el, q, tl }: SectionMotion) {
  // Already landed once and still on screen: settle, do not re-perform. The
  // hook reveals the section either way, and an empty timeline completes on the
  // next tick, so the loop is handed the band exactly as it would have been.
  if (LANDED.has(el)) return;

  const u = unit(el);
  /** Design pixels, in the CSS pixels this viewport renders them as. */
  const d = (n: number) => n * u;

  /* Asked here rather than read at module scope: a module-scope `matchMedia`
     is answered once, when the bundle is parsed, and never again — so a
     rotation or a resize would keep whichever schedule the page happened to
     load under. `useSectionMotion` rebuilds this band on a theme switch and
     React rebuilds it on a remount; both come back through this line. */
  const tight = typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;
  const cue = (t: number) => LEAD + (tight ? (t - LEAD) * CUE : t - LEAD);
  const step = (t: number) => (tight ? t * STEP : t);

  /* THE LAST TWO BEATS TRADE PLACES ON A PHONE, because the two things they
     move do. On the stage the category strip runs along the bottom of the
     band, under everything, and closes it out; in the column the frame draws
     the strip BETWEEN the handset and the copy, so the copy is what closes the
     section and the strip arrives before it. A band whose last beat lands
     above its second-to-last reads as something arriving out of order. */
  const CHIPS_AT = tight ? LEAD + 1.25 : LEAD + 1.38;
  const COPY_AT = tight ? LEAD + 1.38 : LEAD + 1.25;
  const CTA_AT = tight ? LEAD + 1.58 : LEAD + 1.45;

  const phone = shown(q('.fam__phone')[0]);
  const ecb = shown(q('.fam__mkt--ecb')[0]);
  const nvda = shown(q('.fam__mkt--nvda')[0]);
  // Both floating prediction cards, outermost first — see step 5.
  const predOuter = shown(q('.fam__pred--b')[0]);
  const predInner = shown(q('.fam__pred--a')[0]);

  /* 1 — the band names itself. */
  rise(tl, q('.fam__copy--left .eyebrow'), cue(LEAD), { y: d(44), duration: 0.6, clearProps: 'transform,opacity' });
  rise(tl, q('.fam__title'), cue(LEAD + 0.1), { y: d(52), duration: 0.75, clearProps: 'transform,opacity' });

  /* 2 — the lead. Origin low on the handset so the small amount of scale reads
     as it settling onto the stage rather than growing out of its own middle. */
  if (phone) {
    tl.from(phone, {
      y: d(140),
      scale: 0.94,
      opacity: 0,
      duration: 1.25,
      ease: EASE,
      transformOrigin: '50% 72%',
      clearProps: 'transform,opacity',
    }, cue(LEAD + 0.34));

    /* 3 — the app fills in, once the handset has stopped moving. `expo.out` is
       98% travelled at 60% of its duration, so 1.10s catches the phone with
       under three design pixels of its 140 left to go — landed, for any eye
       and for the pixel diff both. */
    rise(tl, Array.from(phone.querySelectorAll<HTMLElement>('.fam__event')), cue(LEAD + 1.1), {
      y: d(28),
      duration: 0.7,
      stagger: step(0.12),
      clearProps: 'transform,opacity',
    });
  }

  /* 4 — the floating cards come in from the left, towards the phone. Different
     vectors so the pair does not read as one block sliding. */
  if (ecb) {
    tl.from(ecb, { x: d(-110), y: d(40), opacity: 0, duration: 0.85, ease: EASE, clearProps: 'transform,opacity' }, cue(LEAD + 1.15));
  }
  if (nvda) {
    tl.from(nvda, { x: d(-82), y: d(64), opacity: 0, duration: 0.85, ease: EASE, clearProps: 'transform,opacity' }, cue(LEAD + 1.28));
  }

  /* 5 — the two prediction cards, in from the right, towards the phone. The
     exact mirror of step 4: outermost first and travelling furthest, the inner
     one 0.17s behind it on a shorter vector, so the pair arrives as two cards
     rather than one block sliding.

     The distances and the ease are the ones this step already used — d(90) /
     d(34) on `expo.out` was the single prediction card's vector and is now the
     outer card's, d(62) / d(26) was the ghosts' and is now the inner card's.
     Both are 0.85s, and both land inside the 1.20 – 1.33 window the sequence
     note describes.
     `from` tweens, like everything else in this file: the resting markup is
     the finished state. */
  if (predOuter) {
    tl.from(predOuter, { x: d(90), y: d(34), opacity: 0, duration: 0.85, ease: EASE, clearProps: 'transform,opacity' }, cue(LEAD + 1.2));
  }
  if (predInner) {
    tl.from(predInner, { x: d(62), y: d(26), opacity: 0, duration: 0.85, ease: EASE, clearProps: 'transform,opacity' }, cue(LEAD + 1.33));
  }

  /* 6 — the claim, then its button. */
  rise(tl, q('.fam__sub-title, .fam__sub-body'), cue(COPY_AT), {
    y: d(48),
    duration: 0.7,
    stagger: step(0.13),
    clearProps: 'transform,opacity',
  });

  /* The button states both of its ends, which the rest of this file does not
     have to. `.btn` carries `transition: transform 160ms` for its `:active`
     press, and that transition outlives a teardown: when the context reverts,
     the inline transform is dropped but the *computed* one is still 160ms from
     home. A `from` tween built in that window reads the stale 36px as the value
     to finish on, animates 36 to 36, reports complete and leaves the button
     sitting a line below its own copy forever. Measured, on the timings this
     file carried then: `translate(0px, 36px)` held from 2.27s to 3.58s with
     the tween running. It is the same fault
     `pop()` in lib/motion.ts was written to describe, and it bites here for the
     same reason — React mounts, tears down and mounts again inside one frame.
     Stated ends cannot be poisoned by whatever the element currently reads as. */
  const cta = q('.fam__cta')[0];
  if (cta) {
    tl.fromTo(cta,
      { y: d(48), opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, ease: EASE, clearProps: 'transform,opacity' },
      cue(CTA_AT));
  }

  /* 7 — the category strip closes the band out, left to right. */
  rise(tl, q('.fam__chips > *'), cue(CHIPS_AT), { y: d(40), duration: 0.55, stagger: step(0.06), clearProps: 'transform,opacity' });

  // Last on the timeline, so it is only reached if the arrival was actually
  // performed. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}

/* Ambient loop -----------------------------------------------------------------
 * Deliberately empty here. The band's continuing motion lives in
 * `Familiar.loop.ts` and is wired in as the `idle` option on `useSectionMotion`
 * — it is handed the section element once this entrance has finished and
 * returns its own teardown. Nothing in this file loops. */

/* "Familiar Trading. Better Infrastructure." — the section's load-in.
 *
 * The argument the band makes is "the app you already know, on better rails",
 * so the phone is the one object the section is about and everything else is
 * staged around its arrival.
 *
 * THE SEQUENCE (4.0s end to end). Times below are measured from the end of the
 * held lead-in beat, which every cue is offset by — see LEAD.
 *   0.00  The eyebrow, then the two-line heading: the label on the band, quiet
 *         and small, so the stage is named before anything fills it.
 *   0.70  THE PHONE. The lead, alone, for a beat and a half: it rises 140
 *         design pixels from slightly small and decelerates into place on
 *         `expo.out`, so it reads as landing rather than fading up.
 *   1.80  The two market panels inside its screen — the French election and
 *         the BTC row — rise into the settled handset, which is the app doing
 *         its job rather than a screenshot appearing.
 *   2.05  The floating ECB and NVDA cards slide in from the left, towards the
 *         phone, 0.17s apart. They are the detail that makes the stage feel
 *         inhabited, so they travel further than the copy does.
 *   2.15  The blurred ghost cards and the prediction card settle in from the
 *         right, the quietest arrivals on the stage — context, not accent.
 *   2.40  The right-hand copy and the Start Trading button, tightly staggered.
 *   2.65  The category pills across the bottom band, left to right.
 *
 * Distances are stated in the design's own 1920-wide pixels and scaled by the
 * stage's measured width, so the entrance is proportionally identical at every
 * breakpoint instead of travelling twice as far, relatively, on a laptop.
 *
 * Every tween is a `from`: the resting markup is the finished state, so a build
 * that never runs leaves the section simply present. Nothing overshoots and
 * nothing rotates; the only eases here are `expo.out` and `power3.out`.
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
 * painted before. Measured on the dev server, 588ms passed between the scroll
 * and the first frame the page actually put on screen. Anything scheduled at
 * zero spends that window travelling unseen: the eyebrow was 71% faded in and
 * had 9 of its 33 pixels left by the time anyone could see it. The lead-in
 * costs a third of a second of stillness and buys the opening beat back.
 */
const LEAD = 0.34;

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

export function buildFamiliar({ el, q, tl }: SectionMotion) {
  // Already landed once and still on screen: settle, do not re-perform. The
  // hook reveals the section either way, and an empty timeline completes on the
  // next tick, so the loop is handed the band exactly as it would have been.
  if (LANDED.has(el)) return;

  const u = unit(el);
  /** Design pixels, in the CSS pixels this viewport renders them as. */
  const d = (n: number) => n * u;

  const phone = q('.fam__phone')[0];
  const ecb = q('.fam__mkt--ecb')[0];
  const nvda = q('.fam__mkt--nvda')[0];
  const ghosts = q('.fam__ghost');
  const pred = q('.fam__pred')[0];

  /* 1 — the band names itself. */
  rise(tl, q('.fam__copy--left .eyebrow'), LEAD, { y: d(44), duration: 0.9, clearProps: 'transform,opacity' });
  rise(tl, q('.fam__title'), LEAD + 0.16, { y: d(52), duration: 1.1, clearProps: 'transform,opacity' });

  /* 2 — the lead. Origin low on the handset so the small amount of scale reads
     as it settling onto the stage rather than growing out of its own middle. */
  if (phone) {
    tl.from(phone, {
      y: d(140),
      scale: 0.94,
      opacity: 0,
      duration: 1.5,
      ease: EASE,
      transformOrigin: '50% 72%',
      clearProps: 'transform,opacity',
    }, LEAD + 0.7);

    /* 3 — the app fills in, once the handset has stopped moving. `expo.out` is
       99% travelled at 70% of its duration, so 1.8s is after the landing, not
       during it. */
    rise(tl, Array.from(phone.querySelectorAll<HTMLElement>('.fam__event')), LEAD + 1.8, {
      y: d(28),
      duration: 0.9,
      stagger: 0.18,
      clearProps: 'transform,opacity',
    });
  }

  /* 4 — the floating cards come in from the left, towards the phone. Different
     vectors so the pair does not read as one block sliding. */
  if (ecb) {
    tl.from(ecb, { x: d(-110), y: d(40), opacity: 0, duration: 1.15, ease: EASE, clearProps: 'transform,opacity' }, LEAD + 2.05);
  }
  if (nvda) {
    tl.from(nvda, { x: d(-82), y: d(64), opacity: 0, duration: 1.15, ease: EASE, clearProps: 'transform,opacity' }, LEAD + 2.22);
  }

  /* 5 — context behind the right-hand copy: furthest back, so smallest moves
     and the softest ease. The ghosts keep their 0.4 resting opacity because a
     `from` tween ends wherever the element already is; `clearProps` hands the
     settled value back to the stylesheet either way. */
  ghosts.forEach((g, i) => {
    tl.from(g, { x: d(62), y: d(26), opacity: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity' }, LEAD + 2.15 + i * 0.1);
  });
  if (pred) {
    tl.from(pred, { x: d(90), y: d(34), opacity: 0, duration: 1.1, ease: EASE, clearProps: 'transform,opacity' }, LEAD + 2.35);
  }

  /* 6 — the claim, then its button. */
  rise(tl, q('.fam__sub-title, .fam__sub-body'), LEAD + 2.4, {
    y: d(48),
    duration: 0.95,
    stagger: 0.16,
    clearProps: 'transform,opacity',
  });

  /* The button states both of its ends, which the rest of this file does not
     have to. `.btn` carries `transition: transform 160ms` for its `:active`
     press, and that transition outlives a teardown: when the context reverts,
     the inline transform is dropped but the *computed* one is still 160ms from
     home. A `from` tween built in that window reads the stale 36px as the value
     to finish on, animates 36 to 36, reports complete and leaves the button
     sitting a line below its own copy forever. Measured: `translate(0px, 36px)`
     held from 2.27s to 3.58s with the tween running. It is the same fault
     `pop()` in lib/motion.ts was written to describe, and it bites here for the
     same reason — React mounts, tears down and mounts again inside one frame.
     Stated ends cannot be poisoned by whatever the element currently reads as. */
  const cta = q('.fam__cta')[0];
  if (cta) {
    tl.fromTo(cta,
      { y: d(48), opacity: 0 },
      { y: 0, opacity: 1, duration: 0.95, ease: EASE, clearProps: 'transform,opacity' },
      LEAD + 2.72);
  }

  /* 7 — the category strip closes the band out, left to right. */
  rise(tl, q('.fam__chips > *'), LEAD + 2.65, { y: d(40), duration: 0.8, stagger: 0.08, clearProps: 'transform,opacity' });

  // Last on the timeline, so it is only reached if the arrival was actually
  // performed. A reverted build never gets here. See LANDED.
  tl.call(() => { LANDED.add(el); });
}

/* Ambient loop -----------------------------------------------------------------
 * Deliberately empty here. The band's continuing motion lives in
 * `Familiar.loop.ts` and is wired in as the `idle` option on `useSectionMotion`
 * — it is handed the section element once this entrance has finished and
 * returns its own teardown. Nothing in this file loops. */

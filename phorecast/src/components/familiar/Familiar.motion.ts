/* "Familiar Trading. Better Infrastructure." — the section's load-in.
 *
 * The argument the band makes is "the app you already know, on better rails",
 * so the phone is the one object the section is about and everything else is
 * staged around its arrival.
 *
 * THE SEQUENCE (3.9s end to end)
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

/** The stage is authored at 1920 wide; `--u` is one of its pixels. */
const DESIGN_W = 1920;

/**
 * Design pixels to CSS pixels for the stage as it is actually laid out.
 *
 * `--u` itself cannot be read back — it is written in container query units and
 * `getComputedStyle` hands back the unresolved `calc(100cqw / 1920)` token
 * stream — so the factor is measured off the stage's own box. Clamped at the
 * bottom so a narrow viewport still gets travel a person can see, and at the
 * top so an ultra-wide one does not fling the cards across the screen.
 */
function unit(el: HTMLElement): number {
  const stage = one(el, '.fam__stage');
  const w = stage?.getBoundingClientRect().width ?? 0;
  const k = w > 0 ? w / DESIGN_W : 0.75;
  return Math.min(1.1, Math.max(0.62, k));
}

export function buildFamiliar({ el, q, tl }: SectionMotion) {
  const u = unit(el);
  /** Design pixels, in the CSS pixels this viewport renders them as. */
  const d = (n: number) => n * u;

  const phone = q('.fam__phone')[0];
  const ecb = q('.fam__mkt--ecb')[0];
  const nvda = q('.fam__mkt--nvda')[0];
  const ghosts = q('.fam__ghost');
  const pred = q('.fam__pred')[0];

  /* 1 — the band names itself. */
  rise(tl, q('.fam__copy--left .eyebrow'), 0, { y: d(44), duration: 0.9, clearProps: 'transform,opacity' });
  rise(tl, q('.fam__title'), 0.16, { y: d(52), duration: 1.1, clearProps: 'transform,opacity' });

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
    }, 0.7);

    /* 3 — the app fills in, once the handset has stopped moving. `expo.out` is
       99% travelled at 70% of its duration, so 1.8s is after the landing, not
       during it. */
    rise(tl, Array.from(phone.querySelectorAll<HTMLElement>('.fam__event')), 1.8, {
      y: d(28),
      duration: 0.9,
      stagger: 0.18,
      clearProps: 'transform,opacity',
    });
  }

  /* 4 — the floating cards come in from the left, towards the phone. Different
     vectors so the pair does not read as one block sliding. */
  if (ecb) {
    tl.from(ecb, { x: d(-110), y: d(40), opacity: 0, duration: 1.15, ease: EASE, clearProps: 'transform,opacity' }, 2.05);
  }
  if (nvda) {
    tl.from(nvda, { x: d(-82), y: d(64), opacity: 0, duration: 1.15, ease: EASE, clearProps: 'transform,opacity' }, 2.22);
  }

  /* 5 — context behind the right-hand copy: furthest back, so smallest moves
     and the softest ease. The ghosts keep their 0.4 resting opacity because a
     `from` tween ends wherever the element already is; `clearProps` hands the
     settled value back to the stylesheet either way. */
  ghosts.forEach((g, i) => {
    tl.from(g, { x: d(62), y: d(26), opacity: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity' }, 2.15 + i * 0.1);
  });
  if (pred) {
    tl.from(pred, { x: d(90), y: d(34), opacity: 0, duration: 1.1, ease: EASE, clearProps: 'transform,opacity' }, 2.35);
  }

  /* 6 — the claim, then its button. */
  rise(tl, q('.fam__sub-title, .fam__sub-body'), 2.4, {
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
      2.72);
  }

  /* 7 — the category strip closes the band out, left to right. */
  rise(tl, q('.fam__chips > *'), 2.65, { y: d(40), duration: 0.8, stagger: 0.08, clearProps: 'transform,opacity' });
}

/* Ambient loop -----------------------------------------------------------------
 * Deliberately empty here. The band's continuing motion lives in
 * `Familiar.loop.ts` and is wired in as the `idle` option on `useSectionMotion`
 * — it is handed the section element once this entrance has finished and
 * returns its own teardown. Nothing in this file loops. */

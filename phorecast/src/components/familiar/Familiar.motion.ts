/* "Every Outcome. One Place." The section's load-in.
 *
 * The phone is the object the section is about, so everything else is staged
 * around its arrival.
 *
 * THE SEQUENCE (about 2.25s). Times are measured from the end of LEAD.
 *   0.00  The eyebrow, then the heading 0.10s behind it, so the stage is named
 *         before anything fills it.
 *   0.34  THE PHONE, alone: it rises 140 design pixels from slightly small and
 *         decelerates on `expo.out`, so it reads as landing rather than fading.
 *   1.10  The two market panels inside its screen rise into the settled handset.
 *   1.15  The ECB and NVDA cards slide in from the left, 0.13s apart.
 *   1.20  The two prediction cards settle in from the right, 0.13s apart,
 *         mirroring the left pair: outer card first and travelling furthest.
 *   1.25  The right-hand copy, then the Explore Markets button.
 *   1.38  The category pills across the bottom band, left to right.
 *
 * On a phone the beats start at 0.42 of these times and the staggers inside
 * them run at 0.7 (see CUE and STEP). The last two beats trade places, because
 * below 700px the category strip sits between the handset and the copy.
 *
 * Beats overlap on purpose: `expo.out` is 98% travelled at 60% of its duration,
 * so waiting for a beat's full clock is waiting on nothing visible.
 *
 * Distances are in the design's own pixels and scaled by `--u`, so the
 * entrance is proportionally identical at every breakpoint.
 *
 * Every tween is a `from`: the resting markup is the finished state, so a build
 * that never runs leaves the section simply present. Nothing overshoots or
 * rotates; every ease is `expo.out`.
 */
import { EASE, one, rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';

/**
 * One design pixel, in CSS pixels at this viewport: `--u` itself.
 *
 * `getComputedStyle` cannot resolve it (it is written in container query units
 * and comes back as an unresolved `calc(100cqw / 1920)`), and width / 1920 is
 * wrong under 1100px, where the stage re-bases to a 1400-wide design. A probe
 * sized in `--u` is measured instead, correct at every breakpoint. It is
 * appended, measured and removed in one synchronous block, so it is never seen.
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
 * The reveal and the timeline start in the same frame, which is the most
 * expensive frame this band has (layout and first paint of the stage, phone,
 * cards and blurred glow). Anything scheduled at zero would travel unseen.
 * Kept short so a phone's reveal is not spent holding still.
 */
const LEAD = 0.15;

/**
 * Sections whose arrival has already been performed in this page's life.
 *
 * `useSectionMotion` rebuilds whenever its effect re-runs. Under StrictMode the
 * first build is reverted before a paint, so rebuilding must stay allowed. But a
 * rebuild can also arrive after the band has landed with the section still on
 * screen (for example a hot update to `Familiar.loop.ts`, which is on this
 * component's import path), and the entrance would play a second time.
 *
 * The mark below is the last thing on the timeline, so only a build that ran to
 * completion sets it. A reverted build never does and the next one plays in
 * full; after a completed one the next build adds no tweens and the band is
 * simply there, with the ambient loop restarting over it.
 *
 * Keyed on the element, so a new section node performs its arrival properly.
 */
const LANDED = new WeakSet<HTMLElement>();

/**
 * The phone schedule.
 *
 * The band is most of three screens tall on a phone and usually still moving
 * under the reader, so late beats play to nobody. Two factors:
 *
 * - CUE scales where a BEAT starts, the wait worth cutting.
 * - STEP scales the gaps INSIDE a beat and is barely cut: it is what makes the
 *   strip fill left to right rather than switch on (six chips, 42ms apart).
 *
 * Durations are unchanged, so beats simply overlap more. LEAD is a fixed cost
 * (the expensive first frame is no cheaper on a phone), so it is added after
 * the scaling rather than scaled with it.
 */
const PHONE = '(max-width: 700px)';
const CUE = 0.42;
const STEP = 0.7;

/**
 * The element, but only if this width actually draws it.
 *
 * Below 700px the band drops the NVDA card, and below 1100 both prediction
 * cards (see the media blocks in `Familiar.css`). The ECB card is kept at every
 * width, as in the mobile Figma frame `538:4601`. `display: none` leaves the
 * others in the DOM, so without this check their tweens would still be built,
 * animating boxes that do not exist.
 *
 * A zero-size rect covers a `display: none` element and all its descendants.
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

  /* Asked here rather than at module scope: a module-scope `matchMedia` is
     answered once, so a rotation or resize would keep the schedule the page
     loaded under. Theme switches and remounts both rebuild through here. */
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

    /* 3 — the app fills in once the handset has landed. At 1.10s the phone
       has under three design pixels of its 140 left to travel. */
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
     mirror of step 4: outer card first on the longer vector, inner card 0.13s
     behind on a shorter one, so the pair reads as two cards rather than one
     block sliding. */
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

  /* The button states both ends, unlike the rest of this file. `.btn` has
     `transition: transform 160ms` for its `:active` press, and it outlives a
     teardown: after a revert the computed transform is still easing home, and
     a `from` tween built in that window reads the stale value as its end and
     leaves the button offset. StrictMode's mount, teardown, mount inside one
     frame triggers it. Same fault as `pop()` in lib/motion.ts. */
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

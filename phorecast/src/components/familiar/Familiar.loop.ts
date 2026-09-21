/**
 * "Familiar Trading. Better Infrastructure." — the ambient loop.
 *
 * The section's load-in belongs to `Familiar.motion.ts`. This file owns what
 * happens *after* it has landed, and it owns nothing else: it reads the markup
 * the component already ships, writes text, colour and transform into it, and
 * puts every one of them back on teardown.
 *
 * THE STORY — three acts, 13.5s, then 3.6s of nothing
 * --------------------------------------------------
 * A live screen doing its job, in the order it would really do it.
 *
 * I. THE BOOK MOVES (0.0 – 3.4s)
 *   NVDA prints twice, $218.36 -> $218.31 -> $218.29, the card lighting under
 *   each print and the day following to -2.40%. (NVDA is not drawn below
 *   700px; the ECB card beside it is, and the rest of this act runs there.)
 *   The same refresh reaches the ECB card, whose policy rate is honestly
 *   unmoved, so only the card and its chip acknowledge it. In the phone, the French election re-sorts: Cazeneuve
 *   counts 55% -> 57%, crosses Hollande — the two rows physically exchange
 *   places — and the Yes chip on the row that gained brightens.
 *
 * II. THE ROUND IS ENDING (3.3 – 7.9s)
 *   The feed switches to Ending Soon. The tab moves, the filter glints, and the
 *   two market cards trade places: the 5-minute BTC round climbs 242px over the
 *   French election, which will not resolve for seven months. With BTC at the
 *   top its ring advances 63% -> 66%, the two floating prediction cards each
 *   take a trade, 0.25s apart, and a category is tapped in the filter row while
 *   the live dots at either end light.
 *
 * III. BACK TO DEFAULT (7.9 – 9.9s)
 *   All events again, and the feed returns. Every frame of the rest window is
 *   the design exactly.
 *
 * The next cycle plays the figures backwards — Cazeneuve gives second place
 * back, NVDA prints up to where it started, the ring returns to 63% — so after
 * two cycles every number on the screen is the one in the Figma frame. Nothing
 * drifts, and nothing structural is ever left displaced: the sort is undone
 * inside the cycle that made it.
 *
 * The one thing that never rests is the 5-minute round's clock, which ticks a
 * second at a time while the section is on screen and restarts at 5:00 when it
 * runs out. A countdown that freezes is a screenshot.
 *
 * Nothing here floats, breathes, drifts, overshoots, rotates, or reacts to the
 * pointer. Reduced motion runs none of it.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../lib/motion';
import { tok } from '../../lib/theme';
import type { Timeline } from '../../lib/motion';

/** One full cycle: 9.9s of story, 3.6s of stillness. */
const PERIOD = 13.5;
/** How long after the entrance lands before the first beat. */
const SETTLE = 1.2;

/**
 * Every colour and every lift this loop writes, read off the document.
 *
 * It is called from `start()`, next to the `getComputedStyle` rest reads that
 * were already there, and never at module scope — a theme change rebuilds the
 * section, so this re-runs and the loop cools to the palette that is actually
 * on the page. The fallbacks are the values the file shipped with, so a
 * missing property yields today's dark colour rather than nothing.
 *
 * Read the two halves against `Familiar.css`. The `--fam-app-*` half is the
 * handset, which is a dark app in both themes and therefore has no light
 * value at all: "lit means brighter" is still true inside it, and those beats
 * are untouched. The rest is page chrome, and every one of those DOES flip —
 * the two white-alphas invert direction for free by becoming ink-alpha, and
 * the two brightness pairs and the tick colours are turned around by hand.
 */
const palette = () => ({
  /* The NVDA card's print. On the page, so it is --pos / --neg. */
  tickUp: tok('--fam-tick-up', '#00c950'),
  tickDown: tok('--fam-tick-down', '#e7000b'),
  /* The same two figures on the leaderboard INSIDE the phone. Identical in
     dark, and deliberately still identical in light. */
  appUp: tok('--fam-app-up', '#00c950'),
  appDown: tok('--fam-app-down', '#e7000b'),
  /* The odds chips the re-sort lights, on the handset's leaderboard. */
  chipYesLit: tok('--fam-app-yes-lit', '#17482e'),
  chipNoLit: tok('--fam-app-no-lit', '#4a1f23'),
  /* The same beat on the two floating prediction cards. Their plates rest at a
     different colour from the handset's (#1a3a2c against #10281d — the file
     draws the card and the phone differently), so the lit value is its own
     token rather than the chip's; both are the same 1.49x step in relative
     luminance, so the acknowledgement is the same size on both objects. */
  predYesLit: tok('--fam-app-pred-yes-lit', '#21583c'),
  /* The ECB card's footer plate. Lit is LIGHTER than rest on a dark page and
     has to be DARKER than rest on paper; both are "the plate acknowledged it". */
  footLit: tok('--fam-foot-lit', '#242422'),
  /* The glass under a print. White-alpha in dark, ink-alpha in light: more
     alpha is brighter on black and darker on cream, and both mean "lit". */
  cardBgLit: tok('--fam-card-lit-bg', 'rgba(255, 255, 255, 0.11)'),
  cardEdgeLit: tok('--fam-card-lit-line', 'rgba(255, 255, 255, 0.34)'),
  /* The tapped category pill: the brand red, and the label that rides it. */
  pillOnBg: tok('--accent', '#e5331e'),
  pillOnFg: tok('--on-accent', '#fffbf8'),
  /* Lifts, as matched pairs — GSAP interpolates `filter` structurally, so
     both ends must list the same functions. The two that meet the paper
     (the eyebrow dot, the strip's live dots) turn around in light; the two
     inside the handset (the ring, the filter glyph) do not. */
  liftRest: tok('--fam-lift-rest', 'brightness(1)'),
  liftEyebrow: tok('--fam-lift-eyebrow', 'brightness(1.75)'),
  liftDot: tok('--fam-lift-dot', 'brightness(1.6)'),
  ringLit: tok('--fam-app-ring-lit', 'brightness(1.55)'),
  filterLit: tok('--fam-app-filter-lit', 'brightness(1.9)'),
});

/** A pulse that leaves nothing behind: out, then back to the value it started
 *  from, so the loop's resting frame is the design. */
function pulse(tl: Timeline, target: gsap.TweenTarget, at: number, out: gsap.TweenVars, back: gsap.TweenVars, up = 0.35, down = 0.8) {
  tl.to(target, { ...out, duration: up, ease: 'sine.out' }, at)
    .to(target, { ...back, duration: down, ease: 'sine.inOut' }, at + up);
}

/** The last non-empty text node inside `el` — the NVDA footer's `-2.37%` sits
 *  beside an `<img>` with no element of its own to hold it. */
function lastText(el: HTMLElement | null): Text | null {
  if (!el) return null;
  for (let i = el.childNodes.length - 1; i >= 0; i -= 1) {
    const n = el.childNodes[i];
    if (n.nodeType === Node.TEXT_NODE && (n.nodeValue ?? '').trim()) return n as Text;
  }
  return null;
}

const num = (s: string | null | undefined) => {
  const m = /-?\d+(?:[.,]\d+)?/.exec((s ?? '').replace(',', '.'));
  return m ? Number.parseFloat(m[0]) : NaN;
};

const clock = (total: number) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

export function familiarLoop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  /**
   * `q` and `qa`, but only what this width actually draws.
   *
   * Below 700px the band drops the NVDA card, and below 1100 both floating
   * prediction cards — see the media blocks in `Familiar.css`. They stay in
   * the DOM, so an unfiltered selector still finds them and the loop would
   * spend a third of its cycle printing prices onto `display: none` boxes,
   * reading resting colours off them, and holding their text for a teardown
   * that has nothing to put back.
   *
   * WHAT EACH ACT HAS TO WORK WITH ON A PHONE, now that Figma frame 538:4601
   * has put the ECB card back at that width:
   *
   *   I.   The refresh lights the ECB card and its policy-rate plate, the
   *        section's own live dot answers it, and the leaderboard inside the
   *        handset re-sorts. Only NVDA's two prints are missing, and they are
   *        the one beat that has no card to print onto.
   *   II.  Entirely inside the handset and the strip — the tab switch, the
   *        filter glint, the two feed cards trading places, the 5-minute
   *        round's ring — plus the live dots at either end of the strip. The
   *        two floating prediction cards' trades are the only part that does
   *        not run, and they have not been drawn here since 1100.
   *   III. The feed returns. Nothing in it is width-dependent.
   *
   * So every act still has a subject, and Act I has a card again.
   */
  const box = (el: HTMLElement | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? el : null;
  };
  const q = (sel: string) => box(root.querySelector<HTMLElement>(sel));
  const qa = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((e) => box(e));

  /* ------------------------------------------------------------- handles
     Every one of these is optional and separately guarded. A sibling agent is
     still editing this section's markup; a hook that moves costs its own beat
     and nothing else. */
  const nvdaCard = q('.fam__mkt--nvda');
  const nvdaValue = q('.fam__mkt--nvda .fam__mkt-value');
  const nvdaPct = lastText(q('.fam__mkt--nvda .fam__mkt-foot'));
  const ecbCard = q('.fam__mkt--ecb');
  const ecbFoot = q('.fam__mkt--ecb .fam__mkt-foot');

  const events = qa('.fam__event');
  const feedA = events[0] ?? null;                                   // French election, 7 months out
  const feedB = events.find((e) => e.classList.contains('fam__event--btc')) ?? null; // BTC, 3 minutes out
  const rows = qa('.fam__event:not(.fam__event--btc) .fam__rows li');
  const gauge = q('.fam__gauge');
  const filterIcon = q('.fam__filter');
  const tabAll = q('.fam__tabs .is-active');
  // Anchored, because `/ending/` also matches "Tr-ending" — which is styled
  // white already, so the tab switch silently tweened white to white.
  const tabSoon = qa('.fam__tabs span').find((s) => /^ending\s/i.test((s.textContent ?? '').trim())) ?? null;
  const btcMeta = q('.fam__event--btc .fam__event-meta');
  const timer = btcMeta
    ? Array.from(btcMeta.querySelectorAll('span'))
        .find((s) => /^\d{1,2}:\d{2}$/.test((s.textContent ?? '').trim())) ?? null
    : null;

  const pills = qa('.fam__chips .fam__chip-pill');
  const dots = qa('.fam__chip-dot');
  const eyebrowDot = q('.fam__copy--left .eyebrow__dot');
  /* THE TWO FLOATING PREDICTION CARDS, as a list rather than a pair of single
     handles. There was one card here and two blurred bitmap stand-ins beside
     it; the re-export replaced the lot with two real cards, and a `q()` that
     takes the first match would have animated one of them and left its
     neighbour sitting still — which is the specific way a beat half-covers new
     markup and nobody notices. Everything below is per-card. */
  const preds = qa('.fam__pred').map((card) => {
    const label = card.querySelector<HTMLElement>('.fam__pred-bar span');
    const text = label?.textContent ?? '';
    // The two cards print their odds differently — "95,70%" and "27%" — and a
    // tween that rounded both to two places would leave the second sitting at
    // "27.00%" for the rest of the page's life. So each card keeps the
    // separator and the number of decimals the design gave it, and the step is
    // sized to be visible at that precision: 0.2 of a point where there are
    // decimals to show it, a whole point where there are not.
    const dp = /[.,](\d+)%?\s*$/.exec(text)?.[1].length ?? 0;
    // The volume figure, "$112.5K Vol" and "$95.8K Vol": split so the number
    // can move and everything around it — currency, magnitude, the word — is
    // put back untouched.
    const vol = card.querySelector<HTMLElement>('.fam__pred-meta span');
    const volText = vol?.textContent ?? '';
    const volParts = /^(\D*)([\d.]+)(.*)$/.exec(volText);
    const volDp = volParts?.[2].split('.')[1]?.length ?? 0;
    // The bar's green run, as the stylesheet's own inline percentage. The first
    // card's is the whole track, so it has nowhere to advance to and is left
    // alone; the second's is a quarter full and follows its figure.
    const fill = card.querySelector<HTMLElement>('.fam__pred-bar i');
    const fill0 = Number.parseFloat(fill?.style.width ?? '') || 0;
    return {
      label,
      yes: card.querySelector<HTMLElement>('.fam__pred-btns .is-yes'),
      from: num(text),
      dp,
      step: dp > 0 ? 0.2 : 1,
      comma: text.includes(','),
      vol,
      volPre: volParts?.[1] ?? '',
      volPost: volParts?.[3] ?? '',
      vol0: volParts ? Number.parseFloat(volParts[2]) : NaN,
      volDp,
      volStep: volDp > 0 ? 0.1 : 1,
      fill: fill0 > 0 && fill0 < 99.5 ? fill : null,
      fill0,
    };
  });

  const rowPct = (i: number) => rows[i]?.querySelector<HTMLElement>('.fam__row-pct') ?? null;
  const rowName = (i: number) => rows[i]?.querySelector<HTMLElement>('.fam__row-name') ?? null;
  const canSort = rows.length >= 3 && !!rowPct(1) && !!rowPct(2) && !!rowName(1) && !!rowName(2);
  const canResort = !!feedA && !!feedB && feedA !== feedB;

  /* Everything this loop writes into, and what it said before it did. */
  const held: Array<[Text | HTMLElement, string]> = [];
  const hold = (t: Text | HTMLElement | null) => {
    if (!t) return;
    held.push([t, (t instanceof Text ? t.nodeValue : t.textContent) ?? '']);
  };

  let ctx: gsap.Context | undefined;
  let driver: gsap.core.Timeline | undefined;
  let story: gsap.core.Timeline | undefined;
  let tick = 0;
  let ready = 0;
  let io: IntersectionObserver | undefined;
  let watcher: MutationObserver | undefined;
  let started = false;
  let stopped = false;
  let probe = 0;
  const heard = () => open();

  /* ------------------------------------------------------------ the story */
  const start = () => {
    if (started || stopped) return;
    started = true;

    [nvdaValue, gauge, timer, ...preds.map((p) => p.label), ...preds.map((p) => p.vol)].forEach(hold);
    hold(nvdaPct);
    if (canSort) [1, 2].forEach((i) => { hold(rowName(i)); hold(rowPct(i)); });

    // Resting values are read now, with the entrance finished and its
    // `clearProps` already run, so a flash has something true to return to.
    const css = (el: HTMLElement | null, prop: 'color' | 'backgroundColor' | 'borderColor' | 'opacity') =>
      (el ? getComputedStyle(el)[prop] : '') || '';
    const valueRest = css(nvdaValue, 'color');
    const pctRest = css(rowPct(1), 'color');
    const ecbFootRest = css(ecbFoot, 'backgroundColor');
    /* THE GLASS CARDS' RESTING FILL AND EDGE, read off WHICHEVER OF THE TWO
       this width draws. It used to be read off NVDA alone, which was right
       while the two cards were either both drawn or both gone — and stopped
       being right the moment the phone layout kept ECB and dropped NVDA: the
       read returned '' and the `&& cardBgRest` guard below then skipped the
       ECB card's own refresh, silently, on every phone. The card sat through
       the whole cycle with its plate lighting underneath it and nothing
       happening to the card. The two cards carry the same `.fam__mkt` rule, so
       either one answers for both. */
    const cardBgRest = css(nvdaCard ?? ecbCard, 'backgroundColor');
    const cardEdgeRest = css(nvdaCard ?? ecbCard, 'borderColor');
    const pillBg = css(pills[0] ?? null, 'backgroundColor');
    const pillFg = css(pills[0] ?? null, 'color');
    const tabOnRest = css(tabAll, 'color');
    const tabOffRest = css(tabSoon, 'color');
    const predYesRest = preds.map((p) => css(p.yes, 'backgroundColor'));
    // Read from the document in the same breath, and for the same reason.
    const C = palette();
    // The two states each figure ping-pongs between, all read off the design so
    // the resting frame is whatever the component ships today.
    const price0 = num(nvdaValue?.textContent);
    const day0 = num(nvdaPct?.nodeValue);
    const gauge0 = num(gauge?.textContent);
    const priceDp = (nvdaValue?.textContent ?? '').includes('.') ? 2 : 0;

    // Positions 1 and 2 of the leaderboard, as a model. The DOM keeps its own
    // order; only what the two rows say is exchanged, so nothing is reparented
    // under a load-in that may still hold references to these nodes.
    const slots = [1, 2].map((i) => ({
      name: rowName(i)?.textContent ?? '',
      pct: num(rowPct(i)?.textContent),
    }));
    const paint = () => {
      slots.forEach((s, k) => {
        const n = rowName(k + 1);
        const p = rowPct(k + 1);
        if (n) n.textContent = s.name;
        if (p) p.textContent = `${Math.round(s.pct)}%`;
      });
    };

    let phase = 0;

    ctx = gsap.context(() => {
      // Numeric starts for everything the loop brightens: GSAP cannot tween out
      // of the keyword `none`.
      gsap.set([gauge, filterIcon, eyebrowDot, ...dots].filter(Boolean) as HTMLElement[], { filter: C.liftRest });

      const runCycle = () => {
        const down = phase % 2 === 0; // even: the tape ticks down and the outsider climbs
        const tl = gsap.timeline();
        story = tl;

        /* ================================================== I. THE BOOK MOVES */

        /* Two prints, not one. A quote that changes once every quarter minute
           is a screenshot with a typo; a quote that prints twice is a tape. */
        const printAt = (at: number, price: number, day: number | null) => {
          if (!nvdaValue || !Number.isFinite(price)) return;
          tl.call(() => {
            nvdaValue.textContent = `$${price.toFixed(priceDp)}`;
            if (nvdaPct && day !== null && Number.isFinite(day)) nvdaPct.nodeValue = `${day.toFixed(2)}%`;
          }, undefined, at)
            .to(nvdaValue, { color: down ? C.tickDown : C.tickUp, duration: 0.2, ease: 'sine.out' }, at)
            .to(nvdaValue, { color: valueRest, duration: 0.95, ease: 'sine.inOut' }, at + 0.22);
          if (nvdaCard && cardBgRest) {
            pulse(tl, nvdaCard, at,
              { backgroundColor: C.cardBgLit, borderColor: C.cardEdgeLit },
              { backgroundColor: cardBgRest, borderColor: cardEdgeRest }, 0.3, 0.95);
          }
        };
        if (Number.isFinite(price0)) {
          const mid = down ? price0 - 0.05 : price0 - 0.03;
          const end = down ? price0 - 0.07 : price0;
          const dayEnd = Number.isFinite(day0) ? (down ? day0 - 0.03 : day0) : null;
          printAt(0, mid, null);
          printAt(2.5, end, dayEnd);
        }

        /* The refresh reaches the ECB card. A deposit facility rate does not
           move every thirteen seconds, so the card acknowledges it and the
           figure does not budge. */
        if (ecbCard && cardBgRest) {
          pulse(tl, ecbCard, 0.6,
            { backgroundColor: C.cardBgLit, borderColor: C.cardEdgeLit },
            { backgroundColor: cardBgRest, borderColor: cardEdgeRest }, 0.35, 1.0);
        }
        if (ecbFoot && ecbFootRest) {
          pulse(tl, ecbFoot, 0.7, { backgroundColor: C.footLit }, { backgroundColor: ecbFootRest }, 0.35, 0.9);
        }
        // The section's own live dot, lit by the same refresh.
        if (eyebrowDot) pulse(tl, eyebrowDot, 0.75, { filter: C.liftEyebrow }, { filter: C.liftRest }, 0.3, 0.9);

        /* The leaderboard re-sorts, while the card is still in its design
           position and every row of it is in clear view. */
        if (canSort && Number.isFinite(slots[0].pct) && Number.isFinite(slots[1].pct)) {
          const moverSlot = down ? 1 : 0;           // the bottom row climbs, then the same name falls back
          const mover = rows[moverSlot + 1];
          const pctEl = rowPct(moverSlot + 1)!;
          const from = slots[moverSlot].pct;
          const to = down ? from + 2 : from - 2;
          const walk = { v: from };

          tl.to(walk, {
            v: to, duration: 0.8, ease: 'sine.inOut',
            onUpdate: () => { pctEl.textContent = `${Math.round(walk.v)}%`; },
          }, 1.1)
            .to(pctEl, { color: down ? C.appUp : C.appDown, duration: 0.22, ease: 'sine.out' }, 1.1)
            .to(pctEl, { color: pctRest, duration: 0.9, ease: 'sine.inOut' }, 2.3);

          // The cross itself, measured off the rows each cycle and expressed as
          // a share of a row's own height, so it stays a row pitch at every
          // breakpoint without a timeline rebuild on resize.
          const a = rows[1].getBoundingClientRect();
          const b = rows[2].getBoundingClientRect();
          const pitch = a.height > 0 ? ((b.top - a.top) / a.height) * 100 : 0;
          const cross = { v: 0 };
          tl.to(cross, {
            v: 1, duration: 0.9, ease: 'sine.inOut',
            onUpdate: () => {
              // The rows are transparent text on the card, so at the halfway
              // point the two lines sit on top of each other and read as a
              // collision. Dipping both through the pass turns that into a
              // dissolve — the travel is unchanged, only the overlap is.
              const fade = 1 - 0.62 * Math.sin(Math.PI * cross.v);
              gsap.set(rows[1], { yPercent: pitch * cross.v, opacity: fade });
              gsap.set(rows[2], { yPercent: -pitch * cross.v, opacity: fade });
            },
          }, 1.95)
            .call(() => {
              gsap.set([rows[1], rows[2]], { yPercent: 0 });
              gsap.set([rows[1], rows[2]], { clearProps: 'opacity' });
              slots[moverSlot].pct = to;
              slots.reverse();
              paint();
            }, undefined, 2.85);

          // The odds follow the move: Yes on the row that gained, No on the one
          // that gave it up.
          const chip = mover.querySelector<HTMLElement>(down ? '.fam__chip--yes' : '.fam__chip--no');
          if (chip) {
            const chipRest = getComputedStyle(chip).backgroundColor;
            pulse(tl, chip, 2.35, { backgroundColor: down ? C.chipYesLit : C.chipNoLit }, { backgroundColor: chipRest }, 0.3, 0.8);
          }
        }

        /* ============================================ II. THE ROUND IS ENDING */

        /* The feed switches to Ending Soon, and the sort that follows is the
           honest consequence: a market with three minutes left belongs above
           one that resolves in seven months. */
        if (tabAll && tabSoon && tabOnRest && tabOffRest) {
          tl.to(tabAll, { color: tabOffRest, duration: 0.55, ease: 'sine.inOut' }, 3.3)
            .to(tabSoon, { color: tabOnRest, duration: 0.55, ease: 'sine.inOut' }, 3.3)
            .to(tabSoon, { color: tabOffRest, duration: 0.55, ease: 'sine.inOut' }, 8.0)
            .to(tabAll, { color: tabOnRest, duration: 0.55, ease: 'sine.inOut' }, 8.0);
        }
        if (filterIcon) pulse(tl, filterIcon, 3.55, { filter: C.filterLit }, { filter: C.liftRest }, 0.3, 0.8);

        if (canResort) {
          // Measured every cycle, with both cards at rest, and converted to a
          // share of each card's own height: percentages survive a resize, a
          // pixel figure measured once does not.
          const ra = feedA!.getBoundingClientRect();
          const rb = feedB!.getBoundingClientRect();
          const gap = rb.top - ra.bottom;
          const riseBy = rb.height > 0 ? ((ra.height + gap) / rb.height) * 100 : 0;
          const sinkBy = ra.height > 0 ? ((rb.height + gap) / ra.height) * 100 : 0;

          tl.to(feedB, { yPercent: -riseBy, duration: 1.25, ease: 'sine.inOut' }, 3.75)
            .to(feedA, { yPercent: sinkBy, duration: 1.25, ease: 'sine.inOut' }, 3.75)
            // The BTC card is later in the DOM and so passes in front; the card
            // going the other way steps back a little rather than fighting it.
            .to(feedA, { opacity: 0.72, duration: 0.5, ease: 'sine.out' }, 3.75)
            .to(feedA, { opacity: 1, duration: 0.6, ease: 'sine.inOut' }, 4.4)
            .to(feedB, { yPercent: 0, duration: 1.25, ease: 'sine.inOut' }, 8.45)
            .to(feedA, { yPercent: 0, duration: 1.25, ease: 'sine.inOut' }, 8.45)
            .to(feedA, { opacity: 0.72, duration: 0.5, ease: 'sine.out' }, 8.45)
            .to(feedA, { opacity: 1, duration: 0.6, ease: 'sine.inOut' }, 9.1);
        }

        /* At the top of the feed, the 5-minute round's ring advances. */
        if (gauge && Number.isFinite(gauge0)) {
          const ring = { v: gauge0 + (down ? 0 : 3) };
          tl.to(ring, {
            v: gauge0 + (down ? 3 : 0), duration: 0.8, ease: 'sine.inOut',
            onUpdate: () => { gauge.textContent = `${Math.round(ring.v)}%`; },
          }, 4.9);
          pulse(tl, gauge, 4.9, { filter: C.ringLit }, { filter: C.liftRest }, 0.35, 0.95);
        }

        /* THE TWO FLOATING PREDICTION CARDS EACH TAKE A TRADE: the odds move
           and the Yes plate acknowledges it, exactly the beat the single card
           here has always played, now played twice.

           The first card keeps its old cue to the frame — 5.45, a 0.7s
           `sine.inOut` on the figure, a 0.3s/0.9s pulse on the plate. The
           second is 0.25s behind it, which is the stagger the pair of blurred
           stand-ins that used to sit here played on, so the region's beats
           still land across the same window they always did.

           Each card's figure ping-pongs between its own two states, at its own
           precision, and `down` alternates the direction per cycle — so after
           two cycles both cards print the number in the Figma frame again. */
        preds.forEach((p, i) => {
          const at = 5.45 + i * 0.25;

          /* The money arrives first. */
          if (p.vol && Number.isFinite(p.vol0)) {
            const v = { n: down ? p.vol0 : p.vol0 + p.volStep };
            tl.to(v, {
              n: down ? p.vol0 + p.volStep : p.vol0, duration: 0.9, ease: 'sine.inOut',
              onUpdate: () => { p.vol!.textContent = `${p.volPre}${v.n.toFixed(p.volDp)}${p.volPost}`; },
            }, at);
          }

          /* Then the odds move, and the bar moves with them — the green run is
             the figure, so it would be a lie for one to travel without the
             other. The first card's bar is already the whole track and has
             nowhere to go, which is why `fill` is null there; its figure still
             ticks. */
          if (p.label && Number.isFinite(p.from)) {
            const to = p.from + p.step;
            const step = { v: down ? p.from : to };
            tl.to(step, {
              v: down ? to : p.from, duration: 0.7, ease: 'sine.inOut',
              onUpdate: () => {
                const t = step.v.toFixed(p.dp);
                p.label!.textContent = `${p.comma ? t.replace('.', ',') : t}%`;
              },
            }, at + 0.12);
            if (p.fill) {
              // `fromTo`, not `to` — both ends stated, so the bar cannot be
              // handed a stale inline width by a teardown that landed mid-tween
              // and then animate from it to itself. Same reason the entrance
              // states both ends on the CTA.
              const w = (n: number) => `${(p.fill0 * (n / p.from)).toFixed(2)}%`;
              tl.fromTo(p.fill,
                { width: down ? w(p.from) : w(to) },
                { width: down ? w(to) : w(p.from), duration: 0.7, ease: 'sine.inOut' },
                at + 0.12);
            }
          }

          /* Then the plate the trade went through acknowledges it. */
          if (p.yes && predYesRest[i]) {
            pulse(tl, p.yes, at + 0.2, { backgroundColor: C.predYesLit }, { backgroundColor: predYesRest[i] }, 0.3, 0.9);
          }
        });

        /* A category is tapped, holds, and lets go, so the row at rest is the
           row in the design. */
        const pill = pills[phase % (pills.length || 1)];
        if (pill && pillBg) {
          tl.to(pill, { backgroundColor: C.pillOnBg, color: C.pillOnFg, duration: 0.5, ease: 'sine.out' }, 5.95)
            .to(pill, { backgroundColor: pillBg, color: pillFg, duration: 0.8, ease: 'sine.inOut' }, 7.9);
        }
        /* The live dots at either end of the row. Accents: under half a second
           out, and nothing structural depends on them. */
        dots.forEach((d, i) => {
          pulse(tl, d, 6.25 + i * 0.12, { filter: C.liftDot, scale: 1.4 }, { filter: C.liftRest, scale: 1 }, 0.3, 0.75);
        });

        phase += 1;
      };

      // A clock the cycles hang off, rather than a repeating timeline whose
      // tweens would have to be rebuilt in place every pass: each cycle knows
      // which row is moving and which pill is being tapped, so it is built with
      // real targets and thrown away.
      driver = gsap.timeline({ repeat: -1, paused: true })
        .call(runCycle)
        .to({}, { duration: PERIOD });
      driver.play();
    }, root);

    /* The round's clock. One digit, once a second, and only while the section
       is on screen. It restarts at 5:00 because the market is a 5m round. */
    let left = timer
      ? (() => { const [m, sec] = (timer.textContent ?? '').trim().split(':'); return Number.parseInt(m, 10) * 60 + Number.parseInt(sec, 10); })()
      : 0;
    const runClock = () => {
      if (!timer || tick) return;
      tick = window.setInterval(() => {
        left = left > 0 ? left - 1 : 300;
        timer.textContent = clock(left);
      }, 1000);
    };
    const stopClock = () => { window.clearInterval(tick); tick = 0; };

    /* Off screen the loop costs nothing — but only the clock between beats is
       stopped, never a beat halfway through. Pausing the story timeline would
       strand the section on a lit pill or a re-sorted feed for as long as it
       took someone to scroll back, and a still of that is not the design. The
       story is ten seconds; it is allowed to finish. */
    io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { driver?.play(); runClock(); }
      else { driver?.pause(); stopClock(); }
    }, { rootMargin: '120px' });
    io.observe(root);
    runClock();
  };

  /* -------------------------------------------------------------- the gate
     The loop must not open over the entrance, and it is wired in two ways that
     look different from in here. `useSectionMotion` passes this function as its
     `idle` option, which it calls from the entrance timeline's `onComplete` —
     one line *after* it has dispatched `motion:done`, so a listener attached
     here would wait for an event that has already gone by. Called any earlier
     (a direct call, a lab harness) the event is still ahead of us and is the
     best signal there is.

     So both are watched, and under them sits the question that is true either
     way: is anything still animating inside this section? Once the band has
     dropped `data-motion="pending"` — i.e. is demonstrably running rather than
     waiting to be scrolled to — the section is sampled four times a second and
     counted quiet only after three consecutive still samples, which is longer
     than the 0.25–0.4s pause the house entrance takes after its lead element.
     Whichever answers first opens the loop, and the first beat lands SETTLE
     later. */
  const open = () => {
    if (stopped || ready) return;
    window.clearInterval(probe);
    probe = 0;
    watcher?.disconnect();
    root.removeEventListener('motion:done', heard);
    ready = window.setTimeout(start, SETTLE * 1000);
  };

  let quiet = 0;
  let waited = 0;
  const busy = () =>
    gsap.globalTimeline.getChildren(true, true, true).some((a) => {
      if (!a.isActive()) return false;
      const targets = (a as gsap.core.Tween).targets?.() ?? [];
      return targets.some((t) => t instanceof Node && (t === root || root.contains(t)));
    });
  const watch = () => {
    probe = window.setInterval(() => {
      waited += 1;
      quiet = busy() ? 0 : quiet + 1;
      // The cap is a backstop, not the plan: something in the section looping
      // already would otherwise hold this closed forever.
      if (quiet >= 3 || waited >= 40) { window.clearInterval(probe); probe = 0; open(); }
    }, 250);
  };

  root.addEventListener('motion:done', heard);

  if (root.dataset.motionDone) open();
  else if (root.dataset.motion !== 'pending') watch();
  else {
    watcher = new MutationObserver(() => {
      if (root.dataset.motion !== 'pending') { watcher?.disconnect(); watch(); }
    });
    watcher.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  return () => {
    stopped = true;
    window.clearTimeout(ready);
    window.clearInterval(tick);
    window.clearInterval(probe);
    root.removeEventListener('motion:done', heard);
    watcher?.disconnect();
    io?.disconnect();
    story?.kill();
    driver?.kill();
    // Reverts every transform and colour this loop wrote, then the text goes
    // back too, so the section is left in the state the design shipped.
    ctx?.revert();
    held.forEach(([node, text]) => {
      if (node instanceof Text) node.nodeValue = text; else node.textContent = text;
    });
    // The one thing this loop writes that is neither a transform, a colour nor
    // text: the green run of the second card's bar, which is an inline width
    // the component ships. Put back explicitly rather than trusting a revert.
    preds.forEach((p) => { if (p.fill) p.fill.style.width = `${p.fill0}%`; });
  };
}

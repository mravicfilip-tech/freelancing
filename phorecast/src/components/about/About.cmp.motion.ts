/* Entrance for the comparison band ("How it works: price and profit").
 *
 * The page's entrances are split one file per band. The shared schedule and
 * helpers live in About.motion.ts.
 *
 * DOWN THE COLUMNS, NOT ACROSS THE ROWS. A column is the only shape in the
 * table that one venue occupies alone, and the Phorcast column (all ticks) is
 * the argument the table makes. So it arrives first, alone, and the rest
 * follows as one left-to-right wave starting at the criterion spine, with
 * Phorcast as the gap in it. On a phone, where roughly two columns are in
 * view, the lead column is also the one the reader can see.
 *
 * THE VERDICTS ARE THE QUIETEST THING IN THE BAND. Twenty-five badges popping
 * in one by one would dominate, so they never travel or scale: each column's
 * badges fade in on a flat `ease: 'none'`, a beat behind their column head.
 * Heads, names and criteria rise; only the verdicts fade.
 *
 * CONSTRAINTS
 *   - No blur inside the table. Small logos and badges have nothing to
 *     resolve from, and thirty filtered nodes cost frames. The card blurs.
 *   - No x on anything. Below 720 `.ab-cmp__scroll` scrolls sideways and the
 *     document must never gain a horizontal scrollbar. Every tween is y and
 *     opacity.
 *   - The criterion column is `position: sticky` below 720, so it arrives as
 *     ONE object with no stagger and its opaque fill never opens a seam. The
 *     scroller and the table themselves are never transformed.
 *   - Logo windows are moved, never resized. Kalshi and Polymarket are crops
 *     positioned as percentages of their window, so translating the window
 *     keeps the crop; scaling would not.
 *
 * No colour is tweened or read, so nothing here depends on the theme.
 */

import { rise } from '../../lib/motion';
import type { SectionMotion, Timeline } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

/** The column the band leads with. Column 0 is Phorcast, which is the point. */
const LEAD = 0;

const CARD_AT = 0.24;
const LEAD_AT = 0.62;
/** The wave. Long enough after the lead that the lead has had the frame. */
const SWEEP_AT = 1.15;
const COL_STEP = 0.11;
/** Inside a column head: the mark, then the name under it. */
const HEAD_STEP = 0.06;
/** The verdicts, behind their own head and quieter than it. */
const VOTES_IN = 0.12;
const VOTE_STEP = 0.035;

type Step = (t: number) => number;

/** A column of the grid: the two parts of its head, and its five verdicts. */
function column(heads: HTMLElement[], rows: HTMLElement[], i: number) {
  const head = heads[i];
  return {
    parts: head ? Array.from(head.querySelectorAll<HTMLElement>('.ab-cmp__logo, .ab-cmp__name')) : [],
    votes: rows
      .map((r) => r.querySelectorAll<HTMLElement>('.ab-cmp__vote')[i])
      .filter((el): el is HTMLElement => Boolean(el)),
  };
}

/** The verdicts. No travel, no scale, flat fade; see the header. */
function inkIn(tl: Timeline, votes: HTMLElement[], at: number, step: Step) {
  if (!votes.length) return;
  tl.from(votes, {
    opacity: 0,
    duration: 0.45,
    ease: 'none',
    stagger: step(VOTE_STEP),
    clearProps: 'opacity',
  }, at);
}

/** One column: its head rises, then its verdicts ink in under it. */
function bringColumn(
  tl: Timeline,
  col: { parts: HTMLElement[]; votes: HTMLElement[] },
  at: number,
  step: Step,
  lead: boolean,
) {
  if (col.parts.length) {
    rise(tl, col.parts, at, {
      y: lead ? 14 : 10,
      duration: lead ? 0.8 : 0.6,
      stagger: step(HEAD_STEP),
      clearProps: 'transform,opacity',
    });
  }
  inkIn(tl, col.votes, at + step(VOTES_IN), step);
}

/**
 * 0.00  The band names itself.
 * 0.24  The card, out of blur: an empty grid, the way the CHOOSE and BRAND
 *       cards also arrive as shells and then fill.
 * 0.62  THE PHORCAST COLUMN, alone: its mark, its name, then its five ticks.
 *       No criterion is named yet; the column of ticks is stated first and
 *       holds the frame for about half a second.
 * 1.15  Everything else, left to right, 0.11s apart:
 *         1.15  the criterion spine (CRITERION and the five row labels) as
 *               ONE object with no stagger, which keeps the sticky column
 *               seamless on a phone
 *         1.26  Kalshi        1.37  Polymarket
 *         1.48  Predict.fun   1.59  MagicMarkets
 *       Each head rises; its verdicts fade in 0.12s behind it.
 *
 * Ends at 2.30s. Under 700px every cue is scaled by 0.42 and every stagger by
 * 0.7, so the sequence ends at 1.42s.
 */
export function buildCompare({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-cmp__card'), cue(CARD_AT), { y: 20, blur: 9, duration: 0.95, fade: 0.4 });

  const heads = q('.ab-cmp__brand');
  const rows = q('.ab-cmp__table tbody tr');

  bringColumn(tl, column(heads, rows, LEAD), cue(LEAD_AT), step, true);

  const sweep = cue(SWEEP_AT);
  const colStep = step(COL_STEP);

  // The spine: the head cell and the five row labels, one object. `q` walks
  // the section in document order, so this is CRITERION then the rows top to
  // bottom, and with no stagger they hold one offset between them.
  const spine = q('.ab-cmp__crit');
  if (spine.length) {
    rise(tl, spine, sweep, { y: 8, duration: 0.6, clearProps: 'transform,opacity' });
  }

  // Then the four other venues, in the frame's order. `station` counts the
  // spine as the wave's first stop, so Phorcast is the gap in the wave rather
  // than a column that gets a second turn.
  let station = 1;
  heads.forEach((_, i) => {
    if (i === LEAD) return;
    bringColumn(tl, column(heads, rows, i), sweep + station * colStep, step, false);
    station += 1;
  });
}

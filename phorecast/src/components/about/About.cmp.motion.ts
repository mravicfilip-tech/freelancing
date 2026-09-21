/* One band of the About page, in its own file.
 *
 * The six entrances were written as one module. They are split per band so
 * that several people can work on the page at once without editing the same
 * file, which is the only reason -- the house language, the phone split and
 * the shared helpers all still live in About.motion.ts, which every one of
 * these imports from.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS BAND MOVES DOWN THE COLUMNS AND NOT ACROSS THE ROWS.
 *
 * A table is the only band on this page with a choice of axis, and the three
 * readings are genuinely different:
 *
 *   Rows      "here is what we do" -- five criteria, each one comparing all
 *             five venues at once. It is the reading order of the markup and
 *             it is what this band used to do. Its cost is that the band's
 *             whole argument -- one column is all ticks, nobody else is --
 *             only exists once the FIFTH row has landed. The thesis arrives
 *             last, as a by-product of the scaffolding.
 *   Diagonal  a ripple. It says nothing about the content, and it has no
 *             single first object, so it cannot obey the one rule this page
 *             is built on.
 *   Columns   "here is who we are against" -- and, crucially, a column is the
 *             only shape in this table that one venue occupies alone. The
 *             Phorcast column IS the argument the table was made to make, so
 *             it is the one object that can come out first and hold the frame
 *             while nothing else is there. Everything after it is evidence.
 *
 * So: columns. First the Phorcast column alone -- five ticks, no criteria yet
 * to qualify them and nobody yet to compare them to -- and then the rest
 * follows as one left-to-right wave that starts at the criterion spine and
 * washes past the column already standing. The gap in the wave is Phorcast.
 *
 * It also happens to be the axis that survives the phone best. Below 720 the
 * card scrolls sideways and roughly two columns are in view; with a column
 * sweep the thing that arrives alone, first, is exactly the column the reader
 * can see.
 *
 * ---------------------------------------------------------------------------
 * THE VERDICTS ARE THE QUIETEST THING IN THE BAND. Twenty-five badges each
 * popping in on its own is the obvious idea and at 38px it is a game show. So
 * they never travel and they never scale: they ink in where they stand, on a
 * flat `ease: 'none'` fade, over a shorter tween than anything else here, a
 * beat behind their own column head. Everything structural -- heads, names,
 * criteria -- rises; only the verdicts fade. That difference is what keeps
 * them subordinate to the grid they sit in.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 *   No blur inside the table. The band's accent is the page's soft-to-sharp
 *   resolve and the card gets it, but a 26px logo and a 38px badge have
 *   nothing to resolve FROM -- at that size a blur is a smudge, not a focus
 *   pull -- and thirty filtered nodes is the kind of cost that shows up as a
 *   late entrance rather than a dropped one. The lead column is marked out by
 *   being ALONE and by travelling further, not by a different technique.
 *
 *   No x on anything, at any width. Below 720 `.ab-cmp__scroll` is the
 *   scroller and the document must never gain a horizontal scrollbar; a cell
 *   flying in from the right is exactly how it would. Every tween here is y
 *   and opacity.
 *
 *   Nothing is animated that the pinned column depends on. The criterion
 *   column is `position: sticky; left: 0` below 720, and it arrives as ONE
 *   object with no stagger, so its six cells never hold different offsets
 *   from each other and the opaque fill that stops rows sliding through it
 *   can never open a seam. The scroller itself, and the table, are never
 *   transformed.
 *
 *   The logo windows are moved, never resized. Kalshi and Polymarket are
 *   crops -- a 97x95.45 image inside a 97x30 window offset upward, and a
 *   462.5%-wide image in a 25x30 window -- so every offset inside them is a
 *   percentage OF THE WINDOW. Translating the window carries the image with
 *   it and the crop holds; scaling it would not. Nothing here scales.
 *
 * THIS MODULE HAS NO COLOUR IN IT, so it needed nothing for light mode: it
 * tweens y and opacity and reads no resting colour out of getComputedStyle,
 * and no beat lifts anything by making it brighter.
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

/** The verdicts. No travel, no scale, flat fade — see the note above. */
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
 * 0.24  The card, out of blur — an empty grid, the way the CHOOSE and BRAND
 *       cards also arrive as shells and then fill.
 * 0.62  THE PHORCAST COLUMN, alone: its mark, its name, and then its five
 *       ticks inking in under them. Nothing else is on the table yet, and no
 *       criterion has been named — five ticks in a column and no crosses
 *       anywhere is the whole argument, stated before it is justified. It has
 *       the frame to itself for half a second.
 * 1.15  Everything else, column by column, left to right, 0.11s apart:
 *         1.15  the criterion spine — CRITERION and the five row labels, as
 *               ONE object with no stagger, which is both what a spine is and
 *               what keeps the pinned column seamless on a phone. The wave
 *               starts here, so the ticks that are already standing acquire
 *               their meaning first.
 *         1.26  Kalshi        1.37  Polymarket
 *         1.48  Predict.fun   1.59  MagicMarkets
 *       Each head rises; each column's verdicts ink in 0.12s behind it. The
 *       first cross on the table lands under Kalshi at about 1.4s, against a
 *       column of ticks that has been sitting there for three quarters of a
 *       second.
 *
 * Ends at 2.30s. Under 700px every cue is taken at 0.42 and every stagger at
 * 0.7, so the same five beats land in 1.42s.
 *
 * MEASURED, clock starting the frame the band drops `data-motion="pending"`,
 * opacity >= 0.9, dev server, 844 tall. Identical in both themes to within a
 * frame, so only one column each:
 *
 *                       1600      390        previous builder, same harness
 *   eyebrow readable     251ms     249ms      245ms / 249ms
 *   card readable        593       448        581   / 455
 *   lead column          865       516        --    (it had no lead column)
 *   criteria, ALL five  1332       667       1461   /  801
 *   last verdict        2249      1365       1558   /  881
 *
 * So the band's time-to-readable is unchanged -- the eyebrow and the card sit
 * on the same two cues they always did -- and the criterion column, which is
 * the table's actual prose, is COMPLETE 129ms earlier at 1600 and 134ms
 * earlier at 390, because the spine now arrives as one object instead of
 * trickling down five rows. What is longer is the tail: the last verdict
 * lands 0.69s later at 1600. That is the half second the lead column is given
 * to hold the frame, spent at the end of the sequence rather than the
 * beginning, and it is bought with nothing the reader is waiting for.
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
  // the section in document order, so this is CRITERION followed by the rows
  // top to bottom — and with no stagger they hold one offset between them.
  const spine = q('.ab-cmp__crit');
  if (spine.length) {
    rise(tl, spine, sweep, { y: 8, duration: 0.6, clearProps: 'transform,opacity' });
  }

  // Then the four venues being compared against, in the frame's own order.
  // `at` counts the spine as the wave's first station, so Phorcast is the gap
  // in it rather than a column that gets a second turn.
  let station = 1;
  heads.forEach((_, i) => {
    if (i === LEAD) return;
    bringColumn(tl, column(heads, rows, i), sweep + station * colStep, step, false);
    station += 1;
  });
}

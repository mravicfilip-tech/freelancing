/* One band of the About page, in its own file.
 *
 * The six entrances were written as one module. They are split per band so
 * that several people can work on the page at once without editing the same
 * file, which is the only reason -- nothing about the motion changed in the
 * split, and the house language, the phone split and the shared helpers all
 * still live in About.motion.ts, which every one of these imports from.
 */

import { rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

/**
 * 0.00  The band names itself.
 * 0.24  The card, out of blur.
 * 0.62  The five column heads, left to right — the venues being compared are
 *       named before anything is said about them.
 * 0.95  The five rows, top to bottom, each row's criterion and its five
 *       verdicts arriving together. A row is one statement; splitting the
 *       verdicts out of it would make the reader watch a table fill in
 *       thirty pieces.
 */
export function buildCompare({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-cmp__card'), cue(0.24), { y: 20, blur: 9, duration: 0.95, fade: 0.4 });

  const heads = q('.ab-cmp__brand');
  if (heads.length) {
    rise(tl, heads, cue(0.62), { y: 10, duration: 0.6, stagger: step(0.07), clearProps: 'transform,opacity' });
  }

  const rows = q('.ab-cmp__table tbody tr');
  if (rows.length) {
    rows.forEach((row, i) => {
      const cells = Array.from(row.querySelectorAll<HTMLElement>('.ab-cmp__crit, .ab-cmp__vote'));
      if (!cells.length) return;
      rise(tl, cells, cue(0.95) + i * step(0.09), {
        y: 8, duration: 0.5, stagger: step(0.02), clearProps: 'transform,opacity',
      });
    });
  }
}

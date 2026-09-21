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
 * 0.24  The card, out of blur. One object, and a wide one.
 * 0.62  The mark — the brand's own glyph, alone, before a word of the copy.
 * 0.78  The two paragraphs.
 * 0.86  The product shot, sliding in from the edge it bleeds off. It is the
 *       one thing on the page that moves horizontally, and it moves the way
 *       the composition already points.
 */
export function buildBrand({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-brand__card'), cue(0.24), { y: 20, blur: 9, duration: 0.95, fade: 0.4 });
  rise(tl, q('.ab-brand__mark'), cue(0.62), { y: 10, duration: 0.6, clearProps: 'transform,opacity' });
  rise(tl, q('.ab-brand__prose > *'), cue(0.78), {
    y: 10, duration: 0.6, stagger: step(0.1), clearProps: 'transform,opacity',
  });
  outOfBlur(tl, q('.ab-brand__visual'), cue(0.86), { y: 0, x: 44, blur: 6, duration: 1.1, fade: 0.45 });
}

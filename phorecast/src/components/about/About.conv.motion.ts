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
 * 0.24  THE STATEMENT, out of the deepest blur on the page and travelling
 *       furthest. It is the only thing in the band and it is the band.
 * 1.10  The goal line, quieter and shallower, after the statement has settled.
 *
 * The statement is animated AS ONE BLOCK and is never split into lines.
 * `intoLines` rebuilds an element from its `textContent`, which would throw
 * away the `<span class="ab-conv__rest">` that carries the second half of the
 * sentence in a dimmer ink — the type would animate correctly and come to rest
 * one flat colour. Whether the mask is worth that is not a close call.
 */
export function buildConviction({ q, tl }: SectionMotion) {
  const { cue } = schedule();

  rise(tl, q('.eyebrow'), 0, { y: 14, duration: 0.8, clearProps: 'transform,opacity' });
  outOfBlur(tl, q('.ab-conv__statement'), cue(0.24), { y: 24, blur: 12, duration: 1.2, fade: 0.4 });
  outOfBlur(tl, q('.ab-conv__goal'), cue(1.1), { y: 12, blur: 5, duration: 0.75, fade: 0.3 });
}

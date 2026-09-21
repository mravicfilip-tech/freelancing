/* One band of the About page, in its own file.
 *
 * The six entrances were written as one module. They are split per band so
 * that several people can work on the page at once without editing the same
 * file, which is the only reason -- nothing about the motion changed in the
 * split, and the house language, the phone split and the shared helpers all
 * still live in About.motion.ts, which every one of these imports from.
 */

import { intoLines, rise } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { schedule, outOfBlur } from './About.motion';

/**
 * 0.00  The ground lights, from the bottom of its own field so the ember
 *       grows up out of the page rather than switching on whole.
 * 0.10  The nav, left to right. It is furniture: it arrives quickly and
 *       quietly and is finished before the headline starts.
 * 0.30  THE HEADLINE, rising out of its own mask and sharpening on the way.
 *       The one object the page leads with, and the largest single movement
 *       on it. It has the frame to itself for 0.65s.
 * 0.95  The description.
 * 1.15  Get Started, last, so the eye ends on the thing to press.
 */
export function buildAboutHero({ q, tl }: SectionMotion) {
  const { cue, step } = schedule();
  const glow = q('.ab-ground')[0];
  const title = q('.ab-hero__title')[0];

  if (glow) {
    tl.from(glow, {
      opacity: 0,
      scale: 1.05,
      duration: 1.4,
      ease: 'power2.out',
      transformOrigin: '50% 100%',
      clearProps: 'transform',
    }, 0);
  }

  const nav = q('.nav .logo, .nav__links > *, .nav__actions > *, .nav__burger');
  if (nav.length) {
    rise(tl, nav, cue(0.1), { y: 8, duration: 0.55, stagger: step(0.05), clearProps: 'transform,opacity' });
  }

  if (title) {
    // `intoLines` rewrites the element in place and is idempotent, so a
    // StrictMode remount reuses the spans that are already there. Safe here
    // because the headline is plain text; the statement in band 4 is NOT, and
    // is deliberately animated as one block instead.
    const lines = intoLines(title);
    tl.from(lines, {
      yPercent: 108,
      filter: 'blur(10px)',
      duration: 1.15,
      ease: 'power4.out',
      clearProps: 'filter',
    }, cue(0.3));
    tl.from(lines, { opacity: 0, duration: 0.3, ease: 'none' }, cue(0.3));
  }

  outOfBlur(tl, q('.ab-hero__lede'), cue(0.95), { y: 14, blur: 6, duration: 0.8, fade: 0.32 });
  rise(tl, q('.ab-hero__cta'), cue(1.15), { y: 12, duration: 0.7, clearProps: 'transform,opacity' });
}

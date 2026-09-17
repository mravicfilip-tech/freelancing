import dark from '../assets/icons/live-dot.svg';
import light from '../assets/icons/live-dot-light.svg';
import { useTheme } from '../lib/theme';

/**
 * The eyebrow's live indicator, in whichever theme is running.
 *
 * Six sections render this — hero, bento's neighbours steps and pillars,
 * familiar, built and faq — and until now all six rendered the same file. It is
 * three stacked ellipses: a soft `#f57c6d` halo at 59%, a `#dc2f16` ring at
 * 52%, and a core of literal white. On the dark page that core is the brightest
 * thing in the composition (19.3:1 against the ground, 5.5:1 against the ring
 * it sits in) and it is what makes the mark read as LIT rather than as a
 * decorative circle.
 *
 * On paper the core becomes the page colour, and a page-coloured centre is a
 * HOLE. The dot stops being an indicator and becomes a small hollow ring —
 * which five section agents reported independently, correctly, as a loss of
 * meaning rather than a cosmetic nit.
 *
 * THE DECISION, and why it is not the computed one.
 *
 * The literal translation is to keep the ramp and let it invert: dark's core is
 * exactly `--ink` (`#fffbf8`), so light's would be `--ink` too (`#1a1512`), and
 * the contrast hierarchy would be reproduced almost exactly — 17.6:1 against
 * the page where dark is 19.3:1, a 4.9:1 step out of the ring where dark's is
 * 5.5:1. Rendered at 12px it reads as a dark pupil: the eye takes a black
 * centre as absence, which is the same failure as the hole, wearing a different
 * colour.
 *
 * So the ramp is re-pointed instead. On the dark page the dot runs outward from
 * bright to dark; on paper it runs outward from DENSE to PALE. The centre stays
 * the extreme value in both, which is the part that carries the meaning:
 *
 *     core   #a21605 opaque      the brand red, 7.69:1 on paper
 *     ring   #a21605 at 58%      the first step of the falloff
 *     halo   #a21605 at 26%      the last step, into the page
 *
 * One hue at three densities, because "a lighter red" on black is the same
 * gesture as "the same red, thinner" on paper. It is three flat fills: no blur,
 * no shadow, no filter, nothing that could become a glow.
 *
 * WHY A SECOND FILE rather than a mask or an inline string. A mask flattens all
 * three ellipses to one alpha and the falloff disappears. Inlining it six times
 * would put the same string in six bundles. `src/assets/live-dot.svg` is left
 * byte-for-byte alone, so dark cannot move; the light file is a new sibling,
 * which §2.2 of LIGHTMODE.md permits and which the gate now watches, because
 * `src` is one of the properties `theme-snapshot.mjs` records.
 *
 * The `#a21605` in that file is `--accent`'s light value, baked, because an
 * external SVG in an `<img>` is a separate document and no token reaches it. If
 * `--accent` ever moves, this file moves with it.
 *
 * The element is the same `<img class="eyebrow__dot" width="12" height="12">`
 * the six call sites wrote by hand, so nothing is inserted, nothing is removed
 * and the geometry is untouched.
 */
export function LiveDot({ className = 'eyebrow__dot' }: { className?: string }) {
  return (
    <img
      src={useTheme() === 'light' ? light : dark}
      alt=""
      className={className}
      width={12}
      height={12}
    />
  );
}

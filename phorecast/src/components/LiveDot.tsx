import dark from '../assets/icons/live-dot.svg';
import light from '../assets/icons/live-dot-light.svg';
import { useTheme } from '../lib/theme';

/**
 * The eyebrow's live indicator, in whichever theme is running.
 *
 * Dark (`icons/live-dot.svg`): three stacked ellipses, a `#f57c6d` halo at
 * 59%, a `#dc2f16` ring at 52% and a white core. The bright core is what makes
 * the mark read as lit rather than as a decorative circle.
 *
 * Light (`icons/live-dot-light.svg`): a page-coloured core would read as a
 * hole, and a dark core reads as a pupil. So the ramp runs from dense to pale
 * instead, one hue at three densities, with the centre still the extreme:
 *
 *     core   #a21605 opaque
 *     ring   #a21605 at 58%
 *     halo   #a21605 at 26%
 *
 * A second file rather than a mask, because a mask flattens the three
 * ellipses to one alpha and loses the falloff. `#a21605` is `--accent`'s light
 * value baked in (an <img> is a separate document and no token reaches it), so
 * if `--accent` changes, update the file too.
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

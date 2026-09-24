import ribs from '../../../assets/steps/mark-ribs.svg';
import slices from '../../../assets/steps/mark-slices.svg';
import { Icon } from '../../Icon';

/** The 3D wordmark behind each panel. Figma gives it a different box and
 *  opacity per slide, and the ribs/slices sit at their own insets inside it.
 *
 *  Both files are white strokes with per-stroke `stroke-opacity`, so they are
 *  drawn as masks: the alpha modulation survives and the colour comes from
 *  `color` on the wrapper, which lets the mark switch to ink in light.
 *
 *  `w`/`h` are each file's intrinsic size and are required. The layers are
 *  positioned with all four insets; without an explicit size a <span> would
 *  take its box from the insets (an <img> would have used the file's size). */
export function Mark({ className }: { className: string }) {
  return (
    <div className={`steps__mark ${className}`} aria-hidden="true">
      <div className="steps__mark-clip">
        <Icon src={ribs} w={840.015625} h={969.384} className="steps__mark-ribs" />
        <Icon src={slices} w={843.984375} h={971.908} className="steps__mark-slices" />
      </div>
    </div>
  );
}

/** The warm disc behind each panel's artwork.
 *
 *  glow.svg is one circle (r 204.5, centred in a 944.6 box) filled with a
 *  two-stop linear gradient and blurred by an feGaussianBlur of stdDeviation
 *  133.9. It is a styled <span> rather than an <img> so the stylesheet can
 *  replace it in light: the gradient's far stop is the dark panel ground. The
 *  paint lives in Steps.css (`.steps__glow`). */
export function Glow({ className }: { className: string }) {
  return <span className={`steps__glow ${className}`} aria-hidden="true" />;
}

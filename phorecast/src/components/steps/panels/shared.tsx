import ribs from '../../../assets/steps/mark-ribs.svg';
import slices from '../../../assets/steps/mark-slices.svg';
import { Icon } from '../../Icon';

/** The 3D wordmark behind each panel. Figma gives it a different box and
 *  opacity per slide, and the ribs/slices sit at their own insets inside it.
 *
 *  Both files are one flat colour -- 49 strokes at `stroke="white"`, carrying
 *  their own per-stroke `stroke-opacity` -- so they are masks, not images. A
 *  mask reads the alpha channel, and the stroke opacities ARE alpha, so the
 *  internal modulation that makes the mark read as a 3D object survives; only
 *  the white is replaced, by `color` on the wrapper. On paper white at a tenth
 *  of an opacity is the page, and the mark would simply not be there.
 *
 *  The two numbers are each file's intrinsic size, and they are not decoration.
 *  These are absolutely positioned with all four insets and no width: an <img>
 *  is a replaced element, so `width: auto` resolves from the file and `right`
 *  is dropped as over-constrained, but a <span> is not replaced and would take
 *  its box from the insets instead -- a different box at every width. Passing
 *  the intrinsic numbers reproduces the <img> exactly. */
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
 *  glow.svg is one circle -- r 204.5 on centre in a 944.6 box, filled with a
 *  two-stop linear gradient and blurred by an feGaussianBlur of stdDeviation
 *  133.9 -- and that is exactly a clipped, blurred CSS gradient. Drawn here
 *  rather than fetched because an <img> is a separate document that no rule in
 *  this stylesheet can reach, and this gradient's far stop is the panel ground
 *  itself: the disc is meant to dissolve into the surface it sits on. Carried
 *  across unchanged it would be a grey bruise on cream.
 *
 *  A <span> rather than an inlined <svg>: the element count has to stay the
 *  same. theme-diff.mjs compares by array index, so a single extra node inside
 *  .steps would shift every row after it and report the whole section as
 *  changed. The geometry is unchanged -- same box, same rules in Steps.css. */
export function Glow({ className }: { className: string }) {
  return <span className={`steps__glow ${className}`} aria-hidden="true" />;
}

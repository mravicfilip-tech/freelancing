/**
 * Bento card A: "Make Your First Forecast in 60 Seconds" (Figma 365:866 desktop,
 * 526:184 mobile).
 *
 * One markup, two frames. In the mobile design every illustration node sits at
 * its desktop coordinate less (87, 89), at the same size, with the same assets.
 * So nothing here changes for the phone: BoxOnboard.css moves the column and
 * rescales the frame around it (see the mobile block at the foot of that file).
 *
 * Deliberately omitted: node 526:1490, a blurred #FA9C5A ellipse in the mobile
 * frame's bottom-left corner. Design decision: no glow, bloom or halo on this
 * card. The gradient's #f8a361 bottom stop already lifts that corner.
 *
 * The card is 534 x 387 design px and is the one orange card in the grid.
 * `.bcard` (Bento.css) supplies the shell (padding, radius, min-height) and the
 * inline-size query container; BoxOnboard.css supplies the fill. The copy and
 * the link use the shared `.bcard__*` / `.bento__cta` chrome.
 *
 * Every artwork coordinate is the raw Figma number inside frame 365:868 (the
 * 474 x 327 content column, the card less its 30px padding), multiplied by
 * `--u`, one design pixel of that column. See BoxOnboard.css.
 *
 * Paint order follows Figma: phone, grid, pills, the 60s ring, the caption.
 * The copy and the link sit above all of it (Bento.css gives them `z-index: 1`).
 *
 * Resting state only; `motion/onboard.ts` owns the load-in and loop.
 */
/* grid, ring-arc and arrow-white are shared bento assets. The phone is this
   card's own export (its side-button fill differs from the shared copy). */
import grid from '../../../assets/bento/grid.svg';
import { Roll } from '../../Roll';
import { ctaProps } from '../../../lib/cta';
import ringArc from '../../../assets/bento/ring-arc.svg';
import arrow from '../../../assets/bento/arrow-white.svg';
import logoWatermark from '../../../assets/bento/onboard/logo-watermark.svg';
import phone from '../../../assets/bento/onboard/phone.svg';
import './BoxOnboard.css';

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/** Frames 365:918 / 365:916 / 365:914: three glass pills stacked down the left
 *  of the phone. Each carries its own width and its own background blur; Figma
 *  gives the bottom one no blur at all, so `blur` is per pill, not shared. */
const PILLS = [
  { label: 'No KYC', x: 111, y: 149, w: 76, blur: 2 },
  { label: 'No documents', x: 87, y: 187, w: 100, blur: 11.3 },
  { label: 'No waiting', x: 111, y: 225, w: 76, blur: 0 },
] as const;

export function BoxOnboard() {
  return (
    <article className="bcard bcard--onboard box-onboard">
      <div className="bcard__text">
        <h3 className="bcard__title">Make Your First Forecast in 60 Seconds</h3>
        <p className="bcard__body bcard__body--light">No KYC. No documents. No waiting.</p>
      </div>

      <div className="onb__art" aria-hidden="true">
        {/* 365:867: the watermark instance Figma parks behind the pills. Its
            export is an empty group (the logo is off in this variant), so it
            draws nothing; it is kept at its 184.286 x 215 box so the layer is
            not silently dropped. */}
        <img className="onb__logo" src={logoWatermark} alt="" width={184.286} height={215} />

        {/* 365:878: the phone outline, 214 x 420, taller than the 327 column,
            so the card's own overflow clips its foot exactly as Figma does. */}
        <img className="onb__phone" src={phone} alt="" width={214} height={420} />

        {/* 365:889: the 488.255 x 312 grid at 20%. Figma does not clip it to
            its 196px frame, so it runs from x 132 out past the card's edge. */}
        <img className="onb__grid" src={grid} alt="" width={488.255} height={312} />

        {PILLS.map((p) => (
          <span
            key={p.label}
            className="onb__pill"
            style={{ '--x': p.x, '--y': p.y, '--w': p.w, '--blur': `${p.blur}px` } as Vars}
          >
            {p.label}
          </span>
        ))}

        {/* 365:920: disc, arc and label share one 157.87 x 158.841 box; the
            disc and the arc are concentric in it, each with its own rotation. */}
        <span className="onb__ring">
          <span className="onb__disc" />
          <span className="onb__arc-box">
            <img className="onb__arc" src={ringArc} alt="" width={90.8153} height={64.3651} />
          </span>
          {/* The resting numerals, which motion/onboard.ts counts down from.
              One element per digit rather than one string: the face is
              proportional and the fallback has no tabular figures, so a plain
              string re-measures on every tick and the count shifts sideways.
              Each digit gets a 1ch cell. The "s" never changes, so it needs no
              cell. See BoxOnboard.css. */}
          <span className="onb__seconds">
            <i className="onb__digit">6</i>
            <i className="onb__digit">0</i>
            <i className="onb__unit">s</i>
          </span>
        </span>

        <span className="onb__in">You&rsquo;re in.</span>
      </div>

      <a className="bento__cta bento__cta--white" {...ctaProps('bentoStart')}>
        <Roll>Start Forecasting</Roll>
        <img src={arrow} alt="" width={12} height={6} />
      </a>
    </article>
  );
}

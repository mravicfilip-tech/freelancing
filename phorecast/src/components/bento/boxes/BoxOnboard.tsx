/**
 * Bento card A — "Open an account in 60 seconds" (Figma 365:866 desktop,
 * 526:184 mobile).
 *
 * ONE MARKUP, TWO FRAMES. The mobile design is not a second drawing: every one
 * of the eight illustration nodes sits at its desktop coordinate less exactly
 * (87, 89), at the same size, and the four assets it names are byte-for-byte
 * the exports this file already imports. So NOTHING below changes for the phone
 * frame — BoxOnboard.css moves the column and rescales the frame around it. See
 * the mobile block at the foot of that file.
 *
 * ONE THING FROM 526:184 IS DELIBERATELY NOT HERE. Node 526:1490 is a single
 * #FA9C5A ellipse under a 38.75px Gaussian blur, parked at the card's
 * bottom-left corner — a bloom. This page has a standing rule against glow,
 * bloom and halo, and that rule has outlived three attempts to reintroduce one,
 * so the asset is not downloaded and not drawn. The gradient's own #f8a361
 * bottom stop already lifts that corner; what is lost is the asymmetry, which
 * is the part the rule is about.
 *
 * The card is 534 x 387 in design pixels and is the one orange card in the
 * grid. `.bcard` (Bento.css) already supplies the shell — padding, radius,
 * min-height — and makes itself an inline-size query container; BoxOnboard.css
 * re-states the fill, because the gradient in Bento.css still carries the old
 * palette. The copy and the link use the shared `.bcard__*` / `.bento__cta`
 * chrome so this card reads the same as its siblings.
 *
 * Every artwork coordinate below is the raw Figma number inside frame
 * 365:868 — the 474 x 327 content column, i.e. the card less its 30px padding —
 * multiplied by `--u`, one design pixel of that column. See BoxOnboard.css.
 *
 * Paint order follows Figma: phone, then the grid over it, then the pills, then
 * the 60s ring, then the caption. The copy and the link sit above all of it
 * (Bento.css gives them `z-index: 1`).
 *
 * No motion lives here: this file is the resting state only. A separate module
 * owns the card's load-in and loop.
 */
/* Three of this card's five assets already exist in the shared bento folder and
   are byte-for-byte the same export (grid and ring-arc differ only in the
   internal ids Figma renumbers on every download; the arrow is identical), so
   they are reused rather than duplicated. The phone is not: the side-button
   fill has moved from #511715 to #662514 since the shared copy was taken, so
   this card carries its own current export. */
import grid from '../../../assets/bento/grid.svg';
import { Roll } from '../../Roll';
import ringArc from '../../../assets/bento/ring-arc.svg';
import arrow from '../../../assets/bento/arrow-white.svg';
import logoWatermark from '../../../assets/bento/onboard/logo-watermark.svg';
import phone from '../../../assets/bento/onboard/phone.svg';
import './BoxOnboard.css';

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/** Frames 365:918 / 365:916 / 365:914 — three glass pills stacked down the left
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
        <h3 className="bcard__title">Open an account in 60 seconds</h3>
        <p className="bcard__body bcard__body--light">No KYC, no documents, no waiting.</p>
      </div>

      <div className="onb__art" aria-hidden="true">
        {/* 365:867 — the watermark instance Figma parks behind the pills. Its
            export is an empty group (the logo is switched off in this variant),
            so it draws nothing; it is kept at its designed 184.286 x 215 box so
            the layer is not silently dropped. */}
        <img className="onb__logo" src={logoWatermark} alt="" width={184.286} height={215} />

        {/* 365:878 — the phone outline, 214 x 420, taller than the 327 column,
            so the card's own overflow clips its foot exactly as Figma does. */}
        <img className="onb__phone" src={phone} alt="" width={214} height={420} />

        {/* 365:889 — the 488.255 x 312 grid at 20%. Figma does not clip it to
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

        {/* 365:920 — disc, arc and label share one 157.87 x 158.841 box; the
            disc and the arc are concentric in it, each with its own rotation. */}
        <span className="onb__ring">
          <span className="onb__disc" />
          <span className="onb__arc-box">
            <img className="onb__arc" src={ringArc} alt="" width={90.8153} height={64.3651} />
          </span>
          {/* The resting numerals, and what motion/onboard.ts winds down from.
              One element per DIGIT rather than one string: the face is
              proportional now and the fallback has no tabular figures, so a
              plain string re-measures itself on every tick and the count
              crawls sideways under itself. Each digit gets a 1ch cell instead.
              The "s" is not a cell — it is one glyph that never changes, so its
              natural advance is already constant. See BoxOnboard.css. */}
          <span className="onb__seconds">
            <i className="onb__digit">6</i>
            <i className="onb__digit">0</i>
            <i className="onb__unit">s</i>
          </span>
        </span>

        <span className="onb__in">You&rsquo;re in.</span>
      </div>

      <a className="bento__cta bento__cta--white" href="#signup">
        <Roll>Open an Account</Roll>
        <img src={arrow} alt="" width={12} height={6} />
      </a>
    </article>
  );
}

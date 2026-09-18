/* Bento card C — "Double your capital on first deposit".
   Figma: frame 365:988 (776 x 299 design px) and, on a phone, frame 526:261
   (394 x 460), file aczG8te17zRGoK5wvirB92.

   ONE set of markup serves both frames. The two designs are the same objects
   in different places -- and the artwork well is not even that: the chart, the
   grid and the marker carry identical numbers in both, so only the well's
   anchor, the badges, the pill and the copy move. All of that is geometry, so
   it all lives in BoxBonus.css and nothing below is conditional -- including
   the title's hand-set line break, which is the one thing here that looks like
   content and turned out to be geometry after all. See .box-bonus__title.

   Everything is laid out in design pixels multiplied by --u, the house pattern
   used by Hero.css / SlideBonus.css / Familiar.css. `.bcard` already declares
   `container-type: inline-size`, so 100cqw is this card's own content box and
   --u is one design pixel of it — the box scales with its bento column, never
   with the viewport.

   Coordinates come straight out of Figma and are measured from the card's
   padding box (the export positions every absolute child against it). Figma's
   inner wrapper 365:1023 sits 1px down from that box because the root frame
   carries 1px of vertical padding, so the y of everything that lived inside it
   is its Figma y + 1.

   Static by design: no transitions, no load-in, no hover. The chart stroke is a
   real <path class="box-bonus__line"> so the motion pass can draw it. */

import chartMarker from '../../../assets/bento/bonus/marker.svg';
import { Roll } from '../../Roll';
import { Icon } from '../../Icon';
import chartGrid from '../../../assets/bento/bonus/grid.svg';
import arrowOrange from '../../../assets/bento/bonus/arrow.svg';
import walletBadge from '../../../assets/bento/bonus/wallet-badge.svg';
import iconPlus from '../../../assets/bento/bonus/plus.svg';
import iconBolt from '../../../assets/bento/bonus/bolt.svg';
import pieA from '../../../assets/bento/bonus/pie-a.svg';
import pieB from '../../../assets/bento/bonus/pie-b.svg';
import pieC from '../../../assets/bento/bonus/pie-c.svg';
import './BoxBonus.css';

/* Vector 5 of Group 2085662432, verbatim from the Figma export. The viewBox is
   the vector's own 564.087 x 196.559 bleed box (the 563.5 x 194.75 layer plus
   half a 2px stroke), so the path data needs no rescaling. */
const LINE_D =
  'M0.587302 195.75L121.594 107.944C123.682 106.429 126.194 105.614 128.773 105.614C131.242 105.614 133.653 104.866 135.688 103.469L139.925 100.562C143.405 98.1739 147.527 96.8958 151.747 96.8958H154.085C157.933 96.8958 161.634 95.42 164.427 92.7725L165.622 91.6393C167.647 89.7194 170.331 88.6492 173.122 88.6492C176.193 88.6492 179.122 89.9448 181.188 92.2174L182.763 93.9506C185.832 97.327 190.184 99.2519 194.747 99.2519H196.911C201.677 99.2519 206.301 97.6307 210.024 94.6547L219.548 87.0402C222.443 84.7262 226.038 83.4656 229.744 83.4656C232.616 83.4656 235.437 82.7083 237.922 81.27L241.707 79.0797C244.904 77.2299 248.532 76.2559 252.225 76.2559H258.797C263.669 76.2559 268.391 74.5614 272.151 71.4627L311.529 39.0151C315.29 35.9164 320.011 34.2219 324.884 34.2219H420.542C425.834 34.2219 430.931 32.2235 434.814 28.6266L451.973 12.7286C455.043 9.8843 459.074 8.3041 463.259 8.3041H464.99C468.292 8.3041 471.459 6.99013 473.792 4.65205C476.125 2.31397 479.292 1 482.595 1H564.087';

export function BoxBonus() {
  return (
    <article className="bcard bcard--bonus box-bonus">
      {/* Frame 2085662610 — the artwork well, hung off the bottom-right corner
          and clipped by the card. */}
      <div className="box-bonus__art" aria-hidden="true">
        <div className="box-bonus__grid">
          <img src={chartGrid} alt="" width={488.255} height={312} />
        </div>
        {/* preserveAspectRatio="none" mirrors Figma: the layer is stretched to
            its box rather than letterboxed. The card scales uniformly, so in
            practice the stroke stays round. */}
        <svg
          className="box-bonus__chart"
          viewBox="0 0 564.087 196.559"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* The stroke's ramp, painted from CSS rather than from four
                `stopColor` attributes.

                It is the one gradient in this card that cannot be a fixed set
                of tints: its last stop is not a colour at all, it is THE CARD
                -- the point where the stroke dissolves into its own ground --
                and the three before it are a lit end that is pale on a dark
                card and has to be deep on a pale one. A presentation attribute
                cannot follow a theme; a class can, and CSS beats the attribute,
                so one class per stop themes the whole ramp with no string
                transform and no change to what the browser computes today.
                See --bonus-line-a..d in BoxBonus.css. */}
            <linearGradient
              id="box-bonus-stroke"
              x1="545.087"
              y1="-34.25"
              x2="30.0873"
              y2="179.75"
              gradientUnits="userSpaceOnUse"
            >
              <stop className="box-bonus__stop-a" stopOpacity="0" />
              <stop offset="0.140227" className="box-bonus__stop-b" />
              <stop offset="0.480769" className="box-bonus__stop-c" />
              <stop offset="1" className="box-bonus__stop-d" />
            </linearGradient>
          </defs>
          <path className="box-bonus__line" d={LINE_D} stroke="url(#box-bonus-stroke)" strokeWidth={2} />
        </svg>
        {/* Halo dot on the line plus the drop line down to the pill. */}
        <img className="box-bonus__marker" src={chartMarker} alt="" width={36.361} height={137.417} />
      </div>

      <div className="bcard__text box-bonus__text">
        {/* One text node, deliberately. The phone frame breaks this title after
            "capital", and the obvious way to say so -- a <br> switched off above
            720 -- splits the string into two shaping runs, which moved the
            DESKTOP title by a subpixel: 160 pixels over 3 rows on pixel-diff,
            from markup that renders the same characters. The break is done in
            CSS instead; see .box-bonus__title in the mobile block. */}
        <h3 className="bcard__title box-bonus__title">Double your capital on first deposit</h3>
        <p className="bcard__body box-bonus__body">Up to $200 on your first deposit.</p>
      </div>

      {/* Frame 2085662868 — lightning badge, top right of the chart. */}
      <span className="box-bonus__badge box-bonus__badge--bolt" aria-hidden="true">
        <img className="box-bonus__glyph" src={iconBolt} alt="" width={28} height={28} />
      </span>

      {/* Frame 2085662871 — pie badge sitting on the line. Its three wedges are
          separate vector layers in Figma; each keeps its own leaf box. */}
      <span className="box-bonus__badge box-bonus__badge--pie" aria-hidden="true">
        <span className="box-bonus__pie">
          <img className="box-bonus__pie-a" src={pieA} alt="" width={11.244} height={8.4} />
          <img className="box-bonus__pie-b" src={pieB} alt="" width={12.324} height={12.327} />
          <img className="box-bonus__pie-c" src={pieC} alt="" width={20.745} height={24.675} />
        </span>
      </span>

      {/* Frame 2085662870 — deposit / bonus pill. */}
      <div className="box-bonus__pill" aria-hidden="true">
        <div className="box-bonus__row">
          <img className="box-bonus__wallet" src={walletBadge} alt="" width={42} height={42} />
          <span className="box-bonus__amt box-bonus__amt--deposit">
            <strong>+$200.00</strong>
            <small>Deposit</small>
          </span>
          <img className="box-bonus__plus" src={iconPlus} alt="" width={16} height={16} />
          <span className="box-bonus__amt box-bonus__amt--bonus">
            <strong>+$200.00</strong>
            <small>Bonus</small>
          </span>
        </div>
      </div>

      <a className="bento__cta bento__cta--orange box-bonus__cta" href="#bonus">
        <span className="box-bonus__cta-label"><Roll>Get Your Bonus</Roll></span>
        <span className="box-bonus__cta-arrow" aria-hidden="true">
          {/* Masked so the arrow follows the link; see BoxCustody.tsx.

              w/h are NOT cleared here, and that is the gate's finding rather
              than a preference: two rules match this glyph at the same
              specificity -- `.bento__cta img` at a flat 12x6 and
              `.box-bonus__cta-arrow img` in the card's container unit -- and
              the flat one wins the tie, so the <img> has always been 12x6 at
              every width. Clearing the inline box handed the element to the
              --u rule and moved it to 9.4 at 720 and 14.3 at 1100. The inline
              pair reproduces what the image actually rendered. */}
          <Icon src={arrowOrange} w={12} h={6} />
        </span>
      </a>
    </article>
  );
}

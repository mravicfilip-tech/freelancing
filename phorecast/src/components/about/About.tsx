/* The About page — Figma 531:148, a 1920 x 3660 frame.
   ---------------------------------------------------------------------------
   Six bands, top to bottom: the hero over the ember ground, CHOOSE AN EVENT,
   ABOUT PHORCAST, CAST YOUR CONVICTION, the comparison table, and the two
   primer cards. <Faq /> and <Footer /> are appended by App.tsx, so this file
   is the page's own content and nothing else.

   WHAT WAS REUSED RATHER THAN REBUILT
     - <Nav>, which brings the MORE menu with it.
     - <LiveDot> for every eyebrow. Six bands on the landing page draw that
       dot; the design's `Ellipses` + `Section Title` pair IS that pattern, so
       it is `.eyebrow` + <LiveDot> here too, not a new circle.
     - <Icon> for the two marks, which are the same Union path the wordmark
       already ships as `brand/mark.svg` -- see MARK below.
     - `.btn--primary`, `.container--wide`, `.eyebrow`, `.lede`.

   THE ONE ASSET DECISION WORTH READING. The table's ticks and crosses are NOT
   <Icon>s, and could not be. <Icon> is a CSS mask, and a mask keeps an alpha
   channel and throws the colour away -- Icon.tsx says so itself: "Use it ONLY
   for a file that is one flat colour on transparent." tick.svg is a green
   rounded square with a WHITE check on top of it and cross.svg is a red square
   with a white X; both are opaque across their whole box, so masking either
   one yields a solid rounded rectangle and the symbol disappears. They stay
   <img>, which is also why they need no light-mode work: a filled badge with a
   white glyph reads the same on paper as on black.

   THE MARK, twice. 531:231 (33.83 x 39.43) and 531:277 (26 x 30) are the same
   artwork as `src/assets/brand/mark.svg` -- proportional to five decimal
   places, checked by scaling the path's first coordinate against the viewBox
   -- differing only in the hex they bake, #E5331E where the wordmark bakes the
   artwork red #f03725. Through <Icon> that hex is discarded and the paint is
   `color`, so the codebase file is an exact match and two more near-duplicate
   SVGs did not need to land in src/assets. */

import type { CSSProperties } from 'react';
import { LiveDot } from '../LiveDot';
import { Icon } from '../Icon';
import { Nav } from '../Nav';
import { Roll } from '../Roll';
import { useSectionMotion } from '../../lib/motion';
import {
  buildAboutHero, buildChoose, buildBrand, buildConviction, buildCompare, buildPrimer,
} from './About.motion';
import mark from '../../assets/brand/mark.svg';
import cardPick from '../../assets/about/card-pick.png';
import cardSide from '../../assets/about/card-side.png';
import cardExit from '../../assets/about/card-exit.png';
import productShot from '../../assets/about/product-shot.png';
import tick from '../../assets/about/tick.svg';
import cross from '../../assets/about/cross.svg';
import logoKalshi from '../../assets/about/logo-kalshi.png';
import logoPolymarket from '../../assets/about/logo-polymarket.png';
import logoPredictfun from '../../assets/about/logo-predictfun.png';
import logoMagicmarkets from '../../assets/about/logo-magicmarkets.png';
import './About.css';
/* One per band, imported after About.css so a motion rule can override a
   layout one where it has to. See the header in any of them. */
import './About.hero.css';
import './About.brand.css';
import './About.conv.css';
import './About.cmp.css';

/* <Icon> writes `w`/`h` inline, which beats any stylesheet rule without
   `!important` -- so a mark given a box in `--u` would sit at a hard 26 x 30
   at every width while the table around it scaled, and clip against its own
   window. Passing the two properties back as `undefined` erases the inline
   values and hands the box to About.css, which is the same `cssBox` Pillars.tsx
   uses and for the same reason. */
const cssBox = { width: undefined, height: undefined } as CSSProperties;

/* ── The page's own ground ────────────────────────────────────────────────────
   The frame draws THREE backgrounds and all three are below. They are this
   frame's, not the landing hero's: every centre, radius, rotation, gradient
   endpoint, stop offset, fill opacity and gaussian sigma below is copied out
   of Figma's export of the node named on it, and nothing here is estimated
   from a render.

   WHY INLINE SVG RATHER THAN BLURRED BOXES. The landing hero paints its ground
   as five `border-radius: 50%` divs under `filter: blur()`, which is the right
   shape for what that is -- five upright discs at five offsets. This is not
   that. Three of the nine ellipses here are ROTATED and four carry linear
   gradients whose endpoints are nowhere near the shape's centre, and a CSS
   gradient is anchored to its box centre: every stop would have to be
   re-derived as a percentage of a rotated gradient line, which is arithmetic
   with nowhere to check itself. Four more are 1.36px STROKES, which a box
   cannot be at all. Inline SVG states the design's own numbers, and a viewBox
   scales all of them together -- geometry, stroke width and blur sigma -- from
   a single `width` in `--u`, which is the same responsive behaviour the rest
   of this page gets from its unit.

   NO HEX IS WRITTEN HERE. Every fill, stroke and stop below is a class and
   About.css holds the colour, beside the light block that moves it. So "what
   colour is this page" is still answered in one file, and paper is derived
   there rather than inverted here.

   WHAT COULD NOT BE REPRODUCED. 531:236 carries three Figma custom effects --
   Halftone (CMYK, dot 20, scale 1, softness 0), Lens distortion (lateral,
   distortion 0.5, aberration 0.2) and Dither (Bayer 16x16, pixel 2, 6 levels).
   Those are WebGPU shaders; there is no CSS that computes them, and the
   honest thing is to say so rather than to stand a dot pattern in for them.
   Nothing was substituted: the circle below is the same fill at the same blur
   the shader stack takes as its INPUT. That is defensible here and would not
   be everywhere -- the effects are running on a single flat #d1541c disc
   already blurred by sigma 75.6, so there is no detail in the source for a
   halftone screen or a 6-level dither to bite on, and Figma's own render of
   531:234 shows a smooth field with no visible dots, banding or fringe. */

/** 531:149 "Background Container" -> 531:151 "Circle": five ellipses, sigma
 *  33.2284, exported as one 1057.05 x 1626.06 drawing that the frame then
 *  rotates -90deg. The rotation stays in CSS (`.ab-ground__spin`) so the
 *  drawing below is the export's own coordinate system, unedited. */
function GroundCircles() {
  return (
    <svg className="ab-ground__art" viewBox="0 0 1057.05 1626.06" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <filter id="ab-g-f0" x="249.422" y="0" width="643.953" height="1171.76" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="33.2284" />
        </filter>
        <filter id="ab-g-f1" x="168.385" y="279.16" width="815.327" height="1068.4" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="33.2284" />
        </filter>
        <filter id="ab-g-f2" x="212.893" y="521.912" width="599.772" height="1104.15" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="33.2284" />
        </filter>
        <filter id="ab-g-f3" x="28.3423" y="529.437" width="775.882" height="997.867" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="33.2284" />
        </filter>
        <filter id="ab-g-f4" x="149.139" y="309.156" width="643.953" height="1171.76" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="33.2284" />
        </filter>
        <linearGradient id="ab-g-p0" x1="571.398" y1="66.4568" x2="675.501" y2="309.115" gradientUnits="userSpaceOnUse">
          <stop className="ab-stop--night" />
          <stop offset="1" className="ab-stop--blood" />
        </linearGradient>
        <linearGradient id="ab-g-p1" x1="819.981" y1="287.819" x2="576.049" y2="1332.78" gradientUnits="userSpaceOnUse">
          <stop className="ab-stop--rust" stopOpacity="0.47" />
          <stop offset="1" className="ab-stop--ember" />
        </linearGradient>
        <linearGradient id="ab-g-p2" x1="649.342" y1="548.444" x2="360.871" y2="1161.56" gradientUnits="userSpaceOnUse">
          <stop className="ab-stop--clear" stopOpacity="0" />
          <stop offset="0.471154" className="ab-stop--ember" />
          <stop offset="1" className="ab-stop--ember" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ab-g-p3" x1="552.846" y1="502.829" x2="264.376" y2="1115.94" gradientUnits="userSpaceOnUse">
          <stop className="ab-stop--clear" stopOpacity="0" />
          <stop offset="0.471154" className="ab-stop--ember" />
          <stop offset="1" className="ab-stop--ember" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 531:153 Ellipse 39 */}
      <g filter="url(#ab-g-f0)"><ellipse cx="571.398" cy="585.879" rx="255.52" ry="519.422" fill="url(#ab-g-p0)" /></g>
      {/* 531:154 Ellipse 40 */}
      <g filter="url(#ab-g-f1)"><ellipse cx="576.049" cy="813.36" rx="255.52" ry="519.422" transform="rotate(150 576.049 813.36)" fill="url(#ab-g-p1)" /></g>
      {/* 531:155 Ellipse 42 */}
      <g filter="url(#ab-g-f2)"><ellipse cx="512.779" cy="1073.99" rx="143.051" ry="519.422" transform="rotate(21.6761 512.779 1073.99)" fill="url(#ab-g-p2)" /></g>
      {/* 531:156 Ellipse 43 */}
      <g filter="url(#ab-g-f3)"><ellipse cx="416.283" cy="1028.37" rx="143.051" ry="519.422" transform="rotate(144.804 416.283 1028.37)" fill="url(#ab-g-p3)" /></g>
      {/* 531:157 Ellipse 41 */}
      <g filter="url(#ab-g-f4)"><ellipse cx="471.116" cy="895.035" rx="255.52" ry="519.422" className="ab-fill--peach" fillOpacity="0.27" /></g>
    </svg>
  );
}

/** 531:158 "Container" -> 531:160..163: four concentric ellipse OUTLINES,
 *  1.35988px, blurred at sigma 5, each stroked with the same transparent ->
 *  #ff632a -> transparent ramp across its own width. The export is 1250 x 744
 *  for a 1170 x 664 box (the blur's own bleed), and the frame mirrors it
 *  vertically -- `.ab-conv__field` does the mirror. */
function ConvictionArcs() {
  return (
    <svg className="ab-conv__art" viewBox="0 0 1250 744" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <filter id="ab-c-f0" x="0" y="0" width="1250" height="744" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {[
          { id: 'ab-c-p0', x1: 264.331, x2: 1034.01, y: 366.718 },
          { id: 'ab-c-p1', x1: 191.822, x2: 1088.39, y: 370.113 },
          { id: 'ab-c-p2', x1: 151.033, x2: 1126.16, y: 375.395 },
          { id: 'ab-c-p3', x1: 40, x2: 1210, y: 377.659 },
        ].map((g) => (
          <linearGradient key={g.id} id={g.id} x1={g.x1} y1={g.y} x2={g.x2} y2={g.y} gradientUnits="userSpaceOnUse">
            <stop className="ab-stop--paper" stopOpacity="0" />
            <stop offset="0.495192" className="ab-stop--flare" />
            <stop offset="1" className="ab-stop--ash" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <g filter="url(#ab-c-f0)" fill="none" strokeWidth="1.35988">
        {/* 531:160 Ellipse 4 */}
        <ellipse cx="649.17" cy="366.718" rx="384.16" ry="326.039" stroke="url(#ab-c-p0)" />
        {/* 531:161 Ellipse 5 */}
        <ellipse cx="640.108" cy="370.113" rx="447.605" ry="324.907" stroke="url(#ab-c-p1)" />
        {/* 531:162 Ellipse 6 */}
        <ellipse cx="638.596" cy="375.395" rx="486.883" ry="323.397" stroke="url(#ab-c-p2)" />
        {/* 531:163 Ellipse 7 */}
        <ellipse cx="625" cy="377.659" rx="584.32" ry="325.661" stroke="url(#ab-c-p3)" />
      </g>
    </svg>
  );
}

/** 531:233 "root" -> 531:234 "Ellipses": three r=532.138 discs at sigma
 *  75.585, drawn here in the 1282.8 x 1381 box 531:234 occupies inside the
 *  ABOUT PHORCAST card. The three sit at the card's 871 mark -- the same mark
 *  `.ab-brand__visual` starts at -- and the card's `overflow: hidden` is what
 *  crops them, exactly as the frame's does. */
function BrandEllipses() {
  return (
    <svg className="ab-brand__art" viewBox="0 0 1282.801 1381" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        {/* THREE SIGMA, NOT TWO, and this is the one number below that is
            not Figma's own. Figma's SVG export states each filter region as
            the circle's box plus exactly 2 sigma -- 151.17 here -- and cuts
            the gaussian there. At 2 sigma the curve is still at 13.5% of
            peak, so the cut is a visible straight edge, and on THIS field it
            lands on the only part the card ever shows: the disc's left
            shoulder beside the product shot. Figma's canvas does not cut
            there; its own export does. 226.755 is 3 sigma, where the curve
            is at 1.1% and the edge is gone. Nothing else about the blur
            moves -- same sigma, same centres, same radii. */}
        <filter id="ab-b-f0" x="-217.075" y="-226.755" width="1517.786" height="1517.786" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="75.585" />
        </filter>
        <filter id="ab-b-f1" x="-226.755" y="-0.625" width="1517.786" height="1517.786" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="75.585" />
        </filter>
        <filter id="ab-b-f2" x="-8.235" y="89.965" width="1517.786" height="1517.786" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="75.585" />
        </filter>
        {/* The export's own gradient, carried through the node's
            `scale(-1, 1)` about its own centre so the two endpoints land
            where the frame puts them rather than mirrored. */}
        <linearGradient id="ab-b-p0" x1="541.778" y1="0.04" x2="482.306" y2="281.841" gradientUnits="userSpaceOnUse">
          <stop className="ab-stop--night" />
          <stop offset="1" className="ab-stop--blood" />
        </linearGradient>
      </defs>
      {/* 531:235 Ellipse 39 */}
      <g filter="url(#ab-b-f0)"><circle cx="541.818" cy="532.138" r="532.138" fill="url(#ab-b-p0)" /></g>
      {/* 531:236 Ellipse 40 — the shader stack's input; see the note above */}
      <g filter="url(#ab-b-f1)"><circle cx="532.138" cy="758.268" r="532.138" className="ab-fill--ember" /></g>
      {/* 531:237 Ellipse 41 */}
      <g filter="url(#ab-b-f2)"><circle cx="750.658" cy="848.858" r="532.138" className="ab-fill--peach" /></g>
    </svg>
  );
}

/* ── 1. Hero ──────────────────────────────────────────────────────────────── */

function AboutHero() {
  // Above the fold by definition, so it does not go through the observer —
  // the same call the landing hero makes, and for the same reason.
  const ref = useSectionMotion<HTMLElement>(buildAboutHero, { immediate: true });
  return (
    <section ref={ref} className="ab-hero" id="top" data-motion="pending">
      {/* 531:149 "Background Container": 1920 x 1154 at the very top of the
          frame, clipping a 1920 x 1140 window over the rotated Circle group.
          It is anchored to the top of this section because that is where the
          frame anchors it -- frame y 0 is this element's top edge, the nav
          sitting 40 below it in both. */}
      <div className="ab-ground" aria-hidden="true">
        <div className="ab-ground__clip">
          <div className="ab-ground__spin"><GroundCircles /></div>
        </div>
      </div>

      <div className="container container--wide ab-col ab-hero__inner">
        <Nav />
        <div className="ab-hero__copy">
          <h1 className="ab-hero__title">A prediction market for real-world events — simple and transparent</h1>
          <p className="lede ab-hero__lede">
            You buy an “opinion” (YES/NO) like a stock: you can hold it until the event resolves or sell earlier and lock in profit while market expectations shift.
          </p>
          <a href="#signup" className="btn btn--primary ab-hero__cta"><Roll>Get Started</Roll></a>
        </div>
      </div>
    </section>
  );
}

/* ── 2. Choose an event ───────────────────────────────────────────────────── */

/** The three cards' copy, and the crop each screenshot sits at in its window.
 *
 *  The three images are placed the way 531:190 / 531:199 / 531:208 place them:
 *  a 524 x 238 window with the right corners rounded, and a screenshot larger
 *  than the window offset inside it. The numbers below are those offsets
 *  restated as percentages OF THE WINDOW, which is the only form that survives
 *  the window becoming fluid — Figma states them as a box inside a box inside
 *  a box, and three nested percentage bases do not fold into a stylesheet. */
const CARDS = [
  {
    key: 'pick',
    img: cardPick,
    title: 'Pick a market',
    body: ['Hundreds of markets across crypto, stocks, forex, indices, commodities and sports. Find one you have a view on.'],
    crop: { left: '0%', top: '-18.24%', width: '140.65%', height: '151.44%' },
  },
  {
    key: 'side',
    img: cardSide,
    title: 'Take a side',
    body: ['Every market has two options: buy YES or buy NO.', 'Pick the one you think wins'],
    crop: { left: '-0.757%', top: '0.4%', width: '119.15%', height: '116.39%' },
  },
  {
    key: 'exit',
    img: cardExit,
    title: 'Exit when you want',
    body: ['Hold to resolution or sell early to lock in profit or cut a loss — just like trading a stock.'],
    crop: { left: '-4.641%', top: '0.13%', width: '115.76%', height: '114.29%' },
  },
] as const;

function Choose() {
  const ref = useSectionMotion<HTMLElement>(buildChoose);
  return (
    <section ref={ref} className="ab-choose" aria-labelledby="ab-choose-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-choose__inner">
          <h2 className="eyebrow" id="ab-choose-title"><LiveDot />Choose an event</h2>
          <ul className="ab-choose__row">
            {CARDS.map((c) => (
              <li key={c.key} className="ab-card">
                <div className="ab-card__shot">
                  <img src={c.img} alt="" className="ab-card__img" style={c.crop} decoding="async" />
                </div>
                <div className="ab-card__text">
                  <h3 className="ab-card__title">{c.title}</h3>
                  <p className="ab-card__body">
                    {c.body.map((line, i) => (
                      <span key={line}>{i > 0 && <br />}{line}</span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── 3. About Phorcast ────────────────────────────────────────────────────── */

function Brand() {
  const ref = useSectionMotion<HTMLElement>(buildBrand);
  return (
    <section ref={ref} className="ab-brand" aria-labelledby="ab-brand-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-brand__inner">
          <h2 className="eyebrow" id="ab-brand-title"><LiveDot />About Phorcast</h2>
          <div className="ab-brand__card">
            {/* 531:234, first in paint order so it sits under both the copy
                and the product shot, exactly as the frame stacks it. */}
            <div className="ab-brand__field" aria-hidden="true"><BrandEllipses /></div>
            <div className="ab-brand__copy">
              <Icon src={mark} w={33.827} h={39.432} className="ab-brand__mark" style={cssBox} />
              <div className="ab-brand__prose">
                <p>
                  <strong>Phorcast</strong> is a prediction market platform where you trade on what happens next. Take a position on hundreds of markets across sports, crypto, stocks, forex, indices, commodities, and real-world assets from the next five minutes to the next twelve months.
                </p>
                <p>
                  Every contract is simple: pick a market, pick a side, stake your conviction. No leverage, no liquidations, no margin calls.<br />
                  Your maximum loss is always the amount you put in.
                </p>
              </div>
            </div>

            {/* 531:238 / 531:239 / 531:240. Each one is the node's own export,
                which Figma already clipped to the card — so the three files
                are the visible part at 1.5x and not three multi-megabyte
                source photographs cropped again in the browser. Paint order
                is the design's: body, lower panel, upper panel. */}
            {/* `loading="lazy"` and `decoding="async"` on all three, and this
                is the one performance decision on the page. They are the only
                large rasters here -- 82, 132 and 173 KB -- and they sit a
                screen and a half down. Decoded eagerly on the main thread they
                land in the middle of the bands above them building their
                entrances, and a blocked main thread does not advance a GSAP
                timeline (lag smoothing is on, deliberately; src/lib/motion.ts
                says why). Measured at 1600 before this, the CHOOSE band's
                sampler saw 16 frames in five seconds. */}
            <div className="ab-brand__visual" aria-hidden="true">
              <img src={productShot} alt="" className="ab-brand__shot" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 4. Cast your conviction ──────────────────────────────────────────────── */

function Conviction() {
  const ref = useSectionMotion<HTMLElement>(buildConviction);
  return (
    <section ref={ref} className="ab-conv" aria-labelledby="ab-conv-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-conv__inner">
          {/* 531:158's arc ARCS OVER THE LABEL -- that is what the band is,
              and it is the one relationship in this field worth holding. So
              the field hangs off the eyebrow rather than off the top of the
              band: `.ab-conv__crown` in About.css says why the band's own top
              is the wrong thing to measure from. */}
          <div className="ab-conv__crown">
            <div className="ab-conv__field" aria-hidden="true"><ConvictionArcs /></div>
            <h2 className="eyebrow" id="ab-conv-title"><LiveDot />Cast your conviction</h2>
          </div>
          {/* The opening runs bright and turns over to the accent on its last
              letter; the rest sits back. See the note on `.ab-conv__statement`
              in About.css for how the design does that and why it is a
              background on the whole block rather than a span. */}
          <p className="ab-conv__statement">
            We were founded{' '}
            <span className="ab-conv__rest">
              by traders and fintech professionals who spent years on derivative and crypto platforms and wanted something cleaner, a market that&apos;s easy to read, fast to trade and deep enough to fill your size. That&apos;s what we&apos;re building.
            </span>
          </p>
          <p className="ab-conv__goal">
            Our goal is straightforward: to become the platform serious traders choose when they want to trade outcomes, not just price.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── 5. How it works: price and profit ────────────────────────────────────── */

const CRITERIA = [
  'Trade Sports, Crypto & RWAs',
  'No KYC Account Opening',
  'Own Native Token',
  'Offer Sign-up Bonus',
  'Multi-chain Access',
] as const;

/** Column header plus its five answers, in the frame's own order. `logo` is
 *  null for Phorcast, whose mark is the codebase's own `brand/mark.svg`. */
const BRANDS: { name: string; logo: string | null; box: string; yes: boolean[] }[] = [
  { name: 'Phorcast', logo: null, box: 'ab-cmp__logo--phorcast', yes: [true, true, true, true, true] },
  { name: 'Kalshi', logo: logoKalshi, box: 'ab-cmp__logo--kalshi', yes: [true, false, false, true, false] },
  { name: 'Polymarket', logo: logoPolymarket, box: 'ab-cmp__logo--polymarket', yes: [true, true, true, true, false] },
  { name: 'Predict.fun', logo: logoPredictfun, box: 'ab-cmp__logo--predictfun', yes: [true, true, true, false, false] },
  { name: 'MagicMarkets', logo: logoMagicmarkets, box: 'ab-cmp__logo--magicmarkets', yes: [false, true, false, false, false] },
];

function Compare() {
  const ref = useSectionMotion<HTMLElement>(buildCompare);
  return (
    <section ref={ref} className="ab-cmp" aria-labelledby="ab-cmp-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-cmp__inner">
          <h2 className="eyebrow" id="ab-cmp-title"><LiveDot />How it works: price and profit</h2>
          <div className="ab-cmp__card">
            {/* A real <table>, because this is a real table: five criteria
                against five venues, and a screen reader should be able to ask
                "what does Kalshi do about KYC" and be answered by the row and
                column headers rather than by reading order. The scroller is
                what the phone block below turns on; at desktop widths it
                never scrolls. */}
            <div className="ab-cmp__scroll">
              <table className="ab-cmp__table">
                <thead>
                  <tr>
                    <th scope="col" className="ab-cmp__crit ab-cmp__crit--head">Criterion</th>
                    {BRANDS.map((b) => (
                      <th key={b.name} scope="col" className="ab-cmp__brand">
                        <span className={`ab-cmp__logo ${b.box}`}>
                          {b.logo
                            ? <img src={b.logo} alt="" loading="lazy" decoding="async" />
                            : <Icon src={mark} w={26} h={30} className="ab-cmp__mark" style={cssBox} />}
                        </span>
                        <span className="ab-cmp__name">{b.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA.map((c, row) => (
                    <tr key={c}>
                      <th scope="row" className="ab-cmp__crit">{c}</th>
                      {BRANDS.map((b) => (
                        <td key={b.name}>
                          <img
                            className="ab-cmp__vote"
                            src={b.yes[row] ? tick : cross}
                            alt={b.yes[row] ? 'Yes' : 'No'}
                            width={38.5}
                            height={38.5}
                            decoding="async"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 6. Why is it better than bets or crypto/stocks? ──────────────────────── */

function Primer() {
  const ref = useSectionMotion<HTMLElement>(buildPrimer);
  return (
    <section ref={ref} className="ab-why" aria-labelledby="ab-why-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-why__inner">
          <h2 className="eyebrow" id="ab-why-title"><LiveDot />Why is it better than bets or crypto/stocks?</h2>
          <div className="ab-why__row">
            <article className="ab-why__card">
              <h3 className="ab-why__title">How Trading Prediction Markets Work?</h3>
              <div className="ab-why__body">
                <p className="ab-why__lead">Price = what the market thinks will happen</p>
                <ul className="ab-why__list">
                  <li>Every outcome trades at a price between 1¢ and 99¢.</li>
                  <li>That price is the market&apos;s probability. YES at 70¢ means the market puts a 70% chance on it happening.</li>
                  <li>If you&apos;re right, each contract pays out $1. Buy at 70¢, win, collect $1 — your profit is 30¢ per contract.</li>
                  <li>Prices move as traders buy and sell. When new information hits, the price hits with it.</li>
                </ul>
              </div>
            </article>

            <article className="ab-why__card">
              <h3 className="ab-why__title">Example</h3>
              <div className="ab-why__body">
                <p>YES is trading at 70¢ — the market gives this outcome a 70% chance.</p>
                <p>
                  <strong>You back YES with $1,000.</strong><br />
                  That buys you 1,428 contracts. If the event happens, each one pays $1 — you collect $1,428. Profit: $428 (+43%).
                </p>
                <p>
                  <strong>You think the market&apos;s wrong and back NO at 30¢.</strong><br />
                  That buys you 3,333 contracts. If the event doesn&apos;t happen, you collect $3,333. Profit: $2,333 (+233%).
                </p>
                <p className="ab-why__close">Either way, your maximum loss is the $1,000 you put in.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <>
      <AboutHero />
      <Choose />
      <Brand />
      <Conviction />
      <Compare />
      <Primer />
    </>
  );
}

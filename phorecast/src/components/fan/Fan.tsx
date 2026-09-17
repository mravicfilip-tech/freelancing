// Raw, not a URL. The band's entrance draws its sixteen arcs one at a time with
// `stroke-dashoffset`, and nothing inside an `<img>` is addressable: the file is
// one opaque bitmap to the document that embeds it. Hero slide 3 took the same
// route for the same reason -- see `SlideBonus.tsx` -- and the arcs paint
// identically either way, because the SVG already carries
// `preserveAspectRatio="none"` and so stretches into whatever box the CSS gives
// it exactly as the image did.
import type { CSSProperties } from 'react';
import fanLowerRaw from '../../assets/fan/fan-lower.svg?raw';
import fanUpperRaw from '../../assets/fan/fan-upper.svg?raw';
import iconCrypto from '../../assets/fan/icon-crypto.svg';
import iconFinance from '../../assets/fan/icon-finance.svg';
import iconGeopolitics from '../../assets/fan/icon-geopolitics.svg';
import iconTech from '../../assets/fan/icon-tech.svg';
import iconElections from '../../assets/fan/icon-elections.svg';
import iconSportA from '../../assets/fan/icon-sport-a.svg';
import iconSportB from '../../assets/fan/icon-sport-b.svg';
import iconSportC from '../../assets/fan/icon-sport-c.svg';
import tileBg from '../../assets/fan/tile-bg.jpg';
import tileLogo from '../../assets/fan/tile-logo.svg';
import { Icon } from '../Icon';
import { useSectionMotion } from '../../lib/motion';
import { buildFan } from './Fan.motion';
import { fanLoop } from './Fan.loop';
import './Fan.css';

/* All coordinates are screenshot space inside the 1920 x 675 frame. The third
   column is a role, not a colour: Figma's twelve fills are six #e5331e, four
   #fffbf8 and two greys, which is `accent`, `ink` and the two quiet ones. The
   colours themselves are in Fan.css, so a theme can reach them and this table
   stays geometry. */
const DIAMONDS = [
  [23, 351.9, 'accent'], [97, 429, 'accent'], [440, 91, 'mute'],
  [401, 480, 'accent'], [183.9, 469.5, 'ink'], [337.2, 280.1, 'ink'],
  [1886.1, 430.5, 'accent'], [1812.1, 353.3, 'accent'], [1508.1, 86.3, 'mute-2'],
  [1508.1, 302.3, 'accent'], [1725.2, 312.8, 'ink'], [1571.9, 502.3, 'ink'],
] as const;

/**
 * A pill glyph, masked rather than painted.
 *
 * All eight of these files are one flat #9d9d9d on transparent, which is why
 * the loop had to whiten them with `brightness(0) invert(1)`: `color` could
 * not reach inside an <img>. As a mask they are ordinary CSS colour, the
 * filter is deleted outright, and the lit state becomes the same plain colour
 * transition the label next to it already makes.
 *
 * SIZE, which is the one place a mask conversion can move geometry and did.
 * `Icon` writes a width and a height inline, and there are two different
 * answers here:
 *
 *  - The six pill glyphs are sized by the stylesheet, `calc(16 * var(--f))`,
 *    so they scale with the band. An inline pixel size would freeze them at
 *    one width. `undefined` in `style` overrides Icon's own width/height and
 *    hands the box straight back to the stylesheet.
 *  - The three sport pieces are NOT. They are absolutely positioned with all
 *    four insets, and an <img> is a replaced element: `width: auto` resolves
 *    to the file's intrinsic size and the over-constrained `right`/`bottom`
 *    are dropped. So they ship at a fixed 10.85 x 15.81, 3.13 and 1.97 CSS px
 *    at every width, and a <span> — not replaced — would have taken its box
 *    from the insets instead and shrunk by a third at 1100. Passing the
 *    intrinsic numbers reproduces the <img> exactly. (That they do not scale
 *    with the band is how this shipped; it is not something to fix here.)
 *
 * The one thing the conversion does cost, and it is worth knowing about
 * before this is done 129 more times: a masked element is composited, and a
 * pill with one inside it renders its label with greyscale antialiasing
 * rather than subpixel. Measured over GEOPOLITICS at 1600, the label's mean
 * luminance moves 32.2 -> 30.8 of 255 — the type reads a hair lighter. It is
 * the same effect `Fan.css` records against `will-change` on the copy, it is
 * invisible to `theme-diff.mjs` (antialiasing is not a computed property),
 * and there is no way to keep both the mask and the subpixel rendering.
 */
const CSS_SIZED: CSSProperties = { width: undefined, height: undefined };

/** A pill glyph, sized by Fan.css. */
function Glyph({ src }: { src: string }) {
  return <Icon src={src} w={0} h={0} style={CSS_SIZED} />;
}

/** One sport piece, sized by the file, exactly as the <img> was. */
function SportPiece({ src, w, h, className }: { src: string; w: number; h: number; className: string }) {
  return <Icon src={src} w={w} h={h} className={className} />;
}

function SportIcon() {
  return (
    <span className="fan__sport">
      <SportPiece src={iconSportA} w={10.8535} h={15.8064} className="fan__sport-a" />
      <SportPiece src={iconSportB} w={3.12615} h={3.12615} className="fan__sport-b" />
      <SportPiece src={iconSportC} w={1.96923} h={1.96923} className="fan__sport-c" />
    </span>
  );
}

/* Figma fixes the three left pills at 120 and hugs the label on the right three. */
const PILLS = [
  { label: 'Crypto', x: 502, y: 212, w: 120, icon: <Glyph src={iconCrypto} /> },
  { label: 'Sport', x: 201, y: 536, w: 120, icon: <SportIcon /> },
  { label: 'Finance', x: 553, y: 558, w: 120, icon: <Glyph src={iconFinance} /> },
  { label: 'Geopolitics', x: 1581, y: 188, w: 149, icon: <Glyph src={iconGeopolitics} /> },
  { label: 'Tech', x: 1639, y: 512, w: 90, icon: <Glyph src={iconTech} /> },
  { label: 'Elections', x: 1372, y: 556, w: 132, icon: <Glyph src={iconElections} /> },
];

const RAW = { upper: fanUpperRaw, lower: fanLowerRaw } as const;

/**
 * One instance of an arc file, ready to be dropped into the document.
 *
 * Three things happen on the way past, and the first is not optional:
 *
 * IDS. Each file names its gradients `paint0_linear_0_17` and so on, and this
 * band puts four copies of the two files into one document. Duplicate ids all
 * resolve to whichever came first, and these gradients are `userSpaceOnUse`
 * with per-path coordinates, so the collision does not merely repeat one fade —
 * it re-aims the fade of fifteen arcs onto a sixteenth's geometry, silently and
 * without an error anywhere. Every id and every `url(#…)` therefore takes a
 * per-instance prefix. (Spaces go too: `id="Group 2"` is legal in SVG and not a
 * legal CSS identifier, which matters the moment anything selects on it.)
 *
 * THE SPARK TWIN. The entrance runs a bright head along each arc, which is a
 * second copy of the same path with a short dash pinned to the leading edge.
 * The twins are emitted here, in the markup, rather than cloned into the DOM by
 * the motion: a module that mutates the tree it animates accumulates a fresh
 * set of clones on every hot rebuild, and a clone left behind by a reverted
 * timeline paints as a solid bright ellipse. Shipped in the markup they are
 * exactly four per file, always, and `.fan__spark` holds them at opacity 0 so
 * the band at rest is unchanged whether the entrance ever runs or not.
 *
 * THE NO-OP BLUR. Figma wraps each group in a filter whose only operation is a
 * `stdDeviation="0"` gaussian — it paints nothing and costs a full filter pass
 * per frame on sixteen paths that are being redrawn every frame. Dropped, with
 * the resting render compared at 6x to confirm it is genuinely a no-op.
 */
function inlineArcs(half: 'upper' | 'lower', instance: string): string {
  const n = `fan-${instance}-${half}-`;
  return RAW[half]
    .replace(/\sfilter="url\(#[^"]*\)"/g, '')
    .replace(/id="([^"]+)"/g, (_m, a: string) => `id="${n}${a.replace(/\s+/g, '_')}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, a: string) => `url(#${n}${a.replace(/\s+/g, '_')})`)
    .replace('<svg ', `<svg class="fan__lines fan__lines--${half}" `)
    .replace(/<stop\b[^>]*\/>/g, classStop)
    .replace(/<path\b[^>]*\/>/g, (p) => p + sparkTwin(p));
}

/**
 * COLOUR. Both files carry the same three stops, four times over: a
 * transparent head, `#f03725` at the middle, a transparent tail. The middle
 * one is the only paint anybody ever sees; the other two are there to fade it
 * out at each end and carry `stop-opacity="0"`.
 *
 * `stop-color` is a CSS property as well as a presentation attribute, and CSS
 * wins over the attribute — so a class per stop is enough to put the whole
 * gradient under the theme. That is worth stating plainly, because the
 * strategy's class-F recipe is a per-theme transform of the raw string: this
 * needs no second copy of the string at module scope, no re-render of the
 * arcs when the theme flips, and it leaves the id-prefix pipeline above
 * completely alone. The baked attribute stays underneath as the fallback.
 *
 * Figma exports `#f03725` lowercase here and `#F9F0E8` / `#D5D2D0` uppercase
 * in the same file, so the lookup is case-insensitive on principle.
 */
const STOP_ROLE: Record<string, string> = {
  '#f9f0e8': 'fan__stop--in',
  '#f03725': 'fan__stop--core',
  '#d5d2d0': 'fan__stop--out',
};

function classStop(stop: string): string {
  const hex = /stop-color="([^"]+)"/.exec(stop)?.[1]?.toLowerCase() ?? '';
  const role = STOP_ROLE[hex];
  return role ? stop.replace('<stop ', `<stop class="${role}" `) : stop;
}

/**
 * The bright head's path: the same geometry, flat colour, no gradient, no id.
 *
 * The peach stays baked here as the fallback and `.fan__spark` sets `stroke`
 * from a token on top of it — CSS beats a presentation attribute, so the head
 * follows the theme with nothing about this string changing. `currentColor`
 * would have done the same job, but it also rewrites the element's computed
 * `color`, and with it the four currentColor-derived border colours the
 * regression gate records on all thirty-two twins. Setting `stroke` directly
 * moves exactly the one property that paints.
 *
 * On paper this head has to be DARK. A pale head on cream is nothing at all.
 */
function sparkTwin(path: string): string {
  return path
    .replace(/\sid="[^"]*"/, '')
    .replace(/stroke="[^"]*"/, 'stroke="#ffc0a4"')
    .replace(/stroke-width="[^"]*"/, 'stroke-width="2.4"')
    .replace('<path ', '<path class="fan__spark" ');
}

/** Both arc groups share one 863 x 675 sub-frame; the left one is mirrored. */
const ARCS = {
  left: inlineArcs('upper', 'l') + inlineArcs('lower', 'l'),
  right: inlineArcs('upper', 'r') + inlineArcs('lower', 'r'),
} as const;

function Arcs({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className={`fan__arcs fan__arcs--${side}`}
      dangerouslySetInnerHTML={{ __html: ARCS[side] }}
    />
  );
}

export function Fan() {
  // Scroll-gated on the default margin: the band has to climb a quarter of the
  // screen before it opens, so the sliver showing under the section above is
  // not enough to spend the entrance on.
  //
  // The ambient loop is handed the band on the entrance's `onComplete`, so the
  // two never read as one continuous movement.
  const ref = useSectionMotion<HTMLElement>(buildFan, { idle: fanLoop });

  return (
    <section ref={ref} className="fan" aria-labelledby="fan-title" data-motion="pending">
      <div className="fan__frame">
        <div aria-hidden="true">
          <Arcs side="left" />
          <Arcs side="right" />
          {DIAMONDS.map(([x, y, role], i) => (
            <span key={i} className={`fan__diamond fan__diamond--${role}`} style={{ ['--x' as string]: x, ['--y' as string]: y }} />
          ))}
          {PILLS.map((p) => (
            <span
              key={p.label}
              className="fan__pill"
              style={{ ['--x' as string]: p.x, ['--y' as string]: p.y, ['--w' as string]: p.w }}
            >
              {p.icon}{p.label}
            </span>
          ))}
        </div>

        <div className="fan__tile" aria-hidden="true">
          <img src={tileBg} alt="" className="fan__tile-bg" />
          <span className="fan__glass"><img src={tileLogo} alt="" /></span>
        </div>
        {/* Both copy blocks are centred with `translateX(-50%)`, which GSAP would
            resolve to a pixel value the moment it touched the block. The inner
            span is what the entrance moves and blurs; the block itself is never
            a tween target. */}
        <h2 id="fan-title" className="fan__title"><span className="fan__in">Your Funds Stay in Your Control</span></h2>
        <p className="fan__sub">
          <span className="fan__in">
            Your assets stay under your control through non-custodial infrastructure and transparent on-chain settlement.
          </span>
        </p>
      </div>
    </section>
  );
}

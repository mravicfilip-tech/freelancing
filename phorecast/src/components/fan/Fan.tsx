// Raw, not a URL. The entrance draws the sixteen arcs one at a time with
// `stroke-dashoffset`, and nothing inside an `<img>` is addressable. Hero slide 3
// does the same (see `SlideBonus.tsx`). The arcs paint identically either way,
// because the SVG carries `preserveAspectRatio="none"` and stretches into
// whatever box the CSS gives it.
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
 * All eight files are one flat #9d9d9d on transparent. As masks they take
 * ordinary CSS colour, so the lit state is the same plain colour transition
 * the label beside it makes, with no filter.
 *
 * Sizing has two cases, because `Icon` writes a width and height inline:
 *
 *  - The six pill glyphs are sized by the stylesheet (`calc(16 * var(--f))`),
 *    so they scale with the band. `undefined` in `style` overrides Icon's
 *    inline size and hands the box back to the stylesheet.
 *  - The three sport pieces are absolutely positioned with all four insets.
 *    As <img> elements, `width: auto` resolved to the file's intrinsic size, so
 *    they render at a fixed 10.85 x 15.81, 3.13 and 1.97 CSS px at every width;
 *    passing those numbers reproduces that. They do not scale with the band.
 *
 * Gotcha: a masked element is composited, so a pill containing one renders
 * its label with greyscale rather than subpixel antialiasing, a hair lighter.
 * There is no way to keep both the mask and subpixel text.
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
 * IDS. Each file names its gradients `paint0_linear_0_17` and so on, and the
 * band puts four copies of the two files into one document. Duplicate ids
 * resolve to whichever came first, and these gradients are `userSpaceOnUse`
 * with per-path coordinates, so a collision silently re-aims fifteen arcs'
 * fades onto a sixteenth's geometry. Every id and `url(#…)` therefore takes a
 * per-instance prefix. Spaces are replaced too: `id="Group 2"` is valid SVG
 * but not a valid CSS identifier.
 *
 * THE SPARK TWIN. The entrance runs a bright head along each arc: a second copy
 * of the path with a short dash. The twins are emitted in the markup rather
 * than cloned by the motion, because cloning into the tree it animates piles up
 * clones on every hot rebuild, and a clone left by a reverted timeline paints
 * as a solid bright ellipse. `.fan__spark` holds them at opacity 0, so the band
 * at rest is the same whether the entrance runs or not.
 *
 * THE NO-OP BLUR. Figma wraps each group in a `stdDeviation="0"` gaussian
 * filter, which paints nothing but costs a filter pass per frame. Dropped.
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
 * transparent head, `#f03725` at the middle, a transparent tail. Only the
 * middle one is ever visible.
 *
 * `stop-color` is a CSS property as well as a presentation attribute, and CSS
 * wins, so a class per stop puts the whole gradient under the theme with no
 * per-theme copy of the string and no re-render when the theme flips. The
 * baked attribute stays underneath as the fallback.
 *
 * Figma exports these hexes in mixed case, so the lookup is case-insensitive.
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
 * The peach stays baked as the fallback and `.fan__spark` sets `stroke` from a
 * token over it, so the head follows the theme. `currentColor` would also work
 * but rewrites the element's computed `color` too; setting `stroke` moves only
 * the property that paints. On paper the head has to be dark.
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
  // Scroll-gated on the default margin (a quarter of the screen), so the sliver
  // showing under the section above does not trigger the entrance. The ambient
  // loop is handed the band on the entrance's `onComplete`.
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
        <h2 id="fan-title" className="fan__title"><span className="fan__in">Where Every Outcome Connects</span></h2>
        <p className="fan__sub">
          <span className="fan__in">
            Explore prediction markets across sports, finance, crypto, elections, technology, and geopolitics, all brought together in one place.
          </span>
        </p>
      </div>
    </section>
  );
}

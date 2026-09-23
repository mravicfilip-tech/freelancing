/* Bento box D — "Forecast Global Markets in One Place" (Figma 365:1063).
 *
 * The one light card in the grid: a 776 x 440 cream surface carrying dark type,
 * inverted from its three dark siblings. Everything below is the approved
 * static design at 1:1 design pixels — no motion of any kind lives here. The
 * `motion/markets.ts` module owns the load-in and the orbiting loop; it reads
 * this markup through the class names and `data-market` attributes below.
 *
 * Layout note. Figma's card is `flex items-center justify-between` around a
 * single flex child (365:1090) whose two text rows sit 310 apart. That column
 * is 382.4 tall inside a 378 content box, so it overflows 2.2 top and bottom —
 * which is why the heading starts at y 28.8 rather than 31, and why the link
 * ends 28.8 above the bottom edge rather than flush with the padding. Pinning
 * those offsets by hand would be brittle, so `.box-markets` centres a real
 * `.mk__stage` column exactly as the design does and lets the browser arrive at
 * the same numbers. The two artwork layers Figma parents to 365:1090 sit inside
 * that stage for the same reason: they travel with it instead of drifting.
 *
 * Coordinate note. Every offset here is a design pixel scaled by `--u`, the
 * card's own container unit (see BoxMarkets.css), so the box scales with the
 * grid cell it is handed rather than with the viewport. Tile offsets are the
 * ones Figma reports, measured from each tile's OUTER edge — which works only
 * because the tile rings are painted as inset shadows rather than borders (see
 * BoxMarkets.css: Chrome snaps a 0.56 border to 1px and would drag every glyph
 * off by the difference). The tiles genuinely differ in outer size, corner,
 * ring weight and inner inset, so none of that is expressed as a shared rule.
 */
/* NOT the shared assets/bento/grid.svg: that copy has had its gradient
   mid-stops flipped to white so the mesh reads on the dark cards. On cream the
   mesh has to be ink, which is what Figma exports for this node (#343434). */
import grid from '../../../assets/bento/markets/grid.svg';
import { Roll } from '../../Roll';
import { ctaProps } from '../../../lib/cta';
import { Icon } from '../../Icon';
import orbitRing from '../../../assets/bento/orbit-ring.svg';
import arrowOrange from '../../../assets/bento/arrow-orange.svg';
import cursorArrow from '../../../assets/bento/cursor.svg';
import tileGold from '../../../assets/bento/tile-gold.svg';
import tileNikkei from '../../../assets/bento/tile-nikkei.svg';
import tileApple from '../../../assets/bento/tile-apple.svg';
import tileDax from '../../../assets/bento/tile-dax.svg';
import tilePhorecast from '../../../assets/bento/tile-phorecast.svg';
import tileDoge from '../../../assets/bento/tile-doge.svg';
import tileDow from '../../../assets/bento/tile-dow.png';
import tileCopper from '../../../assets/bento/tile-copper.svg';
import tileSp500 from '../../../assets/bento/tile-sp500.svg';
import tileOil from '../../../assets/bento/tile-oil.svg';
import tileSolana from '../../../assets/bento/tile-solana.svg';
import tileBitcoin from '../../../assets/bento/tile-bitcoin.svg';
import tileTesla from '../../../assets/bento/tile-tesla.svg';
import fxPairUsd from '../../../assets/bento/markets/fx-pair-usd.svg';
import fxPairAlt from '../../../assets/bento/markets/fx-pair-alt.svg';
import './BoxMarkets.css';

/** Design pixels -> the card's container unit, so every number below can be
 *  read straight off the Figma node. */
const u = (n: number) => `calc(${n} * var(--u))`;

interface Tile {
  /** top-left in .mk__field coordinates */
  left: number;
  top: number;
  /** outer, border-box edge */
  size: number;
  radius: number;
  /** Figma's stroke weight; 0 when the tile has none */
  border: number;
  opacity?: number;
  background?: string;
}

/** The tile's own box, handed to CSS as four design-pixel NUMBERS rather than
 *  as four resolved lengths.
 *
 *  Why: the card has two layouts now. On a phone the artwork is recomposed --
 *  Figma 526:394 turns the field on its side and drops the dark half of it --
 *  and every surviving tile keeps its size, corner, ring and glyph and moves to
 *  a new place. `left`/`top` written here as inline styles could only be moved
 *  from CSS with `!important` on every one of them; written as `--x`/`--y` the
 *  breakpoint simply restates two numbers and BoxMarkets.css does the calc.
 *
 *  The desktop render does not move: `left: calc(var(--x) * var(--u))` with
 *  `--x: 191` resolves to exactly what `left: calc(191 * var(--u))` did.
 *
 *  `--ring` stays a length because it is a shadow spread, not a coordinate, and
 *  it is identical in both layouts. */
const shell = (t: Tile) => ({
  ['--x' as string]: t.left,
  ['--y' as string]: t.top,
  ['--s' as string]: t.size,
  ['--r' as string]: t.radius,
  ['--ring' as string]: u(t.border),
  ...(t.opacity === undefined ? null : { opacity: t.opacity }),
  ...(t.background === undefined ? null : { background: t.background }),
});

/** A point in the current field's design pixels, for the loose parts that are
 *  not tiles: the cursor, its label and the two diamonds. */
const at = (x: number, y: number) => ({ ['--x' as string]: x, ['--y' as string]: y });

/** A glyph placed by its own top-left inside the tile. */
const leaf = (left: number, top: number, w: number, h: number) => ({
  left: u(left),
  top: u(top),
  width: u(w),
  height: u(h),
});

/** A glyph Figma centres in its tile, resolved to an explicit box so the SVG's
 *  intrinsic size can never leak in. `dx`/`dy` carry Figma's own nudges. */
const centred = (t: Tile, w: number, h: number, dx = 0, dy = 0) =>
  leaf((t.size - w) / 2 + dx, (t.size - h) / 2 + dy, w, h);

/* Tiles, in the design's own paint order. -------------------------------- */
const GOLD: Tile = { left: 191, top: 146, size: 42, radius: 7.5, border: 0.75 };
const NIKKEI: Tile = { left: 199, top: 315, size: 64, radius: 11.429, border: 1.28 };
const APPLE: Tile = { left: 435, top: 27, size: 36, radius: 6.607, border: 0.74 };
const DAX: Tile = { left: 512, top: 99, size: 28, radius: 5, border: 0.56 };
const HUB: Tile = { left: 303, top: 172, size: 82, radius: 36, border: 1.64 };
const FX: Tile = { left: 182.62, top: 452.36, size: 83.77, radius: 14.959, border: 1.675, opacity: 0.8 };
const DOGE: Tile = { left: 256.34, top: 579.69, size: 83.77, radius: 14.959, border: 1.675, opacity: 0.7 };
const DOW: Tile = { left: 412.15, top: 569.64, size: 83.77, radius: 14.959, border: 1.675, opacity: 0.6, background: 'var(--mk-dow)' };
const COPPER: Tile = { left: 484.19, top: 442.3, size: 83.77, radius: 14.959, border: 1.675, opacity: 0.8 };
const SP500: Tile = { left: 498, top: 199, size: 50, radius: 12.202, border: 1.367 };
const OIL: Tile = { left: 604.82, top: 450.68, size: 67.016, radius: 11.967, border: 1.675, opacity: 0.3 };
const SOLANA: Tile = { left: 415, top: 256, size: 40, radius: 12.202, border: 1.367 };
const BITCOIN: Tile = { left: 328.38, top: 442.3, size: 93.822, radius: 16.754, border: 1.675 };
const TESLA: Tile = { left: 73, top: 226, size: 56, radius: 10, border: 1.4 };

/* 365:1153 – 365:1159 plus 365:1168. Unbadged tiles that carry the field on
   past the card's clip. Arbitrary warm tints — not the brand orange — except
   the last, which Figma binds to the token and which the CSS paints.

   The seven tints are named rather than spelled, because this is a GEOMETRY
   table and colour in it cannot follow a theme: what the card's ground is
   decides what a 10%-opacity warm smudge on it has to be. The values live
   beside the rest of the card's palette in BoxMarkets.css; only the names are
   here. `background` still goes through `shell()` and still lands as an inline
   style, so nothing about the layout or the paint order moves. */
const GHOSTS: Array<Tile & { edged?: boolean; accent?: boolean }> = [
  { left: -20.71, top: 435.91, size: 42.704, radius: 7.626, border: 0, opacity: 0.1, background: 'var(--mk-ghost-1)' },
  { left: 53.61, top: 462.41, size: 67.016, radius: 11.967, border: 0, opacity: 0.2, background: 'var(--mk-ghost-2)' },
  { left: 139.06, top: 586.39, size: 67.016, radius: 11.967, border: 1.675, opacity: 0.3, background: 'var(--mk-ghost-3)', edged: true },
  { left: 199.37, top: 681.89, size: 67.016, radius: 11.967, border: 0, opacity: 0.1, background: 'var(--mk-ghost-4)' },
  { left: 341.78, top: 698.64, size: 67.016, radius: 11.967, border: 0, opacity: 0.1, background: 'var(--mk-ghost-5)' },
  { left: 470.79, top: 693.61, size: 67.016, radius: 11.967, border: 0, opacity: 0.08, background: 'var(--mk-ghost-6)' },
  { left: 554.56, top: 569.64, size: 67.016, radius: 11.967, border: 1.675, opacity: 0.3, background: 'var(--mk-ghost-7)', edged: true },
];
const ACCENT: Tile = { left: 653.22, top: 350.19, size: 48.904, radius: 11.967, border: 0, opacity: 0.05 };

export function BoxMarkets() {
  return (
    <article className="bcard bcard--markets box-markets">
      {/* 365:1064 — the faint measure grid, parented to the card itself */}
      <div className="mk__grid" aria-hidden="true">
        <img src={grid} alt="" width={488.255} height={312} />
      </div>

      {/* 365:1090 — the centred column the design hangs everything off */}
      <div className="mk__stage">
        {/* 365:1091 / 365:1092 — one ellipse drawn twice, each on its own tilt */}
        <div className="mk__orbits" aria-hidden="true">
          <img src={orbitRing} alt="" className="mk__orbit mk__orbit--a" width={498.296} height={186.446} />
          <img src={orbitRing} alt="" className="mk__orbit mk__orbit--b" width={498.296} height={186.446} />
        </div>

        {/* 365:1102 — the market field. 727 x 765, so its lower half sits below
            the card's clip by design: the bottom row of dark tiles is only ever
            meant to show as a sliver at the card's edge. */}
        <div className="mk__field" aria-hidden="true">
          <span className="mk__tile mk__tile--light mk__tile--gold" data-market="Gold" style={shell(GOLD)}>
            <img src={tileGold} alt="" style={centred(GOLD, 19.5, 19.5)} />
          </span>
          <span className="mk__tile mk__tile--light mk__tile--nikkei" data-market="NIKKEI" style={shell(NIKKEI)}>
            <img src={tileNikkei} alt="" style={centred(NIKKEI, 46.08, 10.24)} />
          </span>
          <span className="mk__tile mk__tile--light mk__tile--apple" data-market="Apple" style={shell(APPLE)}>
            <img src={tileApple} alt="" style={centred(APPLE, 20, 20)} />
          </span>
          {/* Figma lifts the DAX wordmark 0.32 off centre. */}
          <span className="mk__tile mk__tile--light mk__tile--dax" data-market="DAX" style={shell(DAX)}>
            <img src={tileDax} alt="" style={centred(DAX, 18, 7.35, 0, -0.32)} />
          </span>

          {/* 365:1118 — the Phorcast mark, ringed. The mark is deliberately
              off-centre in its disc (1.7 left, 1.2 up), so it is placed. */}
          <span className="mk__hub" style={shell(HUB)}>
            <img src={tilePhorecast} alt="" className="mk__mark" style={leaf(21.91 + 1.64, 19.47 + 1.64, 34.823, 40.594)} />
          </span>

          {/* 365:1120 — a currency-pair mark: two 25.131 discs side by side in a
              50.262 window that Figma insets 23.33%/26.67% inside the tile. */}
          <span className="mk__tile mk__tile--dark mk__tile--fx" data-market="Forex" style={shell(FX)}>
            <span className="mk__pair" style={leaf(15.08 + 1.675, 15.08 + 1.675 + 11.727, 50.262, 25.131)}>
              <img src={fxPairUsd} alt="" style={leaf(0, 0, 25.131, 25.131)} />
              <img src={fxPairAlt} alt="" style={leaf(25.131, 0, 25.131, 25.131)} />
            </span>
          </span>
          <span className="mk__tile mk__tile--dark mk__tile--doge" data-market="Dogecoin" style={shell(DOGE)}>
            <img src={tileDoge} alt="" style={leaf(18.43 + 1.675, 18.43 + 1.675, 43.56, 43.56)} />
          </span>
          {/* The only raster mark in the box; Figma object-covers it. */}
          <span className="mk__tile mk__tile--dark mk__tile--dow" data-market="Dow Jones" style={shell(DOW)}>
            <img src={tileDow} alt="" className="mk__cover" style={centred(DOW, 50.262, 50.262)} />
          </span>
          <span className="mk__tile mk__tile--dark mk__tile--copper" data-market="Copper" style={shell(COPPER)}>
            <img src={tileCopper} alt="" style={centred(COPPER, 43.56, 43.56)} />
          </span>
          <span className="mk__tile mk__tile--light mk__tile--sp500" data-market="S&amp;P 500" style={shell(SP500)}>
            <img src={tileSp500} alt="" style={centred(SP500, 30, 8)} />
          </span>

          {GHOSTS.map((g, i) => (
            <span
              key={i}
              className={`mk__tile mk__tile--ghost${g.edged ? ' mk__tile--edged' : ''}`}
              style={shell(g)}
            />
          ))}

          {/* 365:1160 — Brent oil. Figma nests the glyph one level deeper and
              insets it inside that, so both steps are folded in here. */}
          <span className="mk__tile mk__tile--dark mk__tile--oil" data-market="Brent Oil" style={shell(OIL)}>
            <img src={tileOil} alt="" style={leaf(18.43 + 1.675 + 1.885, 18.43 + 1.675 + 0.147, 23.004, 26.482)} />
          </span>
          {/* 365:1168 — the one tint Figma binds to the brand token */}
          <span className="mk__tile mk__tile--ghost mk__tile--accent" style={shell(ACCENT)} />

          {/* 365:1169 — Solana, the tile the cursor has picked */}
          <span className="mk__tile mk__tile--solana" data-market="Solana" style={shell(SOLANA)}>
            <img src={tileSolana} alt="" style={leaf(8.234 + 1.367, 10.63 + 1.367, 20.798, 16.306)} />
          </span>
          <span className="mk__tile mk__tile--dark mk__tile--bitcoin" data-market="Bitcoin" style={shell(BITCOIN)}>
            <img src={tileBitcoin} alt="" style={leaf(23.46 + 1.675, 23.46 + 1.675, 43.56, 43.56)} />
          </span>
          <span className="mk__tile mk__tile--light mk__tile--tesla" data-market="Tesla" style={shell(TESLA)}>
            <img src={tileTesla} alt="" style={leaf(8.135 + 1.4, 8.013 + 1.4, 36.4, 36.241)} />
          </span>

          {/* 365:1182 / 365:1185 — the pointer and its label. Figma insets the
              arrow 7.55% inside a 20 box; that is folded into the offsets. */}
          {/* A mask, not an image: the file is one solid black arrow, which is
              --mk-ink exactly, so on the inverted card it follows the card's
              ink instead of staying black on black. `leaf` still supplies the
              box in the card's own unit and lands after Icon's w/h, so the
              geometry is the <img>'s to the pixel. */}
          <Icon src={cursorArrow} w={16.974} h={16.988} className="mk__cursor"
            style={{ ...at(461.51, 292.506), width: u(16.974), height: u(16.988) }} />
          <span className="mk__tooltip" style={at(477, 300)}>Solana</span>

          {/* 365:1187 / 365:1188 — orange markers sitting on the orbit paths.
              Figma centres a 10 square in a 14.142 box; 2.071 is that inset. */}
          {/* `data-diamond`, not a modifier class, for the reason `data-market`
              exists on the tiles: it names WHICH of two identical marks this is
              so the phone block can place each one, without changing what the
              element IS. A class here would also rewrite the key theme-diff
              identifies these two by, and report a rename as a disappearance. */}
          <span className="mk__diamond" data-diamond="a" style={at(309.501, 124.791)} />
          <span className="mk__diamond" data-diamond="b" style={at(151.071, 344.071)} />
        </div>

        {/* 365:1093 */}
        <div className="bcard__text">
          <h3 className="bcard__title">Forecast Global Markets in One Place</h3>
          <p className="bcard__body">Take a view on the outcomes shaping equities, indices, crypto, commodities, and more.</p>
        </div>

        {/* 365:1096 */}
        <a {...ctaProps('bentoMarkets')} className="bento__cta bento__cta--orange">
          <Roll>Explore Markets</Roll>
          <span className="mk__arrow">
            <img src={arrowOrange} alt="" width={12} height={6} />
          </span>
        </a>
      </div>
    </article>
  );
}

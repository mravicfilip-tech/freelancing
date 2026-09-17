/* Bento box D — "Trade every market from one account" (Figma 365:1063).
 *
 * The one light card in the grid: a 776 x 440 cream surface with dark type,
 * inverted from its three dark siblings. Everything below is the approved
 * static design at 1:1 design pixels — no motion of any kind lives here. The
 * `motion/markets.ts` module owns the load-in and the orbiting loop and reads
 * this markup through the class names documented beside each element.
 *
 * Geometry note. Figma's card is `flex items-center justify-between` around a
 * single flex child (365:1090) whose two rows sit 310px apart. That column is
 * 382.4 tall inside a 378 content box, so it overflows 2.2px top and bottom —
 * which is why the heading starts at y 28.8 rather than 31. Reproducing that by
 * hand would be brittle, so `.box-markets` centres a real `.mk__stage` column
 * the same way the design does and lets the browser land on the same numbers.
 * The two artwork layers that Figma parents to 365:1090 live inside that stage
 * for the same reason: they move with it instead of drifting from it.
 *
 * All offsets are design pixels multiplied by `--u`, the card's own container
 * unit (see BoxMarkets.css), so the whole box scales with the grid cell it is
 * given rather than with the viewport.
 */
import grid from '../../../assets/bento/grid.svg';
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

/* Design pixels -> the card's container unit. Keeping this in one helper means
   every number below can be read straight off the Figma node. */
const u = (n: number) => `calc(${n} * var(--u))`;

type Box = { left: number; top: number; size: number; radius: number };

/** A tile's shell. `size` is the outer box; `radius` is Figma's own corner. */
const shell = ({ left, top, size, radius }: Box) => ({
  left: u(left),
  top: u(top),
  width: u(size),
  height: u(size),
  borderRadius: u(radius),
});

/** A glyph placed by its own top-left inside the tile, never by a shared rule:
 *  the leaves differ in both size and inset from tile to tile. */
const leaf = (left: number, top: number, w: number, h: number) => ({
  left: u(left),
  top: u(top),
  width: u(w),
  height: u(h),
});

/** A glyph Figma centres in its tile, expressed as an explicit box so the
 *  intrinsic SVG size can never leak in. */
const leafCentred = (box: number, w: number, h: number, dx = 0, dy = 0) =>
  leaf((box - w) / 2 + dx, (box - h) / 2 + dy, w, h);

export function BoxMarkets() {
  return (
    <article className="bcard bcard--markets box-markets">
      {/* 365:1064 — the faint measure grid, parented to the card itself */}
      <div className="mk__grid" aria-hidden="true">
        <img src={grid} alt="" width={488.255} height={312} />
      </div>

      {/* 365:1090 — the centred column the design hangs everything else off */}
      <div className="mk__stage">
        {/* 365:1091 / 365:1092 — two copies of one ellipse, each on its own tilt */}
        <div className="mk__orbits" aria-hidden="true">
          <img src={orbitRing} alt="" className="mk__orbit mk__orbit--a" width={498.296} height={186.446} />
          <img src={orbitRing} alt="" className="mk__orbit mk__orbit--b" width={498.296} height={186.446} />
        </div>

        {/* 365:1102 — the market field. 727 x 765, so its lower half is
            deliberately below the card's clip: the design only lets the bottom
            row of dark tiles show as a sliver. */}
        <div className="mk__field" aria-hidden="true">
          {/* 365:1103 — gold */}
          <span className="mk__tile mk__tile--light mk__tile--gold" data-market="Gold" style={shell({ left: 190.997, top: 146, size: 42, radius: 7.5 })}>
            <img src={tileGold} alt="" style={leafCentred(42, 19.5, 19.5)} />
          </span>
          {/* 365:1108 — NIKKEI */}
          <span className="mk__tile mk__tile--light mk__tile--nikkei" data-market="NIKKEI" style={shell({ left: 199, top: 315, size: 64, radius: 11.429 })}>
            <img src={tileNikkei} alt="" style={leafCentred(64, 46.08, 10.24)} />
          </span>
          {/* 365:1111 — Apple */}
          <span className="mk__tile mk__tile--light mk__tile--apple" data-market="Apple" style={shell({ left: 435, top: 27, size: 36, radius: 6.607 })}>
            <img src={tileApple} alt="" style={leafCentred(36, 20, 20)} />
          </span>
          {/* 365:1114 — DAX. Figma nudges this glyph 0.32 above centre. */}
          <span className="mk__tile mk__tile--light mk__tile--dax" data-market="DAX" style={shell({ left: 512, top: 99, size: 28, radius: 5 })}>
            <img src={tileDax} alt="" style={leafCentred(28, 18, 7.35, 0, -0.32)} />
          </span>

          {/* 365:1118 — the Phorecast mark, ringed. The mark sits off-centre in
              its disc in the design (1.68 left, 1.23 up), so it is placed. */}
          <span className="mk__hub" style={shell({ left: 303, top: 172, size: 82, radius: 41 })}>
            <img src={tilePhorecast} alt="" className="mk__mark" style={leaf(21.91, 19.47, 34.823, 40.594)} />
          </span>

          {/* 365:1120 — a two-half currency-pair mark, both circles 25.131 */}
          <span className="mk__tile mk__tile--dark mk__tile--fx" data-market="Forex" style={{ ...shell({ left: 182.62, top: 452.36, size: 83.77, radius: 14.959 }), opacity: 0.8 }}>
            <span className="mk__pair" style={leaf(15.08, 26.808, 50.262, 25.131)}>
              <img src={fxPairUsd} alt="" style={leaf(0, 0, 25.131, 25.131)} />
              <img src={fxPairAlt} alt="" style={leaf(25.131, 0, 25.131, 25.131)} />
            </span>
          </span>
          {/* 365:1138 — dogecoin */}
          <span className="mk__tile mk__tile--dark mk__tile--doge" data-market="Dogecoin" style={{ ...shell({ left: 256.34, top: 579.69, size: 83.77, radius: 14.959 }), opacity: 0.7 }}>
            <img src={tileDoge} alt="" style={leaf(18.43, 18.43, 43.56, 43.56)} />
          </span>
          {/* 365:1141 — Dow Jones. The only raster mark in the box. */}
          <span className="mk__tile mk__tile--dark mk__tile--dow" data-market="Dow Jones" style={{ ...shell({ left: 412.15, top: 569.64, size: 83.77, radius: 14.959 }), opacity: 0.6, background: '#2c2c2c' }}>
            <img src={tileDow} alt="" className="mk__leaf--cover" style={leafCentred(83.77, 50.262, 50.262)} />
          </span>
          {/* 365:1143 — copper */}
          <span className="mk__tile mk__tile--dark mk__tile--copper" data-market="Copper" style={{ ...shell({ left: 484.19, top: 442.3, size: 83.77, radius: 14.959 }), opacity: 0.8 }}>
            <img src={tileCopper} alt="" style={leafCentred(83.77, 43.56, 43.56)} />
          </span>
          {/* 365:1150 — S&P 500 */}
          <span className="mk__tile mk__tile--light mk__tile--sp500" data-market="S&amp;P 500" style={shell({ left: 498, top: 199, size: 50, radius: 12.202 })}>
            <img src={tileSp500} alt="" style={leafCentred(50, 30, 8)} />
          </span>

          {/* 365:1153 – 365:1159 — unbadged tiles that carry the field past the
              card's edge. Arbitrary warm tints, not the brand orange. */}
          <span className="mk__tile mk__tile--ghost" style={{ ...shell({ left: -20.71, top: 435.91, size: 42.704, radius: 7.626 }), opacity: 0.1, background: '#853b1e' }} />
          <span className="mk__tile mk__tile--ghost" style={{ ...shell({ left: 53.61, top: 462.41, size: 67.016, radius: 11.967 }), opacity: 0.2, background: '#542c1c' }} />
          <span className="mk__tile mk__tile--ghost mk__tile--edged" style={{ ...shell({ left: 139.06, top: 586.39, size: 67.016, radius: 11.967 }), opacity: 0.3, background: '#46271b' }} />
          <span className="mk__tile mk__tile--ghost" style={{ ...shell({ left: 199.37, top: 681.89, size: 67.016, radius: 11.967 }), opacity: 0.1, background: '#b54a1f' }} />
          <span className="mk__tile mk__tile--ghost" style={{ ...shell({ left: 341.78, top: 698.64, size: 67.016, radius: 11.967 }), opacity: 0.1, background: '#b04920' }} />
          <span className="mk__tile mk__tile--ghost" style={{ ...shell({ left: 470.79, top: 693.61, size: 67.016, radius: 11.967 }), opacity: 0.08, background: '#9c421f' }} />
          <span className="mk__tile mk__tile--ghost mk__tile--edged" style={{ ...shell({ left: 554.56, top: 569.64, size: 67.016, radius: 11.967 }), opacity: 0.3, background: '#a74620' }} />

          {/* 365:1160 — Brent oil */}
          <span className="mk__tile mk__tile--dark mk__tile--oil" data-market="Brent Oil" style={{ ...shell({ left: 604.82, top: 450.68, size: 67.016, radius: 11.967 }), opacity: 0.3 }}>
            <img src={tileOil} alt="" style={leaf(18.43 + 1.885, 18.43 + 0.147, 23.004, 26.482)} />
          </span>
          {/* 365:1168 — the one tint Figma binds to the brand token */}
          <span className="mk__tile mk__tile--ghost mk__tile--accent" style={{ ...shell({ left: 653.22, top: 350.19, size: 48.904, radius: 11.967 }), opacity: 0.05 }} />

          {/* 365:1169 — Solana, the tile the cursor is pointing at */}
          <span className="mk__tile mk__tile--solana" data-market="Solana" style={shell({ left: 415, top: 256, size: 40, radius: 12.202 })}>
            <img src={tileSolana} alt="" style={leaf(8.234 + 1.367, 10.63 + 1.367, 20.798, 16.306)} />
          </span>
          {/* 365:1174 — bitcoin, the largest tile in the field */}
          <span className="mk__tile mk__tile--dark mk__tile--bitcoin" data-market="Bitcoin" style={shell({ left: 328.38, top: 442.3, size: 93.822, radius: 16.754 })}>
            <img src={tileBitcoin} alt="" style={leaf(23.46, 23.46, 43.56, 43.56)} />
          </span>
          {/* 365:1178 — Tesla */}
          <span className="mk__tile mk__tile--light mk__tile--tesla" data-market="Tesla" style={shell({ left: 73, top: 226, size: 56, radius: 10 })}>
            <img src={tileTesla} alt="" style={leaf(8.135 + 1.4, 8.013 + 1.4, 36.4, 36.241)} />
          </span>

          {/* 365:1182 / 365:1185 — the pointer and its label */}
          <img src={cursorArrow} alt="" className="mk__cursor" style={leaf(460 + 1.51, 291 + 1.506, 16.974, 16.988)} />
          <span className="mk__tooltip" style={{ left: u(477), top: u(300), width: u(76) }}>Solana</span>

          {/* 365:1187 / 365:1188 — orange markers sitting on the orbit paths */}
          <span className="mk__diamond" style={{ left: u(307.43 + 2.071), top: u(122.72 + 2.071) }} />
          <span className="mk__diamond" style={{ left: u(149 + 2.071), top: u(342 + 2.071) }} />
        </div>

        {/* 365:1093 */}
        <div className="bcard__text">
          <h3 className="bcard__title">Trade every market from one account</h3>
          <p className="bcard__body">Crypto, forex, commodities, indices and equities.</p>
        </div>

        {/* 365:1096 */}
        <a href="#markets" className="bento__cta bento__cta--orange">
          Explore Markets
          <span className="mk__arrow">
            <img src={arrowOrange} alt="" width={12} height={6} />
          </span>
        </a>
      </div>
    </article>
  );
}

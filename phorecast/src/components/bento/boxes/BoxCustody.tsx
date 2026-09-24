/**
 * Bento card B: "Your Funds Stay Yours" (Figma 365:925 desktop,
 * 526:305 mobile).
 *
 * The card is 534 x 355 in desktop design pixels and 394 x 669 on the phone.
 * `.bcard` (Bento.css) supplies the shell (padding, radius, background,
 * min-height) and makes itself an inline-size query container, so
 * the diagram is laid out in raw Figma numbers multiplied by `--u`, one design
 * pixel of the card's content column. See BoxCustody.css for the unit, which is
 * the one thing that is measured differently at the two sizes.
 *
 * Every coordinate below is the raw Figma number inside the 464 x 215 group
 * 365:936, which the CSS centres on the card exactly as Figma does
 * (left 50% + 5, top 50% + 23).
 *
 * THE PHONE IS THE SAME DIAGRAM TURNED A QUARTER-TURN. Figma 526:1588 draws
 * this identical 464 x 215 group at -90deg inside a 215 x 464 box and
 * counter-rotates each label, chip and pill so the words stay level. Nothing
 * about that needs a second set of elements: a point (x, y) of the landscape
 * geometry lands at (y, 464 - x) in the portrait box, so the mobile block in
 * BoxCustody.css is this same markup re-placed through that one map.
 *
 * One glyph set serves both frames. Both name the same seven solid leaves:
 * `fi_9155737` (stocks), `fi_12379305` (crypto), `fi_12468105` (commodities),
 * `fi_17433031` (forex), `fi_9716066` (the document, in two pieces),
 * `fi_17508481` (the padlock) and `fi_6839980` (the wallet).
 *
 * Resting state only; `motion/funds.ts` owns the load-in and loop, at both
 * orientations.
 */
import arrow from '../../../assets/bento/custody/arrow.svg';
import { Roll } from '../../Roll';
import { ctaProps } from '../../../lib/cta';
import { Icon } from '../../Icon';
// Ellipse 57, a 430x236 raster. The mobile frame uses the same raster, so the
// phone rotates this one rather than shipping a second copy.
import glow from '../../../assets/bento/funds-glow.png';
import ringMarket from '../../../assets/bento/custody/ring-market.svg';
import ringWallet from '../../../assets/bento/custody/ring-wallet.svg';
import walletDisc from '../../../assets/bento/custody/wallet-disc.svg';
import iconWallet from '../../../assets/bento/custody/icon-wallet.svg';
import iconStocks from '../../../assets/bento/custody/icon-stocks.svg';
import iconCrypto from '../../../assets/bento/custody/icon-crypto.svg';
import iconCommodities from '../../../assets/bento/custody/icon-commodities.svg';
import iconForex from '../../../assets/bento/custody/icon-forex.svg';
import iconContract from '../../../assets/bento/custody/icon-contract.svg';
import iconContractFold from '../../../assets/bento/custody/icon-contract-fold.svg';
import iconLock from '../../../assets/bento/custody/icon-lock.svg';
import nodeDot from '../../../assets/bento/custody/node-dot.svg';
import './BoxCustody.css';

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/** The four market labels and the 36 x 36 icon tile each one belongs to, at
 *  both of the card's sizes.
 *
 *  `lx`/`ly` and `tx`/`ty` are the label's and the tile's raw Figma
 *  coordinates in the desktop group; `mlx`/`mly` and `mtx`/`mty` are the
 *  phone's. The phone's are not the desktop's run through the quarter-turn
 *  map: 526:305 re-lays the four pairs around the ring, so each pair is read
 *  from its own wrapper in that frame and placed from its centre (tile at
 *  centre minus 18, label at centre minus 8, with Figma's own gap).
 *
 *      Stocks      centre (33, 150)    tile, gap 9,  label
 *      Crypto      centre (36, 77)     tile, gap 9,  label
 *      Commodities centre (146.5, 39)  label, gap 11, tile
 *      Forex       centre (187.5, 123) label, gap 9,  tile
 *
 *  `leaf` is the icon's own class. The four tiles share an outer box and the
 *  glyphs inside them do not share a size, so two of the four carry an inset
 *  of their own in BoxCustody.css and the other two fill the 16px slot; the
 *  class is emitted for all four either way, because it says which market the
 *  glyph belongs to rather than how big it is. */
const MARKETS = [
  { label: 'Stocks',      lx: 348, ly: 12,  tx: 394, ty: 0,   mlx: 37,  mly: 142, mtx: -8,  mty: 132,
    icon: iconStocks,      leaf: 'stocks',      bordered: true  },
  { label: 'Crypto',      lx: 386, ly: 62,  tx: 432, ty: 55,  mlx: 40,  mly: 69,  mtx: -5,  mty: 59,
    icon: iconCrypto,      leaf: 'crypto',      bordered: false },
  { label: 'Commodities', lx: 349, ly: 129, tx: 432, ty: 124, mlx: 87,  mly: 31,  mtx: 170, mty: 21,
    icon: iconCommodities, leaf: 'commodities', bordered: false },
  { label: 'Forex',       lx: 350, ly: 187, tx: 389, ty: 182, mlx: 150, mly: 115, mtx: 189, mty: 105,
    icon: iconForex,       leaf: 'forex',       bordered: false },
] as const;

/** Ellipse 35: the two orange nodes sitting on the strokes. Figma's 8px layer
 *  carries a glow that overflows it by 7px a side, so the exported 22 x 22
 *  asset is placed at the layer origin minus 7 at both sizes. These two do
 *  follow the quarter-turn map, being artwork rather than type: (22, 67)
 *  becomes (60, 427) and (298, 104) becomes (97, 151). The loop relies on this
 *  order: the orbit releases a packet, the wallet catches it. */
const NODES = [
  { key: 'wallet', x: 22 - 7,  y: 67 - 7,  mx: 60, my: 427 },
  { key: 'orbit',  x: 298 - 7, y: 104 - 7, mx: 97, my: 151 },
] as const;

export function BoxCustody() {
  return (
    <article className="bcard bcard--funds box-custody">
      <div className="bcard__text">
        <h3 className="bcard__title">Your Funds Stay Yours</h3>
        <p className="bcard__body">Take positions through smart contracts and withdraw your funds whenever you choose.</p>
      </div>

      <div className="custody__art" aria-hidden="true">
        <img src={glow} alt="" className="custody__glow" width={215} height={118} />
        {/* The two rings and the glyphs below are masks, not images, so their
            colour can follow the theme (--custody-ring / --custody-glyph).
            `Icon` paints through `background: currentColor`, which only works
            for a file that is one flat colour on transparent; each of these is
            (the `fill="white"` rects in three glyphs are clipPath rects and
            never painted). The file's own alpha survives as mask alpha.

            The glow raster and the gradient wallet disc would be destroyed by
            a mask, so they stay <img>.

            `width`/`height` are cleared because BoxCustody.css sizes these in
            the card's container unit; Icon's own w/h would freeze them at one
            size. The numbers are still passed as the intrinsic box. */}
        <Icon src={ringMarket} w={215} h={215} className="custody__ring-market"
          style={{ width: undefined, height: undefined }} />
        <Icon src={ringWallet} w={93} h={93} className="custody__ring-wallet"
          style={{ width: undefined, height: undefined }} />

        <span className="custody__label custody__label--wallet" style={{ '--x': 43, '--y': 131, '--mx': 95, '--my': 429 } as Vars}>Wallet</span>
        {MARKETS.map(({ label, lx, ly, mlx, mly }) => (
          <span key={label} className="custody__label" style={{ '--x': lx, '--y': ly, '--mx': mlx, '--my': mly } as Vars}>
            {label}
          </span>
        ))}

        {MARKETS.map(({ label, tx, ty, mtx, mty, icon, leaf, bordered }) => (
          <span
            key={label}
            className={`custody__tile${bordered ? ' custody__tile--bordered' : ''}`}
            style={{ '--x': tx, '--y': ty, '--mx': mtx, '--my': mty } as Vars}
          >
            <Icon src={icon} w={16} h={16}
              className={`custody__glyph custody__glyph--${leaf}`}
              style={{ width: undefined, height: undefined }} />
          </span>
        ))}

        {/* The phone's own 135 and 143 are the frame's widths with the stroke in,
            which is what border-box asks for; the desktop's 133 and 146 are its
            frame's. Both pills hang off the left of the portrait box the way
            Forex's tile hangs off the right. */}
        <span className="custody__pill"
          style={{ '--x': 133, '--y': 31, '--w': 133, '--mx': -17.5, '--my': 245.5, '--mw': 135 } as Vars}>
          {/* fi_9716066: one 16px slot holding two leaves, because Figma draws
              the document as a body and a separately folded corner. The wrapper
              is the flex item the pill lays out; both leaves are placed inside
              it at their own insets. */}
          <span className="custody__doc">
            <Icon src={iconContract} w={11.0514} h={13.7143} className="custody__doc-body"
              style={{ width: undefined, height: undefined }} />
            <Icon src={iconContractFold} w={2.33144} h={2.32572} className="custody__doc-fold"
              style={{ width: undefined, height: undefined }} />
          </span>
          Smart Contracts
        </span>
        <span className="custody__pill"
          style={{ '--x': 115, '--y': 144, '--w': 146, '--mx': 95, '--my': 295, '--mw': 143 } as Vars}>
          {/* fi_17508481: the padlock is one solid leaf filling the whole 16px
              slot, so it is the pill's flex item itself rather than something
              inside a wrapper. */}
          <Icon src={iconLock} w={16} h={16} className="custody__lock"
            style={{ width: undefined, height: undefined }} />
          Withdraw anytime
        </span>

        {NODES.map(({ key, x, y, mx, my }) => (
          <img key={key} src={nodeDot} alt="" className="custody__node"
            style={{ '--x': x, '--y': y, '--mx': mx, '--my': my } as Vars} width={22} height={22} />
        ))}

        <img src={walletDisc} alt="" className="custody__wallet-disc" width={37} height={37} />
        {/* fi_6839980, 16 x 16 at (46, 99). Masked like its siblings; the
            clipPath's `fill="white"` rect is not painted, so the file is a
            single flat grey. */}
        <Icon src={iconWallet} w={16} h={16} className="custody__wallet-icon"
          style={{ width: undefined, height: undefined }} />
      </div>

      <a {...ctaProps('bentoHow')} className="bento__cta bento__cta--orange">
        <Roll>See How It Works</Roll>
        {/* Masked so the arrow follows the link's `color` (--accent) in both
            themes rather than keeping the red baked into the file. */}
        <Icon src={arrow} w={12} h={6} />
      </a>
    </article>
  );
}

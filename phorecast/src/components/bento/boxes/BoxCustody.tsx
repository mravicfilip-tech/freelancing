/**
 * Bento card B — "Your funds leave whenever you want" (Figma 365:925).
 *
 * The card is 534 x 355 in design pixels. `.bcard` (Bento.css) already supplies
 * the shell — padding, radius, background, min-height — and makes itself an
 * inline-size query container, so the diagram is laid out in raw Figma numbers
 * multiplied by `--u`, one design pixel of the card's content column. See
 * BoxCustody.css for the unit.
 *
 * Every coordinate below is the raw Figma number inside the 464 x 215 group
 * 365:936, which the CSS centres on the card exactly as Figma does
 * (left 50% + 5, top 50% + 23).
 *
 * No motion lives here: this file is the resting state only. `motion/funds.ts`
 * owns the card's load-in and loop.
 */
import arrow from '../../../assets/bento/custody/arrow.svg';
import { Roll } from '../../Roll';
import { Icon } from '../../Icon';
// The same 430x236 export the bento already ships as funds-glow.png -- checked
// pixel for pixel, not by name -- so this points at the existing file rather
// than a second 116 KB copy of it.
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
import iconLockBody from '../../../assets/bento/custody/icon-lock-body.svg';
import iconLockHole from '../../../assets/bento/custody/icon-lock-hole.svg';
import nodeDot from '../../../assets/bento/custody/node-dot.svg';
import './BoxCustody.css';

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/** The four market labels and the 36 x 36 icon tile each one belongs to.
 *  `leaf` is the icon's own class: the tiles share an outer box, the glyphs
 *  inside them do not share a size (Figma gives each its own inset). */
const MARKETS = [
  { label: 'Stocks',      lx: 348, ly: 12,  tx: 394, ty: 0,   icon: iconStocks,      leaf: 'stocks',      bordered: true },
  { label: 'Crypto',      lx: 386, ly: 62,  tx: 432, ty: 55,  icon: iconCrypto,      leaf: 'crypto',      bordered: false },
  { label: 'Commodities', lx: 349, ly: 129, tx: 432, ty: 124, icon: iconCommodities, leaf: 'commodities', bordered: false },
  { label: 'Forex',       lx: 350, ly: 187, tx: 389, ty: 182, icon: iconForex,       leaf: 'forex',       bordered: false },
] as const;

/** Ellipse 35 — the two orange nodes sitting on the strokes. Figma's 8px layer
 *  carries a glow that overflows it by 7px a side, so the exported 22 x 22
 *  asset is placed at the layer origin minus 7. */
const NODES: ReadonlyArray<readonly [number, number]> = [
  [22 - 7, 67 - 7],
  [298 - 7, 104 - 7],
];

export function BoxCustody() {
  return (
    <article className="bcard bcard--funds box-custody">
      <div className="bcard__text">
        <h3 className="bcard__title">Your funds leave whenever you want</h3>
        <p className="bcard__body">Collateral sits in contracts we never touch.</p>
      </div>

      <div className="custody__art" aria-hidden="true">
        <img src={glow} alt="" className="custody__glow" width={215} height={118} />
        {/* The two rings and the seven glyphs below are masks, not images.
            Every one of them is a single flat colour on transparent, and every
            one of them is drawn LIGHT: the market ring is #FF632A at the file's
            own 22%, the wallet ring #D9D9D9 at 20%, the glyphs #A6A6A6. On the
            dark card that is how they reach the eye; on paper it is how they
            disappear. As a mask the file keeps its own alpha -- the 0.2 and the
            0.22 survive as mask alpha -- and the colour under it becomes
            `color`, i.e. a token. See --custody-ring / --custody-glyph.

            `width`/`height` are passed as undefined because BoxCustody.css
            sizes all of these in the card's container unit; Icon's own w/h
            would freeze them at one breakpoint. The numbers are still handed
            over, so the intrinsic box is on record. */}
        <Icon src={ringMarket} w={215} h={215} className="custody__ring-market"
          style={{ width: undefined, height: undefined }} />
        <Icon src={ringWallet} w={93} h={93} className="custody__ring-wallet"
          style={{ width: undefined, height: undefined }} />

        <span className="custody__label custody__label--wallet" style={{ '--x': 43, '--y': 131 } as Vars}>Wallet</span>
        {MARKETS.map(({ label, lx, ly }) => (
          <span key={label} className="custody__label" style={{ '--x': lx, '--y': ly } as Vars}>
            {label}
          </span>
        ))}

        {MARKETS.map(({ label, tx, ty, icon, leaf, bordered }) => (
          <span
            key={label}
            className={`custody__tile${bordered ? ' custody__tile--bordered' : ''}`}
            style={{ '--x': tx, '--y': ty } as Vars}
          >
            <Icon src={icon} w={16} h={16} className={`custody__glyph custody__glyph--${leaf}`}
              style={{ width: undefined, height: undefined }} />
          </span>
        ))}

        <span className="custody__pill" style={{ '--x': 133, '--y': 31, '--w': 133 } as Vars}>
          <Icon src={iconContract} w={16} h={16} className="custody__pill-icon"
            style={{ width: undefined, height: undefined }} />
          Smart Contracts
        </span>
        <span className="custody__pill" style={{ '--x': 115, '--y': 144, '--w': 146 } as Vars}>
          {/* fi_747305 — shackle and keyhole are two layers with their own boxes. */}
          <span className="custody__lock">
            <Icon src={iconLockBody} w={12.749} h={16} className="custody__lock-body"
              style={{ width: undefined, height: undefined }} />
            <Icon src={iconLockHole} w={2.313} h={4.125} className="custody__lock-hole"
              style={{ width: undefined, height: undefined }} />
          </span>
          Withdraw anytime
        </span>

        {NODES.map(([x, y]) => (
          <img key={`${x}-${y}`} src={nodeDot} alt="" className="custody__node" style={{ '--x': x, '--y': y } as Vars} width={22} height={22} />
        ))}

        <img src={walletDisc} alt="" className="custody__wallet-disc" width={37} height={37} />
        <img src={iconWallet} alt="" className="custody__wallet-icon" width={18} height={18} />
      </div>

      <a href="#how" className="bento__cta bento__cta--orange">
        <Roll>See How It Works</Roll>
        <img src={arrow} alt="" width={12} height={6} />
      </a>
    </article>
  );
}

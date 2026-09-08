import { useEffect, useRef, type ReactNode } from 'react';
import { useMobileArt } from '../FigmaFeatures/illustrations/Stage';
import { useTokenomicsMotion, type TokVariant } from './useTokenomicsMotion';
import './FigmaTokenomics.css';

const A = (n: string) => `/figma/tokenomics/${n}.svg`;
/** Layers exported from the phone frame (Figma 2639:1627). */
const M = (n: string) => `/figma/tokenomics/mobile/${n}.svg`;

/** The band is drawn at its design size and scaled to the frame, so every offset stays exact. */
function Stage({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => el.style.setProperty('--k', String(el.clientWidth / w));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className="tk__fit" style={{ aspectRatio: `${w} / ${h}` }}>
      <div className="tk__stage" style={{ width: w, height: h }}>
        {children}
      </div>
    </div>
  );
}

type Slice = { id: string; label: string; pct: number; icon: string; x: number; y: number; dark?: boolean };
type Coin = { id: string; x: number; y: number };

/** Positions are the design's own; `y` is the row's centre line. */
const SLICES: Slice[] = [
  { id: 'reserves', label: 'Reserves', pct: 10, icon: 'ic-reserves', x: 435.6, y: 162, dark: false },
  { id: 'listings', label: 'Listings', pct: 12, icon: 'ic-listings', x: 951.4, y: 162, dark: true },
  { id: 'presale', label: 'Presale', pct: 50, icon: 'ic-presale', x: 414, y: 292, dark: true },
  { id: 'team', label: 'Team', pct: 9, icon: 'ic-team', x: 982, y: 292, dark: true },
  { id: 'rewards', label: 'Rewards', pct: 4, icon: 'ic-rewards', x: 436.5, y: 424, dark: true },
  { id: 'marketing', label: 'Marketing', pct: 15, icon: 'ic-marketing', x: 942.6, y: 424, dark: true },
];

/**
 * Portrait (Figma 2639:1627): the six allocations stack in two groups of three around the dial,
 * ranged left on a 188 column. Rows are 64 tall (the percent circle) on a 16 gap, the first group
 * from the frame's 160px of head room and the second below the 210 dial.
 */
const SLICES_M: Slice[] = [
  { id: 'reserves', label: 'Reserves', pct: 10, icon: 'ic-reserves', x: 102.5, y: 192, dark: false },
  { id: 'presale', label: 'Presale', pct: 50, icon: 'ic-presale', x: 102.5, y: 272, dark: true },
  { id: 'rewards', label: 'Rewards', pct: 4, icon: 'ic-rewards', x: 102.5, y: 352, dark: true },
  { id: 'listings', label: 'Listings', pct: 12, icon: 'ic-listings', x: 102.5, y: 658, dark: true },
  { id: 'team', label: 'Team', pct: 9, icon: 'ic-team', x: 102.5, y: 738, dark: true },
  { id: 'marketing', label: 'Marketing', pct: 15, icon: 'ic-marketing', x: 102.5, y: 818, dark: true },
];

const COINS: Coin[] = [
  { id: 'coin-btc', x: 136, y: 134 },
  { id: 'coin-eth', x: 226, y: 293 },
  { id: 'coin-usdt', x: 136, y: 453 },
  { id: 'coin-bnb', x: 1348, y: 134 },
  { id: 'coin-tron', x: 1264, y: 293 },
  { id: 'coin-sol', x: 1348, y: 453 },
];

/**
 * Portrait chain marks: two wire trees, one reaching down from the head of the frame and one up
 * from its foot. Centres, taken from the file's rotated frames (2639:1875 and 2639:1915).
 */
const COINS_M: Coin[] = [
  { id: 'coin-usdt', x: 104, y: 50 },
  { id: 'coin-btc', x: 293, y: 50 },
  { id: 'coin-eth', x: 194, y: 103 },
  { id: 'coin-bnb', x: 195.5, y: 1023 },
  { id: 'coin-sol', x: 101.5, y: 1073 },
  { id: 'coin-tron', x: 289.5, y: 1073 },
];

const FACTS: [string, ReactNode][] = [
  ['Token Name', 'Remittix'],
  ['Token Symbol', 'RTX'],
  ['Token Supply', '1,500,000,000'],
  [
    'Network',
    <span className="tk__network" key="n">
      <img src={A('coin-eth')} alt="" width={32} height={32} />
      Ethereum
    </span>,
  ],
  ['Decimal', '18'],
];

const CONTRACT = '0xe7654694ec16F3163084eC559193e10c7ABA17CB';

/** The ring, its wedges and the hub, as one box so a phone can scale the whole dial down. */
function Dial() {
  return (
    <div className="tk__dial" aria-hidden="true">
      <img className="tk__ring" src={A('ring-outer')} alt="" width={442} height={442} />
      <div className="tk__wedges">
        <img className="tk__wedge tk__wedge--a" src={A('wedge-a')} alt="" width={442} height={347.485} />
        <img className="tk__wedge tk__wedge--b" src={A('wedge-b')} alt="" width={142} height={111.643} />
        <img className="tk__wedge tk__wedge--c" src={A('wedge-c')} alt="" width={128} height={100.636} />
      </div>
      <div className="tk__hub">
        <img className="tk__hubDisc" src={A('hub')} alt="" width={114} height={114} />
        <img className="tk__logo tk__logo--1" src={A('logo-union')} alt="" width={14.568} height={14.733} />
        <img className="tk__logo tk__logo--2" src={A('logo-v2')} alt="" width={25.615} height={28.405} />
        <img className="tk__logo tk__logo--3" src={A('logo-v3')} alt="" width={25.224} height={29.075} />
        <span className="tk__total">0%</span>
      </div>
    </div>
  );
}

/** One allocation: its chip and the circle carrying the share. */
function Allocation({ s, top }: { s: Slice; top: number }) {
  return (
    <div className="tk__slice" data-slice={s.id} style={{ left: s.x, top }}>
      <span className={`tk__chip${s.dark ? '' : ' tk__chip--indigo'}`}>
        <img src={A(s.icon)} alt="" width={20} height={20} />
        {s.label}
      </span>
      <span className="tk__pct">
        <b data-pct={s.pct}>{s.pct}%</b>
      </span>
    </div>
  );
}

/**
 * Tokenomics (Figma 2592:485). A 442 donut around the mark, six allocations reading outward, and
 * the chain marks on the flanks wired back to the hub — all on the same band and 1560 dashed rails
 * as the sections above. `variant` picks the motion treatment (see useTokenomicsMotion).
 */
export function FigmaTokenomics({ variant = 1 }: { variant?: TokVariant }) {
  const root = useRef<HTMLElement>(null);
  const mobile = useMobileArt();
  useTokenomicsMotion(root, variant, mobile);

  return (
    <section ref={root} className={`tk${mobile ? ' tk--m' : ''}`} id="tokenomics" data-motion="pending" data-variant={variant} data-layout={mobile ? 'mobile' : 'desktop'} aria-labelledby="tk-title">
      <div className="tk__frame">
        <header className="tk__head">
          <h2 id="tk-title" className="tk__title">
            <span className="tk__line">
              <span className="tk__lineInner">Tokenomics</span>
            </span>
          </h2>
          <p className="tk__sub">Use the contract information below to add the Remittix token to your wallet.</p>
        </header>

        <div className="tk__band">
          {mobile ? (
            <Stage w={393} h={1123}>
              {/* Two wire trees, reaching down from the head of the frame and up from its foot.
                  Each is the file's own rotated group (2639:1875, 2639:1915): the artwork turns a
                  quarter turn while the chain marks on it stay upright. */}
              <div className="tk__wires" aria-hidden="true">
                <img className="tk__wire tk__wire--top" src={M('wires-top')} alt="" width={517} height={188} />
                <img className="tk__wire tk__wire--bot" src={M('wires-bottom')} alt="" width={517.5} height={188} />
                <span className="tk__pulse tk__pulse--l0" />
                <span className="tk__pulse tk__pulse--l1" />
                <span className="tk__pulse tk__pulse--l2" />
                <span className="tk__pulse tk__pulse--r0" />
                <span className="tk__pulse tk__pulse--r1" />
                <span className="tk__pulse tk__pulse--r2" />
              </div>
              <Dial />
              {COINS_M.map((c) => (
                <span key={c.id} className="tk__coin" style={{ left: c.x - 20, top: c.y - 20 }} aria-hidden="true">
                  <img src={A(c.id)} alt="" width={18.883} height={18.883} />
                </span>
              ))}
              {SLICES_M.map((s) => (
                <Allocation key={s.id} s={s} top={s.y - 32} />
              ))}
            </Stage>
          ) : (
            <Stage w={1560} h={586}>
              {/* wires, drawn hub-outwards */}
              <div className="tk__wires" aria-hidden="true">
                <img className="tk__wire tk__wire--l0" src={A('wire-straight')} alt="" width={559} height={1} />
                <img className="tk__wire tk__wire--l1" src={A('wire-curve')} alt="" width={425.5} height={159.5} />
                <img className="tk__wire tk__wire--l2" src={A('wire-curve')} alt="" width={425.5} height={159.5} />
                <img className="tk__wire tk__wire--r0" src={A('wire-straight')} alt="" width={559} height={1} />
                <img className="tk__wire tk__wire--r1" src={A('wire-curve')} alt="" width={425.5} height={159.5} />
                <img className="tk__wire tk__wire--r2" src={A('wire-curve')} alt="" width={425.5} height={159.5} />
                <span className="tk__pulse tk__pulse--l0" />
                <span className="tk__pulse tk__pulse--l1" />
                <span className="tk__pulse tk__pulse--l2" />
                <span className="tk__pulse tk__pulse--r0" />
                <span className="tk__pulse tk__pulse--r1" />
                <span className="tk__pulse tk__pulse--r2" />
              </div>
              <Dial />
              {/* the chain marks */}
              {COINS.map((c) => (
                <span key={c.id} className="tk__coin" style={{ left: c.x, top: c.y - 32 }} aria-hidden="true">
                  <img src={A(c.id)} alt="" width={32} height={32} />
                </span>
              ))}
              {/* the allocations */}
              {SLICES.map((s) => (
                <Allocation key={s.id} s={s} top={s.y - 32} />
              ))}
            </Stage>
          )}
        </div>

        <dl className="tk__facts">
          <div className="tk__fact tk__fact--addr">
            <dt>Contract Address</dt>
            <dd>
              <span className="tk__addr">{CONTRACT}</span>
              <button type="button" className="tk__copy" aria-label="Copy contract address" onClick={() => navigator.clipboard?.writeText(CONTRACT)}>
                <img src={A('ic-copy')} alt="" width={20} height={20} />
              </button>
            </dd>
          </div>
          {FACTS.map(([label, value]) => (
            <div className="tk__fact" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

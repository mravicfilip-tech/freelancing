import { LiveDot } from '../LiveDot';
import btcCoin from '../../assets/built/btc-coin.svg';
import line from '../../assets/built/line.svg';
import youDot from '../../assets/built/you-dot.svg';
import ringOuter from '../../assets/built/ring-outer.svg';
import ringMid from '../../assets/built/ring-mid.svg';
import ringDisc from '../../assets/built/ring-disc.svg';
import linkMain from '../../assets/built/link-main.svg';
import linkFan from '../../assets/built/link-fan.svg';
import nodeDisc from '../../assets/built/node-disc.svg';
import nodeDiscSoft from '../../assets/built/node-disc-soft.svg';
import nodeRingA from '../../assets/built/node-ring-a.svg';
import nodeRingB from '../../assets/built/node-ring-b.svg';
import nodeRingC from '../../assets/built/node-ring-c.svg';
import nodeDax from '../../assets/built/node-dax.svg';
import nodeEur from '../../assets/built/node-eur.svg';
import nodeBtc from '../../assets/built/node-btc.svg';
import { Roll } from '../Roll';
import { Icon } from '../Icon';
import { useSectionMotion } from '../../lib/motion';
import { buildBuilt } from './Built.motion';
import { bt1Loop } from './loops/bt1';
import { bt2Loop } from './loops/bt2';
import nodeLock from '../../assets/built/node-lock.svg';
import gold from '../../assets/built/gold.svg';
import arrow from '../../assets/built/arrow.svg';
import tesla from '../../assets/built/tesla.svg';
import { ctaProps, type CtaKey } from '../../lib/cta';
import './Built.css';

/* Which images are <Icon>. <Icon> turns an SVG into a CSS mask and hands the
 * paint to `color`, so the colour becomes a token. A mask is one alpha
 * channel, so only files that draw a single colour can convert:
 *
 *   you-dot.svg     one #e5331e circle and ring  -> --accent
 *   line.svg,       a stroke under a two-stop    -> a CSS gradient behind the
 *   link-main.svg   fade                            mask (Built.css)
 *   link-fan.svg    four #353433 strokes         -> --bt-wire
 *   arrow.svg (x2)  one #e5331e path             -> inherits the CTA colour
 *
 * Everything else stays an <img>: ring-disc.svg (disc, ring and drop
 * shadow); the faint rings, which land at a similar contrast on paper; the
 * node plates carrying third-party marks; and the eyebrow dot, which is
 * swapped per theme by <LiveDot>.
 *
 * Sizing. The dot, the line and the two CTA arrows are sized by Built.css, so
 * `cssBox` removes <Icon>'s inline width and height. The two wires are
 * absolutely positioned with all four insets; as <img>s they took the file's
 * intrinsic size, and a <span> would instead solve its box from the insets.
 * So they get an explicit size: the box the <img> occupied on Chromium's
 * 1/64px layout grid (336.203125 x 122.484375 and 436.78125 x 23.40625), not
 * the viewBox size the export claims. The wires do not scale with the band.
 */
const cssBox = { width: undefined, height: undefined };

function CardOne() {
  return (
    <div className="bt-card bt-card--one">
      <span className="bt-card__glow bt-card__glow--right" aria-hidden="true" />
      <span className="bt-label bt-label--tl">One market</span>
      <span className="bt-label bt-label--tr">ONE CLEAR QUESTION</span>
      <div className="bt1" aria-hidden="true">
        <Icon src={youDot} w={24} h={24} className="bt1__dot" style={cssBox} />
        <Icon src={line} w={174} h={3} className="bt1__line" style={cssBox} />
        <span className="bt1__smear" />
        <span className="bt1__you">You</span>
        <div className="bt1__rings">
          <img src={ringOuter} alt="" className="bt1__ring-outer" />
          <img src={ringMid} alt="" className="bt1__ring-mid" />
          <img src={ringDisc} alt="" className="bt1__ring-disc" />
          <img src={btcCoin} alt="" className="bt1__coin" width={28} height={28} />
        </div>
      </div>
      <div className="bt1__text" aria-hidden="true">
        <p className="bt1__pair">BTC UP OR DOWN?</p>
        <p className="bt1__note">A simple place to begin.</p>
      </div>
    </div>
  );
}

/* A market node carries two placements.
 *
 * `x`/`y`/`size`/`iconSize` are the landscape frame Figma draws: a 640 x 254
 * card, five markets spread left to right, the padlock on the right.
 *
 * `mx`/`my`/`ms`/`mis` are the portrait frame below 700px (Figma 526:2656,
 * 334 x 392): the markets spaced around one ring with the padlock at its
 * centre. Built.css picks one set, so a node cannot be half-moved.
 *
 * Both sets ride in the style attribute as custom properties. That attribute
 * is load-bearing for the motion layer; see the `clearProps` notes in
 * Built.motion.ts and loops/bt2.ts. */
type Node = {
  key: string; label: string; ring: string; icon?: string; whole?: string;
  size: number; x: number; y: number; iconSize?: number; wholeSize?: number;
  ms: number; mx: number; my: number; mis?: number;
};

/* The portrait orbit, read off Figma 526:2656. That frame is the landscape
 * card turned a quarter turn (a 392 x 334 container rotated -90 inside a
 * 334 x 392 card), so each coordinate is the node's placement pushed through
 * `cardX = v`, `cardY = 392 - u`, then expressed as an offset from the card's
 * centre (167, 196).
 *
 *   ring        centre (167, 197), r 89      .bt2__main's mask
 *   inner disc  centre (166, 197), r 47.5    .bt2__fan's mask
 *   padlock     centre (167, 196)
 *
 * The markets sit 84 to 92 units from the ring's centre, as drawn; clockwise
 * from twelve: TSLA (-1.4 deg), DAX (61.7), XAU (116.9), EUR (259.2), BTC
 * (299.4). The gap between XAU and EUR holds the SELF-CUSTODY pill, which
 * sits on the ring at 179.4 deg.
 *
 * `ms` is the plate for a ringed node and the frame for a whole one, because
 * that is what each kind of file draws. With the portrait .bt2__ring at
 * 142.86%, both kinds land at the design's rim/plate ratio of 1.431 (see
 * Built.css).
 *
 * `mis` is the mark size in design units: 11.76 for the Bitcoin B, 19 for the
 * Tesla wordmark, 16 for the gold bar. */
const HUB_MX = 0;
const HUB_MY = 0;   /* the padlock, from the card's centre */
const NODES: Node[] = [
  { key: 'btc', label: 'BTC / USD', size: 64, x: -215, y: -23, ring: nodeRingC, icon: nodeBtc, iconSize: 17.9, ms: 29.4, mx: -80, my: -44, mis: 11.76 },
  { key: 'tsla', label: 'TSLA', size: 50, x: -74, y: -72, ring: nodeRingA, icon: tesla, iconSize: 15.4, ms: 35, mx: -2, my: -83, mis: 19 },
  { key: 'dax', label: 'DAX 40', size: 60, x: 85, y: -72, ring: '', whole: nodeDax, wholeSize: 81, ms: 34, mx: 78, my: -41 },
  { key: 'eur', label: 'EUR / USD', size: 50, x: -106, y: 28, ring: '', whole: nodeEur, wholeSize: 67.5, ms: 50, mx: -84, my: 17 },
  { key: 'xau', label: 'XAU / USD', size: 50, x: 28, y: 48, ring: nodeRingB, icon: gold, iconSize: 16, ms: 35, mx: 77, my: 40, mis: 16 },
];

function CardTwo() {
  return (
    <div className="bt-card bt-card--two">
      <span className="bt-card__glow bt-card__glow--left" aria-hidden="true" />
      <span className="bt-label bt-label--tl bt-label--grey">MORE MARKETS</span>
      <span className="bt-label bt-label--tr bt-label--grey">FAST ACCESS</span>
      <span className="bt-label bt-label--bl">TRANSPARENT SETTLEMENT</span>
      <div className="bt2" aria-hidden="true">
        <Icon src={linkFan} w={336.203125} h={122.484375} className="bt2__fan" style={cssBox} />
        <Icon src={linkMain} w={436.78125} h={23.40625} className="bt2__main" style={cssBox} />
        <span className="bt2__smear" />
        {NODES.map((n) => (
          <span
            key={n.key}
            className="bt2__node"
            data-k={n.key}
            style={{
              ['--x' as string]: n.x, ['--y' as string]: n.y, ['--s' as string]: n.size,
              ['--mx' as string]: n.mx, ['--my' as string]: n.my, ['--ms' as string]: n.ms,
              ['--i' as string]: n.iconSize, ['--mi' as string]: n.mis,
            }}
          >
            {n.whole ? (
              <img src={n.whole} alt="" className="bt2__whole" />
            ) : (
              <>
                <img src={nodeDisc} alt="" className="bt2__disc" />
                <img src={nodeDiscSoft} alt="" className="bt2__disc bt2__disc--soft" />
                <img src={n.ring} alt="" className="bt2__ring" />
                {/* Sized from `--i` in Built.css rather than inline, so the
                    portrait frame can override it. */}
                <img src={n.icon} alt="" className="bt2__icon" />
              </>
            )}
            <span className="bt2__label">{n.label}</span>
          </span>
        ))}
        <span
          className="bt2__node bt2__node--lock"
          data-k="lock"
          style={{
            ['--x' as string]: 226, ['--y' as string]: 0, ['--s' as string]: 70,
            ['--mx' as string]: HUB_MX, ['--my' as string]: HUB_MY, ['--ms' as string]: 50,
          }}
        >
          <img src={nodeLock} alt="" className="bt2__whole" />
          <span className="bt2__label bt2__label--lock">Self-custody</span>
        </span>
      </div>
    </div>
  );
}

const COLUMNS = [
  {
    card: <CardOne />,
    title: 'Start With What You Know',
    body: 'Choose one clear question, take your position, and watch the probability change as the market responds.',
    cta: 'Find Your First Market',
    link: 'builtFirstMarket' as CtaKey,
  },
  {
    card: <CardTwo />,
    title: 'Expand Your Market View',
    body: 'Follow outcomes across crypto, equities, currencies, commodities, and indices, with fast access, self-custody, and transparent settlement.',
    cta: 'Explore Financial Markets',
    link: 'builtFinancial' as CtaKey,
  },
];

/**
 * The two cards loop independently, but `useSectionMotion` takes a single
 * `idle`, so they start and stop together here. Module scope, not inline:
 * `idle` is a dependency of the layout effect, and a new function identity on
 * every render would tear the entrance down and replay it.
 */
function builtIdle(root: HTMLElement) {
  const stops = [bt1Loop(root), bt2Loop(root)];
  return () => stops.forEach((stop) => stop());
}

export function Built() {
  // The band arrives when it is scrolled to; see Built.motion.ts. `pending`
  // holds the animated parts until GSAP takes over in the same frame (the CSS
  // is at the end of Built.css).
  const ref = useSectionMotion<HTMLElement>(buildBuilt, { idle: builtIdle });

  return (
    <section ref={ref} className="built" id="built" aria-labelledby="built-title" data-motion="pending">
      <div className="built__glows glow-fade" aria-hidden="true"><span className="built__glow" /></div>
      <div className="container built__inner">
        <header className="built__head">
          <p className="eyebrow">
            <LiveDot />
            BUILT TO GROW WITH YOU
          </p>
          <h2 id="built-title" className="built__title">Start With One Question. Explore Every Possibility.</h2>
          <p className="built__sub">Begin with a single forecast, then expand your view across the financial outcomes that matter to you.</p>
        </header>

        <div className="built__cols">
          {COLUMNS.map((c) => (
            <div key={c.title} className="built__col">
              {c.card}
              <div className="built__copy">
                <h3 className="built__col-title">{c.title}</h3>
                <p className="built__col-body">{c.body}</p>
                <a {...ctaProps(c.link)} className="built__cta"><Roll>{c.cta}</Roll><Icon src={arrow} w={12} h={6} style={cssBox} /></a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

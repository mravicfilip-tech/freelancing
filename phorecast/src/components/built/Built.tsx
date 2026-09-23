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

/* FOUR OF THIS BAND'S TWENTY-SIX IMAGES ARE <Icon>, AND NOT ONE MORE.
 *
 * <Icon> turns an SVG file into a CSS mask and hands the paint to `color`, so
 * the colour stops being whatever Figma baked and starts being a token. The
 * cost is that a mask is one alpha channel: any file with two colours in it
 * loses one. That is the whole of the selection rule here.
 *
 *   converted   you-dot.svg     one #e5331e circle and ring     -> --accent
 *               line.svg        a stroke under a two-stop fade  -> a CSS
 *               link-main.svg   a stroke under a two-stop fade     gradient
 *               link-fan.svg    four #353433 strokes            -> --bt-wire
 *               arrow.svg (x2)  one #e5331e path                -> inherits
 *                                                                  the CTA
 *
 * The gradient pair convert because a mask does not have to be painted flat:
 * the silhouette comes from the file and the fade comes from a `background`
 * in Built.css, matched to the linearGradient the export carries. Everything
 * the file draws is still drawn.
 *
 *   not converted  ring-disc.svg     disc + ring + drop shadow
 *                  ring-mid/outer, node-ring-a/b/c   already near-invisible,
 *                                                    and land at the same
 *                                                    ratio on paper
 *                  node-disc(-soft), node-dax/eur/lock, btc-coin, tesla,
 *                  gold, node-btc   dark plates carrying locked marks
 *                  live-dot.svg      three tinted ellipses; the eyebrow dot
 *                                    is shared with five other bands, and all
 *                                    six swap the whole file through <LiveDot>
 *                                    rather than masking it flat
 *
 * THE BOX is where a mask conversion can move geometry, and there are two
 * different answers in this file.
 *
 *  - The dot, the line and the two CTA arrows are sized by Built.css, in
 *    container units for the first two and 12x6 for the arrows. An inline
 *    pixel size would freeze them, so `cssBox` writes Icon's own width and
 *    height away again and hands the box back to the stylesheet.
 *  - The two wires are NOT. They are absolutely positioned with all four
 *    insets and `width: auto`, and an <img> is a replaced element: `auto`
 *    resolves to the file's intrinsic size and the over-constrained `right`
 *    and `bottom` are dropped. Both therefore ship at a fixed size at every
 *    width -- confirmed identical at 1600, 1100 and 720 in the dark baseline.
 *    A <span> is not replaced and would have solved its box from the insets
 *    instead, shrinking by a third at 720, so both are given a size.
 *
 *    THE SIZE IS NOT THE ONE IN THE FILE. link-fan.svg says 336.243 x 122.496
 *    and link-main.svg says 436.869 x 23.4105, but a replaced element's
 *    intrinsic size lands on Chromium's 1/64px layout grid and does not simply
 *    round to it: the two <img> measured 336.203125 x 122.484375 and
 *    436.78125 x 23.40625. The numbers below are those, because what has to be
 *    reproduced is the box that shipped rather than the box the export claims.
 *    Asking for 436.869 left the wire 0.078px wide of the <img>, which the
 *    gate saw as w: 436.8 -> 436.9 and called geometry, correctly.
 *    (That the wires do not scale with the band is how this shipped; it is
 *    not something to fix here.)
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

/* A market node carries TWO placements.
 *
 * `x`/`y`/`size`/`iconSize` are the landscape frame Figma drew: a 640 x 254
 * card, five markets spread left to right, one padlock on the right-hand edge.
 *
 * `mx`/`my`/`ms`/`mis` are the SAME five markets in the portrait frame the
 * card takes below 700px — Figma 526:2656, 334 x 392, the markets spaced
 * around one large ring with the padlock at its centre. Built.css picks one
 * set or the other; nothing here decides, so a node cannot be half-moved. The
 * ring and the faint inner circle are drawn from the SAME centre, once, inside
 * .bt2__main's and .bt2__fan's mobile masks — Built.css names them there so
 * the two cannot drift apart.
 *
 * Both sets ride in the style attribute as custom properties. That attribute
 * is load-bearing for the motion layer — see the `clearProps` notes in
 * Built.motion.ts and loops/bt2.ts — and this only adds names to it. */
type Node = {
  key: string; label: string; ring: string; icon?: string; whole?: string;
  size: number; x: number; y: number; iconSize?: number; wholeSize?: number;
  ms: number; mx: number; my: number; mis?: number;
};

/* THE PORTRAIT ORBIT, read straight off Figma 526:2656 rather than solved.
 *
 * That frame is the landscape card turned a quarter turn in the design file —
 * a 392 x 334 container rotated -90 inside a 334 x 392 card — so every
 * coordinate below is the Figma node's own placement pushed through
 * `cardX = v`, `cardY = 392 - u` and then re-expressed as an offset from the
 * card's centre (167, 196). Nothing here is eyeballed, and nothing is carried
 * over from the row this card used to be: a radius, an angle or a size tuned
 * to five markets standing side by side is silently wrong on a ring.
 *
 *   ring        centre (167, 197), r 89      .bt2__main's mask
 *   inner disc  centre (166, 197), r 47.5    .bt2__fan's mask
 *   padlock     centre (167, 196)            the ring's middle
 *
 * The five markets sit at 84 - 92 units from the ring's centre, which is the
 * scatter the design has and not a mistake to correct: clockwise from twelve
 * they are TSLA (-1.4 degrees), DAX (61.7), XAU (116.9), EUR (259.2) and BTC
 * (299.4). The 142-degree gap between XAU and EUR is where the SELF-CUSTODY
 * pill sits, at 179.4 degrees and at exactly r=89 — it is ON the ring, not
 * under it, which is why the markets are not evenly spaced.
 *
 * `ms` IS THE PLATE for a ringed node and THE FRAME for a whole one, because
 * that is what each kind of file draws. A ringed node is node-disc.svg at 100%
 * of `ms` (a circle at 0.9857 of its own box) plus node-ring-*.svg at 142.86%
 * (a circle at 0.9875 of its box) — so its plate is 0.986 * ms and its rim
 * 1.411 * ms. A whole node is one file at 136% whose plate and rim are 0.511
 * and 0.731 of the file — 0.695 * ms and 0.995 * ms. Both kinds therefore land
 * at the design's own rim/plate ratio of 1.431, which is the number the three
 * composite exports (EUR, DAX, the padlock) carry inside them. 142.86% is the
 * mobile value of .bt2__ring in Built.css and it exists for exactly this: at
 * the landscape 136% the three ringed markets would wear a rim 5% tight
 * against the two that draw their own.
 *
 * `mis` is the mark, in design units, straight from the frame: 11.76 for the
 * Bitcoin B, 19 for the Tesla wordmark, 16 for the gold bar. */
const HUB_MX = 0;
const HUB_MY = 0;   /* the padlock, from the card's centre — the ring's middle */
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
                {/* Sized from `--i` in Built.css rather than inline, because the
                    portrait frame has to be able to say a different number. The
                    landscape value is the same 17.9 / 15.4 / 16 it always was
                    and resolves to the same used width. */}
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
 * `idle`, so they are started together and torn down together here. Module
 * scope, not inline: `idle` is one of the layout effect's dependencies, and a
 * new function identity on every render would tear the entrance down and
 * replay it -- which is exactly what happened on the familiar section.
 */
function builtIdle(root: HTMLElement) {
  const stops = [bt1Loop(root), bt2Loop(root)];
  return () => stops.forEach((stop) => stop());
}

export function Built() {
  // The band arrives when it is scrolled to; see Built.motion.ts. `pending`
  // holds the animated parts until GSAP takes over in the same frame — the CSS
  // for it is at the end of Built.css.
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

import glow from '../../assets/steps/glow.svg';
import ribs from '../../assets/steps/mark-ribs.svg';
import slices from '../../assets/steps/mark-slices.svg';
import envelope from '../../assets/steps/s1-envelope.svg';
import cardGlyph from '../../assets/steps/s1-card-glyph.svg';
import userGlyph from '../../assets/steps/s1-user-glyph.svg';
import divider from '../../assets/steps/s1-divider.svg';
import bracket from '../../assets/steps/s1-bracket.svg';
import connector from '../../assets/steps/s1-connector.svg';
import indicator from '../../assets/steps/s1-indicator.svg';
import bottomnav from '../../assets/steps/s1-bottomnav.svg';
import phoneLogo from '../../assets/steps/s1-logo.svg';
import statusArrow from '../../assets/steps/s1-status-arrow.svg';
import signal from '../../assets/steps/s1-signal.svg';
import data from '../../assets/steps/s1-data.svg';
import battery from '../../assets/steps/s1-battery.svg';
import battTip from '../../assets/steps/s1-batt-tip.svg';
import s2Lines from '../../assets/steps/s2-lines.svg';
import s2Node from '../../assets/steps/s2-node.svg';
import s2Lock from '../../assets/steps/s2-lock.svg';
import s2Tile1 from '../../assets/steps/s2-tile1.svg';
import s2Tile2 from '../../assets/steps/s2-tile2.svg';
import s2Tile3 from '../../assets/steps/s2-tile3.svg';
import s2Tile4 from '../../assets/steps/s2-tile4.svg';
import s2Tile5 from '../../assets/steps/s2-tile5.svg';
import s3Btc from '../../assets/steps/s3-btc.svg';
import s3Target from '../../assets/steps/s3-target.svg';
import s3Tesla from '../../assets/steps/s3-tesla.svg';
import s3Sp500 from '../../assets/steps/s3-sp500.svg';
import s3Apple from '../../assets/steps/s3-apple.svg';
import s3Chart from '../../assets/steps/s3-chart.svg';
import { angleOf, countMoney, drawOver, usePanelMotion } from './panelMotion';
import type { PanelMotion, PanelProps } from './panelMotion';

/** The 3D wordmark behind each panel. Figma gives it a different box and
 *  opacity per slide, and the ribs/slices sit at their own insets inside it. */
function Mark({ className }: { className: string }) {
  return (
    <div className={`steps__mark ${className}`} aria-hidden="true">
      <div className="steps__mark-clip">
        <img src={ribs} alt="" className="steps__mark-ribs" />
        <img src={slices} alt="" className="steps__mark-slices" />
      </div>
    </div>
  );
}

function Glow({ className }: { className: string }) {
  return <img src={glow} alt="" className={`steps__glow ${className}`} aria-hidden="true" />;
}

/* Two hidden twins of line work that is rendered as <img>, so that the strokes
   can be drawn on — see `drawOver`. The markup is the exported Figma file
   verbatim, with the generated ids renamed so two sections can never collide on
   them. They carry `--draw`, which is `display: none` until a timeline reveals
   one; the images beside them are what the settled panel shows. */

function Connector() {
  return (
    <svg
      className="s1__connector s1__connector--draw"
      width={91.1567}
      height={107.948}
      viewBox="0 0 91.1567 107.948"
      preserveAspectRatio="none"
      overflow="visible"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0.000130131 53.3745H20.8072C35.3806 53.3745 47.1946 41.5605 47.1946 26.9871C47.1946 12.4138 59.0087 0.599714 73.582 0.599714H91.1566"
        stroke="url(#steps-s1c-a)"
        strokeWidth={1.19943}
      />
      <path
        d="M0 54.5739H20.8071C35.3804 54.5739 47.1945 66.388 47.1945 80.9613C47.1945 95.5347 59.0085 107.349 73.5819 107.349H91.1565"
        stroke="url(#steps-s1c-b)"
        strokeWidth={1.19943}
      />
      <defs>
        <linearGradient id="steps-s1c-a" x1={-2.39872} y1={56.9728} x2={100.152} y2={7.19657} gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF632A" />
          <stop offset={1} stopColor="#9B9898" />
        </linearGradient>
        <linearGradient id="steps-s1c-b" x1={91.1565} y1={110.347} x2={0} y2={54.5739} gradientUnits="userSpaceOnUse">
          <stop stopColor="#353434" />
          <stop offset={1} stopColor="#FF632A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Lines() {
  return (
    <svg
      className="s2__lines s2__lines--draw"
      width={347.723}
      height={315.7}
      viewBox="0 0 347.723 315.7"
      preserveAspectRatio="none"
      overflow="visible"
      fill="none"
      aria-hidden="true"
    >
      <g opacity={0.2} filter="url(#steps-s2l-blur)">
        <path
          d="M326.383 156.822H310.064M5.02127 156.822H305.043M310.064 156.822H305.043M310.064 156.822C310.064 156.822 254.83 166.211 161.936 254.622C107.871 306.078 19.4574 309.424 19.4574 309.424M310.064 156.822C310.064 156.822 236.698 132.936 150.638 54.3287C77.8298 -12.1746 18.3824 9.73208 18.3824 9.73208M305.043 156.822C305.043 156.822 216.543 127.874 168.213 107.532C119.408 86.9892 17.2711 80.1477 17.2711 80.1477M305.043 156.822C305.043 156.822 223.447 176.382 168.213 204.549C120.486 228.887 21.4756 229.585 21.4756 229.585"
          stroke="url(#steps-s2l-grad)"
          strokeWidth={2.51064}
        />
      </g>
      <defs>
        <filter
          id="steps-s2l-blur"
          x={0}
          y={0}
          width={331.404}
          height={315.7}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation={2.51064} result="effect1_foregroundBlur" />
        </filter>
        <linearGradient id="steps-s2l-grad" x1={346.468} y1={155.258} x2={18.8191} y2={152.74} gradientUnits="userSpaceOnUse">
          <stop stopColor="#632812" />
          <stop offset={0.378376} stopColor="#696969" />
          <stop offset={1} stopColor="#323232" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Shared beats ------------------------------------------------------------- */

/* Every entrance tween hands the element back when it lands. A left-over
   identity transform is not visually neutral — it puts the element on its own
   raster layer, which shifts text and hairlines by a fraction of a pixel. */
const CLEAR = 'transform,transformOrigin,opacity';

/** The blurred mark and the glow behind every panel: settle, don't slide. */
function shell({ q, tl }: PanelMotion) {
  tl.from(
    q('.steps__mark'),
    { scale: 1.05, opacity: 0, duration: 0.8, ease: 'expo.out', clearProps: CLEAR },
    0,
  ).from(
    q('.steps__glow'),
    { scale: 0.92, opacity: 0, duration: 0.8, ease: 'expo.out', clearProps: CLEAR },
    0.05,
  );
}

/** Both marks leave together, a touch larger, under whatever else is going. */
function shellOut({ q, tl }: PanelMotion) {
  tl.to(q('.steps__mark'), { scale: 1.03, opacity: 0, duration: 0.22 }, 0).to(
    q('.steps__glow'),
    { opacity: 0, duration: 0.22 },
    0,
  );
}

/* Panel 1 — email → account cards → phone -------------------------------- */

function enterRegister(m: PanelMotion) {
  const { q, paths, p, tl } = m;
  shell(m);
  tl.from(q('.s1__email'), { x: -24 * p, opacity: 0, duration: 0.55, clearProps: CLEAR }, 0.06);
  drawOver(tl, q('.s1__connector')[0], q('.s1__connector--draw')[0], paths('.s1__connector--draw path'), {
    at: 0.24,
    duration: 0.5,
    stagger: 0.07,
    ease: 'power2.out',
  });
  tl.from(q('.s1__diamond--orange'), { scale: 0, opacity: 0, duration: 0.35, ease: 'expo.out', clearProps: CLEAR }, 0.3)
    .from(q('.s1__card'), { x: -20 * p, y: 10 * p, opacity: 0, duration: 0.55, stagger: 0.08, clearProps: CLEAR }, 0.36)
    .from(q('.s1__card > *'), { opacity: 0, duration: 0.4, stagger: 0.025, clearProps: CLEAR }, 0.52)
    .from(q('.s1__bracket'), { scaleX: 0.7, opacity: 0, duration: 0.5, transformOrigin: '0% 50%', clearProps: CLEAR }, 0.54)
    .from(q('.s1__diamond--white'), { scale: 0, opacity: 0, duration: 0.35, ease: 'expo.out', clearProps: CLEAR }, 0.66)
    .from(q('.s1__phone'), { y: 20 * p, opacity: 0, duration: 0.6, clearProps: CLEAR }, 0.6)
    .from(q('.s1__status, .s1__phone-rule, .s1__phone-head, .s1__bar--row, .s1__bar--cap'), { opacity: 0, duration: 0.35, stagger: 0.04, clearProps: CLEAR }, 0.82)
    .from(q('.s1__chart'), { y: 10 * p, opacity: 0, duration: 0.45, clearProps: CLEAR }, 0.9)
    .from(q('.s1__bars > span'), { scaleY: 0.12, duration: 0.5, stagger: 0.05, transformOrigin: '50% 100%', clearProps: CLEAR }, 1)
    .from(q('.s1__indicator, .s1__bar--block, .s1__nav'), { opacity: 0, duration: 0.4, stagger: 0.05, clearProps: CLEAR }, 1.02)
    .from(q('.s1__bars i'), { opacity: 0, y: 4 * p, duration: 0.35, clearProps: CLEAR }, 1.4);
}

/** Leaves the way it arrived, in reverse: phone first, email last. */
function leaveRegister(m: PanelMotion) {
  const { q, p, tl } = m;
  shellOut(m);
  tl.to(q('.s1__phone'), { y: 18 * p, opacity: 0, duration: 0.22 }, 0)
    .to(q('.s1__bracket, .s1__diamond--white'), { opacity: 0, duration: 0.18 }, 0.02)
    .to(q('.s1__card'), { x: -18 * p, opacity: 0, duration: 0.22, stagger: 0.03 }, 0.04)
    .to(q('.s1__connector, .s1__diamond--orange'), { opacity: 0, duration: 0.18 }, 0.06)
    .to(q('.s1__email'), { x: -22 * p, opacity: 0, duration: 0.22 }, 0.08);
}

export function PanelRegister(props: PanelProps) {
  const ref = usePanelMotion(enterRegister, leaveRegister, props);
  return (
    <div className="panel panel--1" ref={ref}>
      <Mark className="steps__mark--full" />
      <Glow className="steps__glow--left" />
      <div className="s1" aria-hidden="true">
        <div className="s1__email">
          <img src={envelope} alt="" width={24} height={18.85} />
          <span>you@phirecast.io<i>|</i></span>
        </div>
        <span className="s1__diamond s1__diamond--orange" />
        <img src={connector} alt="" className="s1__connector" width={91.16} height={107.95} />
        <Connector />
        <div className="s1__card s1__card--a">
          <img src={cardGlyph} alt="" className="s1__glyph" />
          <img src={divider} alt="" className="s1__rule" />
          <p className="s1__digits">000 000 000 ****</p>
          <span className="s1__bar s1__bar--pill" />
        </div>
        <div className="s1__card s1__card--b">
          <img src={userGlyph} alt="" className="s1__glyph" />
          <img src={divider} alt="" className="s1__rule" />
          <span className="s1__bar s1__bar--light s1__bar--wide" />
          <span className="s1__bar s1__bar--pill" />
        </div>
        <img src={bracket} alt="" className="s1__bracket" width={80.36} height={182.91} />
        <span className="s1__diamond s1__diamond--white" />
        <div className="s1__phone">
          <div className="s1__status">
            <span className="s1__time">9:41</span>
            <img src={statusArrow} alt="" className="s1__loc" />
            <span className="s1__status-right">
              <img src={signal} alt="" /><img src={data} alt="" />
              <span className="s1__batt"><img src={battery} alt="" /><img src={battTip} alt="" className="s1__batt-tip" /><i>32</i></span>
            </span>
          </div>
          <img src={divider} alt="" className="s1__phone-rule" />
          <div className="s1__phone-head">
            <span className="s1__logo-tile"><img src={phoneLogo} alt="" /></span>
            <span className="s1__skeletons">
              <span className="s1__sk s1__sk--sm" />
              <span className="s1__sk s1__sk--lg" />
            </span>
          </div>
          <span className="s1__bar s1__bar--row" />
          <span className="s1__bar s1__bar--cap" />
          <div className="s1__chart">
            <p className="s1__amount">$3,280</p>
            <div className="s1__bars">
              <span style={{ ['--h' as string]: 26 }} /><span style={{ ['--h' as string]: 34 }} />
              <span className="is-active" style={{ ['--h' as string]: 43 }}><i>+2.41%</i></span>
              <span style={{ ['--h' as string]: 30 }} /><span style={{ ['--h' as string]: 38 }} />
            </div>
          </div>
          <img src={indicator} alt="" className="s1__indicator" />
          <span className="s1__bar s1__bar--block" />
          <img src={bottomnav} alt="" className="s1__nav" />
        </div>
      </div>
    </div>
  );
}

/* Panel 2 — funding rails converge on a locked balance ------------------- */
const RAILS = [s2Tile1, s2Tile2, s2Tile3, s2Tile4, s2Tile5];

/**
 * The one panel that is really a diagram: five rails, four converging lines and
 * five streaks that each lie along their own line. The streaks travel on the
 * axis they are rotated to, read off the element rather than restated here, and
 * stretch out of a compressed head as they land.
 */
function enterFund(m: PanelMotion) {
  const { q, paths, p, tl } = m;
  shell(m);
  tl.from(q('.s2__tile'), { x: -28 * p, opacity: 0, duration: 0.5, stagger: 0.06, clearProps: CLEAR }, 0.06);
  drawOver(tl, q('.s2__lines')[0], q('.s2__lines--draw')[0], paths('.s2__lines--draw path'), {
    at: 0.22,
    duration: 0.8,
    ease: 'power2.inOut',
  });

  q('.s2__comet').forEach((comet, i) => {
    const a = angleOf(comet);
    const travel = (70 + i * 8) * p;
    tl.from(
      comet,
      {
        x: -Math.cos(a) * travel,
        y: -Math.sin(a) * travel,
        scaleX: 0.3,
        opacity: 0,
        duration: 0.55,
        ease: 'expo.out',
        transformOrigin: '100% 50%',
        clearProps: CLEAR,
      },
      0.52 + i * 0.07,
    );
  });

  tl.from(q('.s2__balance'), { x: 32 * p, opacity: 0, duration: 0.6, clearProps: CLEAR }, 0.58)
    .from(q('.s2__node'), { scale: 0.4, opacity: 0, duration: 0.5, ease: 'expo.out', clearProps: CLEAR }, 0.76)
    .from(q('.s2__balance-label'), { opacity: 0, duration: 0.35, clearProps: CLEAR }, 0.78);

  const amount = q('.s2__balance-amt')[0];
  if (amount) countMoney(tl, amount, 18800, { duration: 0.8, at: 0.78 });

  tl.from(q('.s2__dots i'), { scaleX: 0, opacity: 0, duration: 0.4, stagger: 0.05, transformOrigin: '0% 50%', clearProps: CLEAR }, 1.05);
}

/** The streaks do not stop — they carry on down their own line and out. */
function leaveFund(m: PanelMotion) {
  const { q, p, tl } = m;
  shellOut(m);
  q('.s2__comet').forEach((comet, i) => {
    const a = angleOf(comet);
    const travel = 54 * p;
    tl.to(comet, { x: Math.cos(a) * travel, y: Math.sin(a) * travel, opacity: 0, duration: 0.24, ease: 'power2.in' }, i * 0.02);
  });
  tl.to(q('.s2__lines'), { opacity: 0, duration: 0.2 }, 0.02)
    .to(q('.s2__node'), { scale: 0.6, opacity: 0, duration: 0.2 }, 0.04)
    .to(q('.s2__balance'), { x: 26 * p, opacity: 0, duration: 0.24 }, 0.02)
    .to(q('.s2__tile'), { x: -18 * p, opacity: 0, duration: 0.22, stagger: 0.025 }, 0.06);
}

export function PanelFund(props: PanelProps) {
  const ref = usePanelMotion(enterFund, leaveFund, props);
  return (
    <div className="panel panel--2" ref={ref}>
      <Mark className="steps__mark--right" />
      <Glow className="steps__glow--right" />
      <div className="s2" aria-hidden="true">
        <div className="s2__rails">
          {RAILS.map((icon, i) => (
            <span key={i} className={`s2__tile${i === 0 ? ' is-first' : ''}${i > 2 ? ' is-dim' : ''}`}>
              <img src={icon} alt="" />
            </span>
          ))}
        </div>
        <img src={s2Lines} alt="" className="s2__lines" width={347.7} height={315.7} />
        <Lines />
        {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`s2__comet s2__comet--${i}`} />)}
        <span className="s2__node"><img src={s2Node} alt="" /><img src={s2Lock} alt="" className="s2__lock" /></span>
        <div className="s2__balance">
          <div className="s2__balance-inner">
            <p className="s2__balance-label">Balance</p>
            <p className="s2__balance-amt">$18,800</p>
            <span className="s2__dots"><i /><i className="is-bar" /><i /><i /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Panel 3 — market picker and price chart -------------------------------- */
const ASSETS = [
  { icon: s3Btc, active: true },
  { icon: s3Target, active: false },
  { icon: s3Tesla, active: false },
  { icon: s3Sp500, active: false },
  { icon: s3Apple, active: false },
];

function enterTrade(m: PanelMotion) {
  const { q, p, tl } = m;
  shell(m);
  tl.from(q('.s3'), { scale: 0.985, opacity: 0, duration: 0.6, clearProps: CLEAR }, 0.08)
    .from(q('.s3__tile'), { y: 12 * p, opacity: 0, duration: 0.45, stagger: 0.05, clearProps: CLEAR }, 0.22)
    .from(q('.s3__label, .s3__price, .s3__delta'), { y: 8 * p, opacity: 0, duration: 0.45, stagger: 0.06, clearProps: CLEAR }, 0.42)
    // The chart slides up out of the card's own clip, so it draws itself in.
    .from(q('.s3__chart'), { y: 22 * p, opacity: 0, duration: 0.6, clearProps: CLEAR }, 0.48);
}

function leaveTrade(m: PanelMotion) {
  const { q, p, tl } = m;
  shellOut(m);
  tl.to(q('.s3__chart'), { y: 16 * p, opacity: 0, duration: 0.22 }, 0)
    .to(q('.s3__label, .s3__price, .s3__delta'), { opacity: 0, duration: 0.18, stagger: 0.02 }, 0.02)
    .to(q('.s3__tile'), { y: -10 * p, opacity: 0, duration: 0.22, stagger: 0.025 }, 0.04)
    .to(q('.s3'), { scale: 0.99, opacity: 0, duration: 0.22 }, 0.06);
}

export function PanelTrade(props: PanelProps) {
  const ref = usePanelMotion(enterTrade, leaveTrade, props);
  return (
    <div className="panel panel--3" ref={ref}>
      <Mark className="steps__mark--corner" />
      <Glow className="steps__glow--corner" />
      <div className="s3" aria-hidden="true">
        <div className="s3__tiles">
          {ASSETS.map((a, i) => (
            <span key={i} className={`s3__tile${a.active ? ' is-active' : ''}`}><img src={a.icon} alt="" /></span>
          ))}
        </div>
        <div className="s3__chart-card">
          <p className="s3__label">Market price</p>
          <p className="s3__price">62,894.<span>00</span></p>
          <p className="s3__delta">+2.41%</p>
          <img src={s3Chart} alt="" className="s3__chart" width={371} height={191} />
        </div>
      </div>
    </div>
  );
}

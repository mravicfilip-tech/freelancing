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

/* Panel 1 — email → account cards → phone -------------------------------- */
export function PanelRegister() {
  return (
    <div className="panel panel--1">
      <Mark className="steps__mark--full" />
      <Glow className="steps__glow--left" />
      <div className="s1" aria-hidden="true">
        <div className="s1__email">
          <img src={envelope} alt="" width={24} height={18.85} />
          <span>you@phirecast.io<i>|</i></span>
        </div>
        <span className="s1__diamond s1__diamond--orange" />
        <img src={connector} alt="" className="s1__connector" width={91.16} height={107.95} />
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

export function PanelFund() {
  return (
    <div className="panel panel--2">
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

export function PanelTrade() {
  return (
    <div className="panel panel--3">
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

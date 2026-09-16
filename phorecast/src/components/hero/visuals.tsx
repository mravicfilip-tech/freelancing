import chartBtc from '../../assets/hero/chart-btc.svg';
import chartXau from '../../assets/hero/chart-xau.svg';
import yLeft from '../../assets/hero/y-left.svg';
import yRight from '../../assets/hero/y-right.svg';
import btcLogo from '../../assets/hero/btc-logo.svg';
import goldLogo from '../../assets/hero/gold-logo.svg';
import trendUp from '../../assets/hero/trend-up.svg';
import trendDown from '../../assets/hero/trend-down.svg';
import toastGlobe from '../../assets/hero/toast-globe.svg';
import pie1 from '../../assets/hero/pie-1.svg';
import pie2 from '../../assets/hero/pie-2.svg';
import pie3 from '../../assets/hero/pie-3.svg';
import bolt from '../../assets/hero/bolt.svg';
import tagDot from '../../assets/hero/tag-dot.svg';
import btcCircle from '../../assets/hero/btc-circle.svg';
import btcGlyph from '../../assets/hero/btc-glyph.svg';
import logoWhite from '../../assets/hero/logo-white.svg';
import circuit from '../../assets/hero/circuit.svg';
import shortLine from '../../assets/hero/short-line.svg';
import ringLg from '../../assets/hero/ring-lg.svg';
import ringMd from '../../assets/hero/ring-md.svg';
import ringSm from '../../assets/hero/ring-sm.svg';
import ringDot from '../../assets/hero/ring-dot.svg';
import avatarMadrid from '../../assets/hero/pred-real-madrid.jpg';
import avatarGuterres from '../../assets/hero/mini-2.jpg';
import avatarOpec from '../../assets/hero/mini-3.jpg';
import crestGen from '../../assets/hero/mini-gen.jpg';
import crestSud from '../../assets/hero/avatar.png';

/* ---------------------------------------------------------------- slide 2 */

const ODDS = [
  { label: 'This year', pct: '92%' },
  { label: '<2 Years', pct: '4%' },
  { label: '5+ Years', pct: '2%' },
];

function MarketCard(props: {
  mod: string; pair: string; name: string; icon: React.ReactNode;
  priceMain: string; priceDec: string; delta: string; up: boolean; unit: string; chart: string;
}) {
  return (
    <div className={`mcard mcard--${props.mod}`}>
      <div className="mcard__head">
        {props.icon}
        <span className="mcard__id">
          <b>{props.pair}</b>
          <i>{props.name}</i>
        </span>
        <span className="mcard__trend">
          <img src={props.up ? trendUp : trendDown} alt="" />
        </span>
      </div>
      <p className="mcard__label">{props.unit}</p>
      <p className="mcard__price">{props.priceMain}<span>{props.priceDec}</span></p>
      <p className={`mcard__delta${props.up ? '' : ' is-down'}`}>{props.delta}</p>
      <img src={props.chart} alt="" className="mcard__chart" />
      <div className="mcard__ranges">
        <span className="is-active">1D</span><span>1W</span><span>1M</span>
      </div>
    </div>
  );
}

function MiniPrediction({ avatar, title, vol, ends, pct, fill }: { avatar: string; title: string; vol: string; ends: string; pct: string; fill: number }) {
  return (
    <div className="mini mini--pred">
      <div className="mini__meta"><span>{vol}</span><span>{ends}</span></div>
      <div className="mini__head">
        <img src={avatar} alt="" className="mini__avatar" />
        <p className="mini__title">{title}</p>
      </div>
      <div className="mini__bar"><span style={{ width: `${fill}%` }} /><i>{pct}</i></div>
      <div className="mini__btns"><span className="is-yes">Yes</span><span className="is-no">No</span></div>
    </div>
  );
}

export function VisualAccount() {
  return (
    <div className="hv2" aria-hidden="true">
      <div className="hv2__group">
        <div className="hv2__row">
          <div className="pred">
            <div className="pred__meta"><span>$23.1K Vol</span><span>Ends in 1mo 14d</span></div>
            <div className="pred__head">
              <img src={avatarMadrid} alt="" className="pred__avatar" width={39} height={39} />
              <p className="pred__title">Real Madrid wins Champions League</p>
            </div>
            <ul className="pred__odds">
              {ODDS.map((o) => (
                <li key={o.label}>
                  <span className="pred__odds-label">{o.label}</span>
                  <span className="pred__odds-pct">{o.pct}</span>
                  <span className="pred__chip pred__chip--yes">Yes</span>
                  <span className="pred__chip pred__chip--no">No</span>
                </li>
              ))}
            </ul>
          </div>

          <MarketCard
            mod="btc" pair="BTC/USD" name="Bitcoin" up
            icon={<img src={btcLogo} alt="" className="mcard__icon" />}
            unit="Market price" priceMain="62,894." priceDec="00" delta="+2.41%" chart={chartBtc}
          />
          <MarketCard
            mod="xau" pair="XAU/USD" name="Gold" up={false}
            icon={<span className="mcard__icon mcard__icon--gold"><img src={goldLogo} alt="" /></span>}
            unit="Market price · USD/oz" priceMain="4,289.74" priceDec="00" delta="−0.20%" chart={chartXau}
          />

          <div className="hv2__minis">
            <MiniPrediction avatar={avatarOpec} title="Will another country leave OPEC in 2026?" vol="$2.3K Vol" ends="Ends in 3mo 16d" pct="74,00%" fill={76.6} />
            <MiniPrediction avatar={avatarGuterres} title="António Guterres out by December 31?" vol="$2.3K Vol" ends="Ends in 3mo 16d" pct="53,50%" fill={59.35} />
            <div className="mini mini--sport">
              <div className="mini__meta">
                <span className="mini__live"><i />Live</span>
                <span className="mini__chip">16:00</span>
                <span className="mini__ov">Game overview</span>
              </div>
              <div className="mini__team"><span className="mini__score">0</span><img src={crestGen} alt="" /><p>Genoa CFC</p></div>
              <div className="mini__team"><span className="mini__score">0</span><img src={crestSud} alt="" /><p>FC Südtirol</p></div>
              <div className="mini__btns mini__btns--three">
                <span className="is-yes">GEN 53¢</span><span className="is-draw">DRAW 38¢</span><span className="is-no">SUD 15¢</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hv2__badges">
          <div className="toast">
            <img src={toastGlobe} alt="" className="toast__globe" />
            <span className="toast__text"><b>Trade executed</b><i>Buy 0.25 BTC at 62,894.00</i></span>
          </div>
          <span className="hv2__tile hv2__tile--pie">
            <img src={pie1} alt="" style={{ inset: '54.02% 0 15.98% 59.84%' }} />
            <img src={pie2} alt="" style={{ inset: '4.2% 6.6% 51.78% 49.39%' }} />
            <img src={pie3} alt="" style={{ inset: '7.68% 25.91% 4.2% 0' }} />
          </span>
          <span className="hv2__tile"><img src={bolt} alt="" /></span>
          <span className="hv2__onchain"><img src={tagDot} alt="" />On chain</span>
        </div>
      </div>

      <img src={yLeft} alt="" className="hv2__y hv2__y--l" />
      <img src={yRight} alt="" className="hv2__y hv2__y--r" />
      <span className="hv2__diamond" />
      <div className="acct-pill">
        <span className="acct-pill__circle"><img src={btcCircle} alt="" /><img src={logoWhite} alt="" className="acct-pill__logo" /></span>
        <span className="acct-pill__body">One Account</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- slide 4 */

const TILES = [
  { x: 393.5, y: 196 },
  { x: 116.5, y: 203 },
  { x: 471.5, y: -54 },
  { x: 393.5, y: -303 },
  { x: 116.5, y: -310 },
];

const DOTS = [
  [490, 328], [536, 295], [536, 546], [490, 510], [456, 427], [456, 415], [278, 421],
];

export function VisualFuture() {
  return (
    <div className="hv4" aria-hidden="true">
      <img src={circuit} alt="" className="hv4__circuit hv4__circuit--top" />
      <img src={circuit} alt="" className="hv4__circuit hv4__circuit--bottom" />

      <img src={ringLg} alt="" className="hv4__ring hv4__ring--lg" />
      <img src={ringMd} alt="" className="hv4__ring hv4__ring--md" />
      <img src={ringSm} alt="" className="hv4__ring hv4__ring--sm" />
      {DOTS.map(([x, y], i) => (
        <img key={i} src={ringDot} alt="" className="hv4__dot" style={{ ['--x' as string]: x, ['--y' as string]: y }} />
      ))}

      {TILES.map((t, i) => (
        <span key={i} className="hv4__chip" style={{ ['--x' as string]: t.x, ['--y' as string]: t.y }}>
          <img src={logoWhite} alt="" />
        </span>
      ))}

      <div className="hv4__pill">
        <span className="hv4__pill-circle"><img src={btcCircle} alt="" /><img src={btcGlyph} alt="" className="hv4__pill-glyph" /></span>
        <span className="hv4__pill-body">BTC/USD</span>
      </div>
      <img src={shortLine} alt="" className="hv4__line" />
      <span className="hv4__diamond" />

      <span className="hv4__tag hv4__tag--sport"><img src={tagDot} alt="" />Sport</span>
      <span className="hv4__tag hv4__tag--elections"><img src={tagDot} alt="" />Elections</span>
    </div>
  );
}

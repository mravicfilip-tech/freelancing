import dot from '../../assets/icons/live-dot.svg';
import { Roll } from '../Roll';
import ecb from '../../assets/familiar/ecb.svg';
import nvidia from '../../assets/familiar/nvidia.svg';
import trendA from '../../assets/familiar/trend-a.svg';
import trendB from '../../assets/familiar/trend-b.svg';
import arrowDown from '../../assets/familiar/arrow-down.svg';
import bank from '../../assets/familiar/bank.svg';
import avatar from '../../assets/familiar/avatar.jpg';
import ghost from '../../assets/familiar/ghost.png';
import logo from '../../assets/familiar/logo.svg';
import signal from '../../assets/familiar/signal.svg';
import data from '../../assets/familiar/data.svg';
import battery from '../../assets/familiar/battery.svg';
import battTip from '../../assets/familiar/batt-tip.svg';
import loc from '../../assets/familiar/loc.svg';
import btc from '../../assets/familiar/btc.svg';
import flagFr from '../../assets/familiar/flag-fr.jpg';
import search from '../../assets/familiar/search.svg';
import filter from '../../assets/familiar/filter.svg';
import trendTab from '../../assets/familiar/trend-tab.svg';
import './Familiar.css';

const CANDIDATES = [
  { name: 'Éric Zemmour', pct: '87%' },
  { name: 'François Hollande', pct: '56%' },
  { name: 'Bernard Cazeneuve', pct: '55%' },
];

const CHIPS = ['Politics', 'Sports', 'Crypto', 'Finance'];

function Phone() {
  return (
    <div className="fam__phone" aria-hidden="true">
      <div className="fam__screen">
        <div className="fam__status">
          <span className="fam__time">9:41</span>
          <img src={loc} alt="" className="fam__loc" />
          <span className="fam__status-right">
            <img src={signal} alt="" /><img src={data} alt="" />
            <span className="fam__batt"><img src={battery} alt="" /><img src={battTip} alt="" className="fam__batt-tip" /></span>
          </span>
        </div>

        <div className="fam__brand">
          <img src={logo} alt="" />
          <span>Phorecast</span>
        </div>

        <div className="fam__tabs">
          <span className="is-active">All events</span>
          <span className="fam__tab-trend"><img src={trendTab} alt="" />Trending</span>
          <i className="fam__tab-rule" />
          <span>Ending Soon</span>
          <span className="fam__tab-cut">Pol</span>
        </div>

        <div className="fam__search">
          <span className="fam__search-field"><img src={search} alt="" />Search markets…</span>
          <img src={filter} alt="" className="fam__filter" />
        </div>

        <div className="fam__event">
          <div className="fam__event-meta"><span>$78.4K Vol</span><span>Ends in 7mo 7d</span></div>
          <div className="fam__event-head">
            <img src={flagFr} alt="" className="fam__event-avatar" />
            <p>French Presidential Election: who will announce a run in 2026?</p>
          </div>
          <ul className="fam__rows">
            {CANDIDATES.map((c) => (
              <li key={c.name}>
                <span className="fam__row-name">{c.name}</span>
                <span className="fam__row-pct">{c.pct}</span>
                <span className="fam__chip fam__chip--yes">Yes</span>
                <span className="fam__chip fam__chip--no">No</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="fam__event fam__event--btc">
          <div className="fam__event-meta"><span>$9.3M Vol</span><span>3:01</span></div>
          <div className="fam__btc">
            <img src={btc} alt="" className="fam__btc-icon" />
            <p>BTC Up or Down 5m</p>
            <span className="fam__gauge">63%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketCard(props: {
  mod: string; icon: string; iconClass?: string; symbol: string; name: string;
  value: string; up: boolean; footer: React.ReactNode; footerMod: string;
}) {
  return (
    <div className={`fam__mkt fam__mkt--${props.mod}`} aria-hidden="true">
      <div className="fam__mkt-head">
        <img src={props.icon} alt="" className={`fam__mkt-icon ${props.iconClass ?? ''}`} />
        <span className="fam__mkt-symbol">{props.symbol}</span>
        <img src={props.up ? trendB : trendA} alt="" className={`fam__mkt-trend${props.up ? "" : " is-down"}`} />
      </div>
      <p className="fam__mkt-name">{props.name}</p>
      <p className="fam__mkt-value">{props.value}</p>
      <div className={`fam__mkt-foot fam__mkt-foot--${props.footerMod}`}>{props.footer}</div>
    </div>
  );
}

export function Familiar() {
  return (
    <section className="fam" aria-labelledby="fam-title">
      <div className="fam__bg glow-fade--top" aria-hidden="true">
        <span className="fam__g fam__g--red" />
        <span className="fam__g fam__g--orange" />
        <span className="fam__g fam__g--peach" />
        <span className="fam__g fam__g--cream" />
      </div>

      <div className="fam__stage">
        <div className="fam__copy fam__copy--left">
          <p className="eyebrow">
            <img src={dot} alt="" className="eyebrow__dot" width={12} height={12} />
            Built for Traders
          </p>
          <h2 id="fam-title" className="fam__title">Familiar Trading.<br />Better Infrastructure.</h2>
        </div>

        <div className="fam__copy fam__copy--right">
          <h3 className="fam__sub-title">Phorecast Trading</h3>
          <p className="fam__sub-body">Trade crypto, forex, stocks, commodities and indices through one simple, intuitive platform.</p>
          <a href="#signup" className="btn btn--primary fam__cta"><Roll>Start Trading</Roll></a>
        </div>

        <MarketCard
          mod="ecb" icon={ecb} symbol="ECB" name="Deposit Facility Rate" value="2.25%" up
          footerMod="dark" footer={<><img src={bank} alt="" />Current policy rate</>}
        />
        <MarketCard
          mod="nvda" icon={nvidia} iconClass="fam__mkt-icon--nvda" symbol="NVDA" name="NVIDIA" value="$218.36" up={false}
          footerMod="red" footer={<><img src={arrowDown} alt="" className="is-down" />-2.37%</>}
        />

        <Phone />

        <span className="fam__ghost fam__ghost--a" aria-hidden="true"><img src={ghost} alt="" /></span>
        <span className="fam__ghost fam__ghost--b" aria-hidden="true"><img src={ghost} alt="" /></span>

        <div className="fam__pred" aria-hidden="true">
          <div className="fam__pred-meta"><span>$112.5K Vol</span><span>Ends in 3mo 17d</span></div>
          <div className="fam__pred-head">
            <img src={avatar} alt="" />
            <p>UAE x Saudi Arabia sever diplomatic relations in 2026?</p>
          </div>
          <div className="fam__pred-bar"><i /><span>95,70%</span></div>
          <div className="fam__pred-btns"><span className="is-yes">Yes</span><span className="is-no">No</span></div>
        </div>
      </div>

      <div className="fam__band" aria-hidden="true">
        <span className="fam__horizon" />
        <div className="fam__chips">
          <span className="fam__chip-dot" />
          {CHIPS.map((c) => <span key={c} className="fam__chip-pill">{c}</span>)}
          <span className="fam__chip-dot" />
        </div>
      </div>
    </section>
  );
}

import dot from '../../assets/icons/live-dot.svg';
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
import nodeLock from '../../assets/built/node-lock.svg';
import gold from '../../assets/built/gold.svg';
import arrow from '../../assets/built/arrow.svg';
import tesla from '../../assets/built/tesla.svg';
import './Built.css';

function CardOne() {
  return (
    <div className="bt-card bt-card--one">
      <span className="bt-card__glow bt-card__glow--right" aria-hidden="true" />
      <span className="bt-label bt-label--tl">One market</span>
      <span className="bt-label bt-label--tr">Familiar from day one</span>
      <div className="bt1" aria-hidden="true">
        <img src={youDot} alt="" className="bt1__dot" width={24} height={24} />
        <img src={line} alt="" className="bt1__line" width={174} height={3} />
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
        <p className="bt1__pair">BTC / USD</p>
        <p className="bt1__note">One market to start.</p>
      </div>
    </div>
  );
}

type Node = { key: string; label: string; size: number; x: number; y: number; ring: string; icon?: string; iconSize?: number; whole?: string; wholeSize?: number };

const NODES: Node[] = [
  { key: 'btc', label: 'BTC / USD', size: 64, x: -215, y: -23, ring: nodeRingC, icon: nodeBtc, iconSize: 17.9 },
  { key: 'tsla', label: 'TSLA', size: 50, x: -74, y: -72, ring: nodeRingA, icon: tesla, iconSize: 15.4 },
  { key: 'dax', label: 'DAX 40', size: 60, x: 85, y: -72, ring: '', whole: nodeDax, wholeSize: 81 },
  { key: 'eur', label: 'EUR / USD', size: 50, x: -106, y: 28, ring: '', whole: nodeEur, wholeSize: 67.5 },
  { key: 'xau', label: 'XAU / USD', size: 50, x: 28, y: 48, ring: nodeRingB, icon: gold, iconSize: 16 },
];

function CardTwo() {
  return (
    <div className="bt-card bt-card--two">
      <span className="bt-card__glow bt-card__glow--left" aria-hidden="true" />
      <span className="bt-label bt-label--tl bt-label--grey">Five markets</span>
      <span className="bt-label bt-label--tr bt-label--grey">Fast onboarding</span>
      <span className="bt-label bt-label--bl">Transparent execution</span>
      <div className="bt2" aria-hidden="true">
        <img src={linkFan} alt="" className="bt2__fan" />
        <img src={linkMain} alt="" className="bt2__main" />
        <span className="bt2__smear" />
        {NODES.map((n) => (
          <span key={n.key} className="bt2__node" style={{ ['--x' as string]: n.x, ['--y' as string]: n.y, ['--s' as string]: n.size }}>
            {n.whole ? (
              <img src={n.whole} alt="" className="bt2__whole" />
            ) : (
              <>
                <img src={nodeDisc} alt="" className="bt2__disc" />
                <img src={nodeDiscSoft} alt="" className="bt2__disc bt2__disc--soft" />
                <img src={n.ring} alt="" className="bt2__ring" />
                <img src={n.icon} alt="" className="bt2__icon" style={{ width: n.iconSize, height: n.iconSize }} />
              </>
            )}
            <span className="bt2__label">{n.label}</span>
          </span>
        ))}
        <span className="bt2__node bt2__node--lock" style={{ ['--x' as string]: 226, ['--y' as string]: 0, ['--s' as string]: 70 }}>
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
    title: 'New to Trading?',
    body: 'Start with a simple, intuitive platform designed to make accessing global markets feel familiar from day one.',
    cta: 'Start Trading',
    href: '#signup',
  },
  {
    card: <CardTwo />,
    title: 'Experienced Trader?',
    body: 'Trade crypto, forex, stocks, commodities and indices with fast onboarding, non-custodial settlement and transparent execution.',
    cta: 'Explore Markets',
    href: '#markets',
  },
];

export function Built() {
  return (
    <section className="built" id="built" aria-labelledby="built-title">
      <span className="built__glow" aria-hidden="true" />
      <div className="container built__inner">
        <header className="built__head">
          <p className="eyebrow">
            <img src={dot} alt="" className="eyebrow__dot" width={12} height={12} />
            Better Infrastructure
          </p>
          <h2 id="built-title" className="built__title">Built for the Way You Trade</h2>
          <p className="built__sub">A familiar trading experience, rebuilt with faster access, greater transparency and more control.</p>
        </header>

        <div className="built__cols">
          {COLUMNS.map((c) => (
            <div key={c.title} className="built__col">
              {c.card}
              <div className="built__copy">
                <h3 className="built__col-title">{c.title}</h3>
                <p className="built__col-body">{c.body}</p>
                <a href={c.href} className="built__cta">{c.cta}<img src={arrow} alt="" width={12} height={6} /></a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

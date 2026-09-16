import arrowWhite from '../../assets/bento/arrow-white.svg';
import arrowOrange from '../../assets/bento/arrow-orange.svg';
import arrowOrangeLight from '../../assets/bento/arrow-orange-light.svg';
import phone from '../../assets/bento/phone.svg';
import grid from '../../assets/bento/grid.svg';
import ring60 from '../../assets/bento/ring-60s.png';
import ringArc from '../../assets/bento/ring-arc.svg';
import fundsGlow from '../../assets/bento/funds-glow.png';
import fundsRingOrange from '../../assets/bento/funds-ring-orange.svg';
import fundsRingWallet from '../../assets/bento/funds-ring-wallet.svg';
import fundsWalletDisc from '../../assets/bento/funds-wallet-disc.svg';
import iconWallet from '../../assets/bento/icon-wallet.svg';
import iconStocks from '../../assets/bento/icon-stocks.svg';
import iconCrypto from '../../assets/bento/icon-crypto.svg';
import iconCommodities from '../../assets/bento/icon-commodities.svg';
import iconForex from '../../assets/bento/icon-forex.svg';
import iconContract from '../../assets/bento/icon-contract.svg';
import iconLockBody from '../../assets/bento/icon-lock-body.svg';
import iconLockHole from '../../assets/bento/icon-lock-hole.svg';
import nodeDot from '../../assets/bento/node-dot.svg';
import chartLine from '../../assets/bento/chart-line.svg';
import chartMarker from '../../assets/bento/chart-marker.svg';
import bonusWallet from '../../assets/bento/bonus-wallet.svg';
import iconPlus from '../../assets/bento/icon-plus.svg';
import iconBolt from '../../assets/bento/icon-bolt.svg';
import pie1 from '../../assets/bento/pie-1.svg';
import pie2 from '../../assets/bento/pie-2.svg';
import pie3 from '../../assets/bento/pie-3.svg';
import orbitRing from '../../assets/bento/orbit-ring.svg';
import tileGold from '../../assets/bento/tile-gold.svg';
import tileNikkei from '../../assets/bento/tile-nikkei.svg';
import tileApple from '../../assets/bento/tile-apple.svg';
import tileDax from '../../assets/bento/tile-dax.svg';
import tilePhorecast from '../../assets/bento/tile-phorecast.svg';
import tileSp500 from '../../assets/bento/tile-sp500.svg';
import tileSolana from '../../assets/bento/tile-solana.svg';
import tileTesla from '../../assets/bento/tile-tesla.svg';
import tileBitcoin from '../../assets/bento/tile-bitcoin.svg';
import tileDoge from '../../assets/bento/tile-doge.svg';
import tileCopper from '../../assets/bento/tile-copper.svg';
import tileOil from '../../assets/bento/tile-oil.svg';
import tileDow from '../../assets/bento/tile-dow.png';
import cursor from '../../assets/bento/cursor.svg';
import './Bento.css';

function Cta({ children, href, tone, arrow }: { children: string; href: string; tone: 'white' | 'orange' | 'orange-light'; arrow: string }) {
  return (
    <a href={href} className={`bento__cta bento__cta--${tone}`}>
      {children}
      <img src={arrow} alt="" width={12} height={6} />
    </a>
  );
}

/* Card A — Open an account in 60 seconds */
function CardOnboard() {
  return (
    <article className="bcard bcard--onboard">
      <div className="bcard__art" aria-hidden="true">
        <img src={phone} alt="" className="onboard__phone" width={214} height={420} />
        <div className="onboard__grid"><img src={grid} alt="" width={488.255} height={312} /></div>
        <span className="onboard__chip" style={{ left: 111, top: 149, width: 76 }}>No KYC</span>
        <span className="onboard__chip onboard__chip--blur" style={{ left: 87, top: 187, width: 100 }}>No documents</span>
        <span className="onboard__chip" style={{ left: 111, top: 225, width: 76 }}>No waiting</span>
        <div className="onboard__ring">
          <img src={ring60} alt="" className="onboard__ring-img" width={128.01} height={128.78} />
          <img src={ringArc} alt="" className="onboard__ring-arc" width={90.82} height={64.36} />
          <span className="onboard__seconds">60s</span>
        </div>
        <span className="onboard__in">You’re in.</span>
      </div>
      <div className="bcard__text">
        <h3 className="bcard__title" style={{ maxWidth: 374 }}>Open an account in 60 seconds</h3>
        <p className="bcard__body bcard__body--light" style={{ maxWidth: 353 }}>No KYC, no documents, no waiting.</p>
      </div>
      <Cta href="#signup" tone="white" arrow={arrowWhite}>Open an Account</Cta>
    </article>
  );
}

/* Card B — Your funds leave whenever you want */
function CardFunds() {
  const tile = (icon: string, x: number, y: number, bordered = false) => (
    <span className={`funds__tile${bordered ? ' funds__tile--bordered' : ''}`} style={{ left: x, top: y }}>
      <img src={icon} alt="" width={16} height={16} />
    </span>
  );
  return (
    <article className="bcard bcard--funds">
      <div className="bcard__text">
        <h3 className="bcard__title">Your funds leave whenever you want</h3>
        <p className="bcard__body">Collateral sits in contracts we never touch.</p>
      </div>
      <div className="funds__art" aria-hidden="true">
        <img src={fundsGlow} alt="" className="funds__glow" width={215} height={118} />
        <img src={fundsRingOrange} alt="" className="funds__ring-orange" width={215} height={215} />
        <img src={fundsRingWallet} alt="" className="funds__ring-wallet" width={93} height={93} />
        <img src={fundsWalletDisc} alt="" className="funds__wallet-disc" width={37} height={37} />
        <img src={iconWallet} alt="" className="funds__wallet-icon" width={18} height={18} />
        <span className="funds__label funds__label--wallet" style={{ left: 43, top: 131 }}>Wallet</span>
        <span className="funds__label" style={{ left: 348, top: 12 }}>Stocks</span>
        <span className="funds__label" style={{ left: 386, top: 62 }}>Crypto</span>
        <span className="funds__label" style={{ left: 349, top: 129 }}>Commodities</span>
        <span className="funds__label" style={{ left: 350, top: 187 }}>Forex</span>
        {tile(iconStocks, 394, 0, true)}
        {tile(iconCrypto, 432, 55)}
        {tile(iconCommodities, 432, 124)}
        {tile(iconForex, 389, 182)}
        <span className="funds__pill" style={{ left: 133, top: 31, width: 133 }}>
          <img src={iconContract} alt="" width={16} height={16} />Smart Contracts
        </span>
        <span className="funds__pill" style={{ left: 115, top: 144, width: 146 }}>
          <span className="funds__lock">
            <img src={iconLockBody} alt="" className="funds__lock-body" />
            <img src={iconLockHole} alt="" className="funds__lock-hole" />
          </span>
          Withdraw anytime
        </span>
        <img src={nodeDot} alt="" className="funds__node" style={{ left: 22 - 7, top: 67 - 7 }} width={22} height={22} />
        <img src={nodeDot} alt="" className="funds__node" style={{ left: 298 - 7, top: 104 - 7 }} width={22} height={22} />
      </div>
      <Cta href="#how" tone="orange" arrow={arrowOrange}>See How It Works</Cta>
    </article>
  );
}

/* Card C — Double your capital on first deposit */
function CardBonus() {
  return (
    <article className="bcard bcard--bonus">
      <div className="bonus__chart" aria-hidden="true">
        <img src={chartLine} alt="" className="bonus__line" width={564} height={196.6} />
        <img src={chartMarker} alt="" className="bonus__marker" width={36.36} height={137.4} />
        <div className="bonus__grid"><img src={grid} alt="" width={488.255} height={312} /></div>
      </div>
      <div className="bcard__text">
        <h3 className="bcard__title">Double your capital on first deposit</h3>
        <p className="bcard__body">Up to $200 on your first deposit.</p>
      </div>
      <div className="bonus__pill" aria-hidden="true">
        <img src={bonusWallet} alt="" width={42} height={42} />
        <span className="bonus__amt"><strong>+$200.00</strong><small>Deposit</small></span>
        <img src={iconPlus} alt="" width={16} height={16} />
        <span className="bonus__amt bonus__amt--orange"><strong>+$200.00</strong><small>Bonus</small></span>
      </div>
      <span className="bonus__tile" style={{ left: 629, top: 72.5 }} aria-hidden="true"><img src={iconBolt} alt="" width={28} height={28} /></span>
      <span className="bonus__tile bonus__tile--pie" style={{ left: 345, top: 142.5 }} aria-hidden="true">
        <img src={pie1} alt="" style={{ left: '59.84%', top: '54.02%', width: '40.16%', height: '30%' }} />
        <img src={pie2} alt="" style={{ left: '49.39%', top: '4.2%', width: '44.01%', height: '44.02%' }} />
        <img src={pie3} alt="" style={{ left: 0, top: '7.68%', width: '74.09%', height: '88.12%' }} />
      </span>
      <Cta href="#bonus" tone="orange" arrow={arrowOrange}>Get Your Bonus</Cta>
    </article>
  );
}

/* Card D — Trade every market from one account */
function CardMarkets() {
  const light = (icon: string, x: number, y: number, size: number, iw: number, ih: number, radius: number) => (
    <span className="mk__tile mk__tile--light" style={{ left: x, top: y, width: size, height: size, borderRadius: radius }}>
      <img src={icon} alt="" style={{ width: iw, height: ih }} />
    </span>
  );
  const dark = (icon: string | null, x: number, y: number, size: number, iw: number, opacity: number, bg = '#313131') => (
    <span className="mk__tile mk__tile--dark" style={{ left: x, top: y, width: size, height: size, opacity, background: bg }}>
      {icon && <img src={icon} alt="" style={{ width: iw, height: iw }} />}
    </span>
  );
  return (
    <article className="bcard bcard--markets">
      <div className="mk__grid" aria-hidden="true"><img src={grid} alt="" width={488.255} height={312} /></div>
      <div className="mk__orbits" aria-hidden="true">
        <img src={orbitRing} alt="" className="mk__orbit mk__orbit--a" width={498.3} height={186.4} />
        <img src={orbitRing} alt="" className="mk__orbit mk__orbit--b" width={498.3} height={186.4} />
      </div>
      <div className="bcard__text">
        <h3 className="bcard__title bcard__title--dark">Trade every market from one account</h3>
        <p className="bcard__body bcard__body--sm">Crypto, forex, commodities, indices and equities.</p>
      </div>
      <div className="mk__field" aria-hidden="true">
        {light(tileGold, 190.6, 146, 42, 19.5, 19.5, 7.5)}
        {light(tileNikkei, 199, 315, 64, 46.08, 10.24, 11.4)}
        {light(tileApple, 435, 27, 36, 20, 20, 6.6)}
        {light(tileDax, 512, 99, 28, 18, 7.35, 5)}
        <span className="mk__hub" style={{ left: 303, top: 172 }}><img src={tilePhorecast} alt="" width={34.8} height={40.6} /></span>
        {light(tileSp500, 498, 199, 50, 30, 8, 12.2)}
        {light(tileTesla, 73, 226, 56, 36.4, 36.2, 10)}
        <span className="mk__tile mk__tile--solana" style={{ left: 415, top: 256 }}><img src={tileSolana} alt="" width={20.8} height={16.3} /></span>
        <img src={cursor} alt="" className="mk__cursor" style={{ left: 460, top: 291 }} width={20} height={20} />
        <span className="mk__tooltip" style={{ left: 477, top: 300 }}>Solana</span>
        <span className="mk__diamond" style={{ left: 307.4, top: 122.7 }} />
        <span className="mk__diamond" style={{ left: 149, top: 342 }} />
        {dark(tileBitcoin, 328.4, 442.3, 93.8, 43.56, 1)}
        {dark(tileDoge, 256.3, 579.7, 83.8, 43.56, 0.7)}
        {dark(tileDow, 412.2, 569.6, 83.8, 50.26, 0.6, '#2c2c2c')}
        {dark(tileCopper, 484.2, 442.3, 83.8, 43.56, 0.8)}
        {dark(tileOil, 604.8, 450.7, 67, 26.8, 0.3)}
        {dark(null, 182.6, 452.4, 83.8, 0, 0.8)}
      </div>
      <Cta href="#markets" tone="orange-light" arrow={arrowOrangeLight}>Explore Markets</Cta>
    </article>
  );
}

export function Bento() {
  return (
    <section className="bento" id="why" aria-labelledby="why-title">
      <div className="bento__glows glow-fade" aria-hidden="true"><span className="bento__glow" /></div>
      <div className="container">
        <div className="bento__card">
          <header className="bento__head">
            <h2 id="why-title" className="bento__title">Why Traders Move to Phorecast</h2>
            <p className="bento__sub">The tools incumbents can't give you, on infrastructure that never holds your funds.</p>
          </header>
          <div className="bento__grid">
            <div className="bento__col bento__col--left">
              <CardOnboard />
              <CardFunds />
            </div>
            <div className="bento__col bento__col--right">
              <CardBonus />
              <CardMarkets />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

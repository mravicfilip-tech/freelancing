import fanLower from '../../assets/fan/fan-lower.svg';
import fanUpper from '../../assets/fan/fan-upper.svg';
import iconCrypto from '../../assets/fan/icon-crypto.svg';
import iconFinance from '../../assets/fan/icon-finance.svg';
import iconGeopolitics from '../../assets/fan/icon-geopolitics.svg';
import iconTech from '../../assets/fan/icon-tech.svg';
import iconElections from '../../assets/fan/icon-elections.svg';
import iconSportA from '../../assets/fan/icon-sport-a.svg';
import iconSportB from '../../assets/fan/icon-sport-b.svg';
import iconSportC from '../../assets/fan/icon-sport-c.svg';
import tileBg from '../../assets/fan/tile-bg.jpg';
import tileLogo from '../../assets/fan/tile-logo.svg';
import './Fan.css';

/* All coordinates are screenshot space inside the 1920 x 675 frame. */
const DIAMONDS = [
  [23, 351.9, '#f55e22'], [97, 429, '#f55e22'], [440, 91, '#5b5b5a'],
  [401, 480, '#f55e22'], [183.9, 469.5, '#fffbf8'], [337.2, 280.1, '#fffbf8'],
  [1886.1, 430.5, '#f55e22'], [1812.1, 353.3, '#f55e22'], [1508.1, 86.3, '#7c7c7c'],
  [1508.1, 302.3, '#f55e22'], [1725.2, 312.8, '#fffbf8'], [1571.9, 502.3, '#fffbf8'],
] as const;

function SportIcon() {
  return (
    <span className="fan__sport">
      <img src={iconSportA} alt="" className="fan__sport-a" />
      <img src={iconSportB} alt="" className="fan__sport-b" />
      <img src={iconSportC} alt="" className="fan__sport-c" />
    </span>
  );
}

/* Figma fixes the three left pills at 120 and hugs the label on the right three. */
const PILLS = [
  { label: 'Crypto', x: 502, y: 212, w: 120, icon: <img src={iconCrypto} alt="" /> },
  { label: 'Sport', x: 201, y: 536, w: 120, icon: <SportIcon /> },
  { label: 'Finance', x: 553, y: 558, w: 120, icon: <img src={iconFinance} alt="" /> },
  { label: 'Geopolitics', x: 1581, y: 188, w: 149, icon: <img src={iconGeopolitics} alt="" /> },
  { label: 'Tech', x: 1639, y: 512, w: 90, icon: <img src={iconTech} alt="" /> },
  { label: 'Elections', x: 1372, y: 556, w: 132, icon: <img src={iconElections} alt="" /> },
];

/** Both arc groups share one 863 x 675 sub-frame; the left one is mirrored. */
function Arcs({ className }: { className: string }) {
  return (
    <div className={`fan__arcs ${className}`}>
      <img src={fanUpper} alt="" className="fan__lines fan__lines--upper" />
      <img src={fanLower} alt="" className="fan__lines fan__lines--lower" />
    </div>
  );
}

export function Fan() {
  return (
    <section className="fan" aria-labelledby="fan-title">
      <div className="fan__frame">
        <div aria-hidden="true">
          <Arcs className="fan__arcs--left" />
          <Arcs className="fan__arcs--right" />
          {DIAMONDS.map(([x, y, c], i) => (
            <span key={i} className="fan__diamond" style={{ ['--x' as string]: x, ['--y' as string]: y, background: c }} />
          ))}
          {PILLS.map((p) => (
            <span
              key={p.label}
              className="fan__pill"
              style={{ ['--x' as string]: p.x, ['--y' as string]: p.y, ['--w' as string]: p.w }}
            >
              {p.icon}{p.label}
            </span>
          ))}
        </div>

        <div className="fan__tile" aria-hidden="true">
          <img src={tileBg} alt="" className="fan__tile-bg" />
          <span className="fan__glass"><img src={tileLogo} alt="" /></span>
        </div>
        <h2 id="fan-title" className="fan__title">Your Funds Stay in Your Control</h2>
        <p className="fan__sub">
          Your assets stay under your control through non-custodial infrastructure and transparent on-chain settlement.
        </p>
      </div>
    </section>
  );
}

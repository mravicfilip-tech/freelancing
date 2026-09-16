import fanLower from '../../assets/fan/fan-lower.svg';
import fanUpper from '../../assets/fan/fan-upper.svg';
import iconCrypto from '../../assets/fan/icon-crypto.svg';
import iconFinance from '../../assets/fan/icon-finance.svg';
import iconSportA from '../../assets/fan/icon-sport-a.svg';
import iconSportB from '../../assets/fan/icon-sport-b.svg';
import iconSportC from '../../assets/fan/icon-sport-c.svg';
import './Fan.css';

/* Screenshot-space coordinates inside the 863 × 675 design frame. */
const DIAMONDS = [
  { x: 23, y: 352, c: '#f55e22' },
  { x: 97, y: 429, c: '#f55e22' },
  { x: 440, y: 91, c: '#5b5b5a' },
  { x: 401, y: 480, c: '#f55e22' },
  { x: 184, y: 469, c: '#fffbf8' },
  { x: 337, y: 280, c: '#fffbf8' },
];

export function Fan() {
  return (
    <section className="fan" aria-hidden="true">
      <span className="fan__glow" />
      <div className="fan__frame">
        <img src={fanUpper} alt="" className="fan__lines fan__lines--upper" />
        <img src={fanLower} alt="" className="fan__lines fan__lines--lower" />

        {DIAMONDS.map((d, i) => (
          <span key={i} className="fan__diamond" style={{ ['--x' as string]: d.x, ['--y' as string]: d.y, background: d.c }} />
        ))}

        <span className="fan__pill" style={{ ['--x' as string]: 502, ['--y' as string]: 212 }}>
          <img src={iconCrypto} alt="" />Crypto
        </span>
        <span className="fan__pill" style={{ ['--x' as string]: 201, ['--y' as string]: 536 }}>
          <span className="fan__sport">
            <img src={iconSportA} alt="" className="fan__sport-a" />
            <img src={iconSportB} alt="" className="fan__sport-b" />
            <img src={iconSportC} alt="" className="fan__sport-c" />
          </span>
          Sport
        </span>
        <span className="fan__pill" style={{ ['--x' as string]: 553, ['--y' as string]: 558 }}>
          <img src={iconFinance} alt="" />Finance
        </span>
      </div>
    </section>
  );
}

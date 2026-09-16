import bracket from '../../assets/hero/bracket.svg';
import dashed from '../../assets/hero/dashed-rule.svg';
import nikkei from '../../assets/icons/nikkei.svg';
import dot from '../../assets/icons/plus-tag.svg';
import './StackDiagram.css';

const bars = (mod: string) =>
  Array.from({ length: 5 }, (_, i) => <span key={i} className={`stack__bar ${mod}`} />);

/** Deposit-match illustration from hero slide 3 (784 × 571 design box). */
export function StackDiagram() {
  return (
    <div className="stack" aria-label="Deposit $200, Phorecast adds $200, trade with $400" role="img">
      <p className="stack__total">$400</p>
      <div className="stack__col stack__col--bonus">{bars('stack__bar--orange')}</div>
      <div className="stack__col stack__col--deposit">{bars('stack__bar--dark')}</div>
      <div className="stack__col stack__col--base">{bars('stack__bar--dark')}</div>
      <img src={bracket} alt="" className="stack__bracket" width={34} height={161} />
      <div className="stack__adds">
        <span>Phorecast adds</span>
        <strong>+$200</strong>
      </div>
      <p className="stack__deposit-amt">$200</p>
      <img src={dashed} alt="" className="stack__rule" width={350.9} height={1.18} />
      <p className="stack__cap stack__cap--deposit">You deposit</p>
      <p className="stack__cap stack__cap--trade">You trade with</p>
      <div className="stack__tile"><img src={nikkei} alt="Nikkei" width={46.08} height={10.24} /></div>
      <div className="stack__tag stack__tag--transfer"><img src={dot} alt="" width={16} height={16} />Transfer</div>
      <div className="stack__tag stack__tag--stock"><img src={dot} alt="" width={16} height={16} />Stock</div>
    </div>
  );
}

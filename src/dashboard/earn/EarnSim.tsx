import { useState } from 'react';
import { Button } from '../Button';
import { PayMark, RtxMark } from '../icons';
import type { TokenId } from '../data';

/**
 * The savings product before launch: choose an asset, an amount and a
 * plan, and see how it will work, in dates and mechanics. No rate and no
 * projected reward appear until the product is live; those lines say so.
 */
type Asset = 'RTX' | TokenId;
const ASSETS: { id: Asset; name: string }[] = [
  { id: 'RTX', name: 'Remittix' },
  { id: 'USDT', name: 'Tether' },
  { id: 'ETH', name: 'Ethereum' },
  { id: 'BTC', name: 'Bitcoin' },
  { id: 'SOL', name: 'Solana' },
];
const TERMS = [30, 90, 180, 365] as const;
const QUICK = [100, 500, 1000, 5000];

const Mark = ({ id, className }: { id: Asset; className?: string }) => (id === 'RTX' ? <RtxMark className={className} /> : <PayMark id={id} className={className} />);

const day = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function EarnSim({ onNotify }: { onNotify: () => void }) {
  const [asset, setAsset] = useState<Asset>('RTX');
  const [amount, setAmount] = useState('1000');
  const [plan, setPlan] = useState<'flex' | 'fixed'>('flex');
  const [term, setTerm] = useState<(typeof TERMS)[number]>(90);
  const n = Number.parseFloat(amount) || 0;
  const shown = n.toLocaleString('en-US', { maximumFractionDigits: 4 });

  return (
    <section className="card es" aria-labelledby="es-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="es-title">How Earn will work</h2>
          <p className="orders__sub">Set up a plan the way you will at launch. Rates and rewards are shown once the product is live.</p>
        </div>
        <span className="pstat pstat--sm">Preview</span>
      </header>

      <div className="es__body">
        <div className="es__form">
          <div className="es__field">
            <span className="field__label">Asset</span>
            <div className="es__chips" role="radiogroup" aria-label="Asset">
              {ASSETS.map((a) => (
                <button type="button" key={a.id} role="radio" className="chip es__chip" aria-checked={asset === a.id} aria-pressed={asset === a.id} onClick={() => setAsset(a.id)}>
                  <Mark id={a.id} className="icon-16" />{a.id}
                </button>
              ))}
            </div>
          </div>
          <div className="es__field">
            <label className="field__label" htmlFor="es-amount">Amount</label>
            <div className="field__control">
              <input id="es-amount" className="field__input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
              <span className="es__unit"><Mark id={asset} className="icon-20" />{asset}</span>
            </div>
            <div className="es__chips es__quick" aria-label="Quick amounts">
              {QUICK.map((q) => (
                <button type="button" key={q} className="chip es__chip" aria-pressed={n === q} onClick={() => setAmount(String(q))}>{q.toLocaleString('en-US')}</button>
              ))}
            </div>
          </div>
          <div className="es__field es__field--plan">
            <span className="field__label">Plan</span>
            <div className="seg" role="radiogroup" aria-label="Plan">
              <button type="button" role="radio" className="seg__opt" aria-checked={plan === 'flex'} aria-pressed={plan === 'flex'} onClick={() => setPlan('flex')}>Flexible</button>
              <button type="button" role="radio" className="seg__opt" aria-checked={plan === 'fixed'} aria-pressed={plan === 'fixed'} onClick={() => setPlan('fixed')}>Fixed term</button>
            </div>
            <div className="es__chips es__terms" role="radiogroup" aria-label="Term" hidden={plan !== 'fixed'}>
              {TERMS.map((t) => (
                <button type="button" key={t} role="radio" className="chip es__chip" aria-checked={term === t} aria-pressed={term === t} onClick={() => setTerm(t)}>{t} days</button>
              ))}
            </div>
            <span className="pnote es__plan-note">{plan === 'flex' ? 'Withdraw any day, rewards accrue daily.' : `Locked for ${term} days, rewards paid at maturity.`}</span>
          </div>
        </div>

        <div className="es__plan">
          <div className="es__plan-head">
            <p className="es__plan-title">Your {plan === 'flex' ? 'flexible' : `${term}-day`} plan</p>
            <span className="es__plan-sum num">{shown} {asset}</span>
          </div>
          <ol className="es__line" aria-label="Timeline">
            <li className="es__dot es__dot--now"><b>Today</b><span>Deposit {shown} {asset}</span></li>
            <li className={`es__dot es__dot--mid${plan === 'flex' ? ' es__dot--open' : ''}`}><b>Daily</b><span>Rewards accrue in {asset}</span></li>
            <li className="es__dot"><b>{plan === 'flex' ? 'Any day' : day(term)}</b><span>{plan === 'flex' ? 'Withdraw with rewards' : 'Matures, assets and rewards released'}</span></li>
          </ol>
          <dl className="es__tiles">
            <div><dt>Access</dt><dd>{plan === 'flex' ? 'Any time' : `From ${day(term)}`}</dd><span>{plan === 'flex' ? 'Subject to product terms' : `Locked for ${term} days`}</span></div>
            <div><dt>Rewards paid in</dt><dd className="num">{asset}</dd><span>Accrue daily, tracked here</span></div>
            <div><dt>Rate</dt><dd className="es__tbc">Set at launch</dd><span>{plan === 'flex' ? 'Variable' : `Fixed for the ${term}-day term`}</span></div>
            <div><dt>Projected reward</dt><dd className="es__tbc">Shown at launch</dd><span>Once the rate is confirmed</span></div>
          </dl>
          <div className="es__act">
            <Button onClick={onNotify}>Notify me at launch</Button>
            <span className="pnote">No deposit is taken now.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { Button } from '../Button';
import { Figure } from '../Figure';
import { TokenSelect } from '../TokenSelect';
import { TOKENS, type TokenId } from '../data';
import { ArrowUp } from '../icons';
import { RequestForm, type Copy } from '../products/RequestForm';
import { CorridorSelect } from './CorridorSelect';
import { CORRIDORS } from './corridors';

/**
 * A transfer, set up the way it will be: what you send, where it goes,
 * what arrives. Sending is the beta request: the receipt gives way to the
 * email step in place, and comes back once it is on file.
 */
export function PayFiCalc({ asking, onAsk, copy }: { asking: boolean; onAsk: (v: boolean) => void; copy: Copy }) {
  const [token, setToken] = useState<TokenId>('ETH');
  const [amount, setAmount] = useState('0.5');
  const [iso, setIso] = useState('GB');
  const c = CORRIDORS.find((x) => x.iso === iso)!;
  const usd = TOKENS.find((t) => t.id === token)!.usd;
  const n = Number.parseFloat(amount) || 0;
  const gross = n * usd;
  const net = Math.max(0, gross - c.fee);
  const gets = net * c.perUsd;
  const money = (v: number, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <section className="card pc" aria-labelledby="pc-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="pc-title">Send crypto, pay a bank account</h2>
          <p className="orders__sub">Set up a transfer the way you will in PayFi. Rates and fees are illustrative until the beta opens to you.</p>
        </div>
        <span className="pstat pstat--sm">Preview</span>
      </header>

      <div className="pc__body">
        <div className="pc__form">
          <div className="pc__field">
            <label className="field__label" htmlFor="pc-amount">You send</label>
            <div className="field__control pc__send">
              <input id="pc-amount" className="field__input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
              <span className="set-sep" aria-hidden="true" />
              <TokenSelect value={token} onChange={setToken} />
            </div>
            <span className="pnote">≈ ${money(gross)} · 1 {token} = ${money(usd)}</span>
          </div>
          <div className="pc__field">
            <label className="field__label" htmlFor="pc-to">Recipient's bank is in</label>
            <div className="field__control">
              <CorridorSelect id="pc-to" value={iso} onChange={setIso} />
            </div>
            <span className="pnote">Paid out in {c.ccy} over {c.rail}</span>
          </div>
          <dl className="pc__lines">
            <div><dt>Flat fee</dt><dd className="num">{money(c.fee)} USDT</dd></div>
            <div><dt>Rate</dt><dd className="num">1 USD = {money(c.perUsd, c.perUsd >= 10 ? 1 : 3)} {c.ccy}</dd></div>
            <div><dt>Arrives</dt><dd>{c.eta}</dd></div>
          </dl>
        </div>

        <div className="pc__out">
          {asking ? (
            <div className="pc__ask">
              <p className="pc__ask-lead"><ArrowUp className="icon-16" />Sending needs beta access.</p>
              <RequestForm storageKey="rtx-payfi-beta" copy={copy} id="payfi-email" autoFocus />
              <button type="button" className="tlink pc__back" onClick={() => onAsk(false)}>Back to the transfer</button>
            </div>
          ) : (
            <>
              <p className="field__label">Recipient gets</p>
              <Figure className="pc__fig" value={money(gets)} suffix={c.ccy} />
              <p className="pc__sub">to a {c.country} bank account, {c.eta.toLowerCase()}</p>
              <ol className="pc__path" aria-label="How it moves">
                <li><span className="pc__path-k">Leaves your wallet</span><b className="num">{n ? money(n, 4) : '0'} {token}</b><span>≈ ${money(gross)}</span></li>
                <li><span className="pc__path-k">After the flat fee</span><b className="num">${money(net)}</b><span>{money(c.fee)} USDT, nothing on FX</span></li>
                <li><span className="pc__path-k">Lands at the bank</span><b className="num">{money(gets)} {c.ccy}</b><span>{c.rail}, {c.eta.toLowerCase()}</span></li>
              </ol>
              <div className="pc__act">
                <Button onClick={() => onAsk(true)}>Send with PayFi</Button>
                <span className="pnote">Private beta · sending asks for access first</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

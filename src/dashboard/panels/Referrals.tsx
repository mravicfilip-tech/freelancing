import { REFERRALS, money } from '../data';
import { Figure } from '../Figure';
import { CheckIcon, ChevronRight, CopyIcon } from '../icons';
import { useCopy } from '../useCopy';

export function Referrals() {
  const [copied, copy] = useCopy();

  return (
    <section className="side__part referrals" aria-labelledby="referrals-title">
      <header className="card__head">
        <h2 className="card__title" id="referrals-title">
          Referrals
        </h2>
        <a className="link-quiet" href="#referrals-all">
          View all
          <ChevronRight className="icon-14" />
        </a>
      </header>

      <div className="referrals__body">
        <div className="referrals__figures">
          <p className="referrals__label">Earned so far</p>
          <Figure className="referrals__earnings" symbol="$" value={money(REFERRALS.earnings)} />
          <dl className="referrals__split">
            <div>
              <dt>From referrals</dt>
              <dd>{money(REFERRALS.earnings)} USDT</dd>
            </div>
            <div>
              <dt>Claimed</dt>
              <dd>{money(REFERRALS.claimed)} USDT</dd>
            </div>
          </dl>
        </div>

        <div className="referrals__invite">
          <p className="referrals__pitch">
            Every friend who buys $RTX pays you{' '}
            <strong>{REFERRALS.share * 100}% of their purchase</strong> in USDT.
          </p>
          <p className="referrals__label">Your link</p>
          <button type="button" className="copy copy--field" onClick={() => copy(REFERRALS.link)}>
            <span className="copy__value copy__value--link">{REFERRALS.link}</span>
            {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
            <span className="sr-only">{copied ? 'Copied' : 'Copy referral link'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

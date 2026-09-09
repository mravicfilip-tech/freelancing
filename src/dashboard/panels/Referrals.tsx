import { REFERRALS, money } from '../data';
import { CheckIcon, ChevronRight, CopyIcon } from '../icons';
import { useCopy } from '../useCopy';

export function Referrals() {
  const [copied, copy] = useCopy();

  return (
    <section className="card referrals" aria-labelledby="referrals-title">
      <header className="referrals__head">
        <h2 className="referrals__title" id="referrals-title">
          Referrals
        </h2>
        <a className="link-quiet" href="#referrals-all">
          View All
          <ChevronRight className="icon-14" />
        </a>
      </header>

      <div className="referrals__body">
        <div className="referrals__figures">
          <p className="referrals__label">Your earnings</p>
          <p className="referrals__earnings">${money(REFERRALS.earnings)}</p>
          <dl className="referrals__split">
            <div>
              <dt>Referrals</dt>
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
            Earn <strong>{REFERRALS.share * 100}%</strong> in USDT every time a friend buys $RTX
          </p>
          <p className="referrals__label">Your Referral Link</p>
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

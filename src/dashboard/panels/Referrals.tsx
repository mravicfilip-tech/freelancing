import { money, type Referral } from '../data';
import type { DashboardData } from '../useDashboardData';
import { EmptyState, InviteArt } from '../EmptyState';
import { Figure } from '../Figure';
import { CheckIcon, ChevronRight, CopyIcon } from '../icons';
import { useCopy } from '../useCopy';

const ago = (h: number) => (h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`);

export function Referrals({
  referrals: REFERRALS,
  rows: REFERRAL_ROWS,
}: {
  referrals: DashboardData['referrals'];
  rows: Referral[];
}) {
  const [copied, copy] = useCopy();

  return (
    <section className="side__part referrals" id="referrals" aria-labelledby="referrals-title">
      <header className="card__head">
        <h2 className="card__title" id="referrals-title">
          Referrals
        </h2>
        <a className="link-quiet" href="#referrals-all">
          View all
          <ChevronRight className="icon-14" />
        </a>
      </header>

      {REFERRAL_ROWS.length === 0 ? (
        <EmptyState
          art={InviteArt}
          title="No referrals yet"
          body={`Send your link to anyone buying into the presale. Every friend who buys pays you ${REFERRALS.share * 100}% of what they spend, in USDT, the moment their order clears.`}
          tight
        />
      ) : (
        <>
      <div className="referrals__figures">
        <div>
          <p className="referrals__label">Earned so far</p>
          <Figure className="referrals__earnings" value={money(REFERRALS.earnings)} suffix="USDT" />
        </div>
        <dl className="referrals__split">
          <div>
            <dt>Claimed</dt>
            <dd className="num">{money(REFERRALS.claimed)} USDT</dd>
          </div>
          <div>
            <dt>Ready to claim</dt>
            <dd className="num">{money(REFERRALS.earnings - REFERRALS.claimed)} USDT</dd>
          </div>
        </dl>
      </div>

      <table className="referrals__table">
        <caption className="sr-only">Recent referrals</caption>
        <thead>
          <tr>
            <th scope="col">Friend</th>
            <th scope="col">They spent</th>
            <th scope="col">Your {REFERRALS.share * 100}%</th>
            <th scope="col" className="is-right">
              When
            </th>
          </tr>
        </thead>
        <tbody>
          {REFERRAL_ROWS.map((r) => (
            <tr key={r.wallet}>
              <td className="referrals__wallet">{r.wallet}</td>
              <td className="num referrals__spent">${money(r.usd, 0)}</td>
              <td className="num referrals__cut">+{money(r.cut)} USDT</td>
              <td className="num is-right referrals__when">{ago(r.hoursAgo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
        </>
      )}

      <div className="referrals__invite">
        <p className="referrals__label">
          Your link — every friend who buys pays you {REFERRALS.share * 100}% in USDT
        </p>
        <div className="referrals__link">
          <span className="referrals__url">{REFERRALS.link}</span>
          <button type="button" className="copy" onClick={() => copy(REFERRALS.link)}>
            {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
            {copied ? 'Copied' : 'Copy'}
            <span className="sr-only"> referral link</span>
          </button>
        </div>
      </div>
    </section>
  );
}

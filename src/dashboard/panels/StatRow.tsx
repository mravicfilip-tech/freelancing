import { HOLDINGS, PRESALE, REFERRALS, money } from '../data';
import { Figure } from '../Figure';
import { ArrowOut, PayMark, RtxMark } from '../icons';

type StatProps = {
  label: string;
  symbol?: string;
  value: string;
  suffix?: string;
  note: string;
  href: string;
  mark?: 'coin' | 'usdt';
};

function Stat({ label, symbol, value, suffix, note, href, mark }: StatProps) {
  return (
    <article className="stat">
      <div>
        <h3 className="stat__label">{label}</h3>
        <Figure symbol={symbol} value={value} suffix={suffix} />
        <p className="stat__note">{note}</p>
      </div>
      <div className="stat__aside">
        <a className="chip-btn" href={href} aria-label={`Open ${label.toLowerCase()}`}>
          <ArrowOut className="icon-16" />
        </a>
        {mark === 'coin' && <RtxMark className="stat__mark" />}
        {mark === 'usdt' && <PayMark id="USDT" className="stat__mark" />}
      </div>
    </article>
  );
}

export function StatRow() {
  return (
    <section className="stat-row" aria-label="Your position">
      <Stat
        label="Your balance"
        value={money(HOLDINGS.balance)}
        suffix="$RTX"
        note={`Across ${HOLDINGS.purchases} purchases`}
        href="#holdings"
        mark="coin"
      />
      <Stat
        label="Worth at launch"
        value={money(HOLDINGS.worthAtTge)}
        suffix="USDT"
        note={`At the $${PRESALE.listPrice.toFixed(2)} listing price`}
        href="#tge"
        mark="usdt"
      />
      <Stat
        label="Referral earnings"
        value={money(REFERRALS.earnings)}
        suffix="USDT"
        note={`${REFERRALS.share * 100}% of what ${REFERRALS.invited} friends have bought`}
        href="#referrals"
      />
    </section>
  );
}

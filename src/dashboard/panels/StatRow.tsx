import { HOLDINGS, money } from '../data';
import { Figure } from '../Figure';
import { ArrowOut } from '../icons';

/** The gold presale chip that sits in the balance card. */
function ChipMark() {
  return (
    <svg viewBox="0 0 48 48" className="stat__chip" aria-hidden="true">
      <defs>
        <linearGradient id="chip" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#F6D97B" />
          <stop offset="50%" stopColor="#D8A93A" />
          <stop offset="100%" stopColor="#8C6516" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#chip)" />
      <circle cx="24" cy="24" r="17" fill="none" stroke="rgba(0,0,0,.32)" strokeWidth="3" strokeDasharray="5 4.4" />
      <circle cx="24" cy="24" r="13" fill="#1A1408" />
      <text x="24" y="29.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="url(#chip)" fontFamily="inherit">
        R
      </text>
    </svg>
  );
}

type StatProps = {
  label: string;
  symbol?: string;
  value: string;
  suffix?: string;
  note: string;
  href: string;
  tone?: 'default' | 'indigo';
  chip?: boolean;
};

function Stat({ label, symbol, value, suffix, note, href, tone = 'default', chip }: StatProps) {
  return (
    <article className="stat" data-tone={tone}>
      <div>
        <h3 className="stat__label">{label}</h3>
        <Figure symbol={symbol} value={value} suffix={suffix} />
        <p className="stat__note">{note}</p>
      </div>
      <div className="stat__aside">
        <a className="chip-btn chip-btn--sm" href={href} aria-label={`Open ${label.toLowerCase()}`}>
          <ArrowOut className="icon-14" />
        </a>
        {chip && <ChipMark />}
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
        note="Across all purchases"
        href="#holdings"
        chip
      />
      <Stat
        label="Worth at launch"
        value={money(HOLDINGS.worthAtTge)}
        suffix="USDT"
        note="Priced at the listing rate"
        href="#tge"
        tone="indigo"
      />
      <Stat
        label="Referral earnings"
        value={money(HOLDINGS.referralEarnings)}
        suffix="$RTX"
        note={`You keep ${HOLDINGS.commission * 100}% of what friends buy`}
        href="#referrals"
      />
    </section>
  );
}

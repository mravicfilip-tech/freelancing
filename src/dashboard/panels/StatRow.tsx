import { HOLDINGS, money } from '../data';

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
      <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
      <circle
        cx="24"
        cy="24"
        r="17"
        fill="none"
        stroke="rgba(0,0,0,.35)"
        strokeWidth="3"
        strokeDasharray="5 4.4"
      />
      <circle cx="24" cy="24" r="13" fill="#1A1408" />
      <text
        x="24"
        y="29.5"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="url(#chip)"
        fontFamily="inherit"
      >
        R
      </text>
    </svg>
  );
}

type StatProps = {
  label: string;
  value: string;
  note: string;
  tone?: 'default' | 'indigo' | 'accent';
  chip?: boolean;
};

function Stat({ label, value, note, tone = 'default', chip }: StatProps) {
  return (
    <article className="stat" data-tone={tone}>
      <div className="stat__text">
        <h3 className="stat__label">{label}</h3>
        <p className="stat__value">{value}</p>
        <p className="stat__note">{note}</p>
      </div>
      {chip && <ChipMark />}
    </article>
  );
}

export function StatRow() {
  return (
    <section className="stat-row" aria-label="Your position">
      <Stat
        label="Your $RTX balance"
        value={`${money(HOLDINGS.balance)} $RTX`}
        note="Across all purchases"
        tone="accent"
        chip
      />
      <Stat
        label="Worth at TGE"
        value={`${money(HOLDINGS.worthAtTge)} USDT`}
        note="At launch price"
        tone="indigo"
      />
      <Stat
        label="Referral earnings"
        value={`${money(HOLDINGS.referralEarnings)} $RTX`}
        note={`${HOLDINGS.commission * 100}% commission`}
        tone="accent"
      />
    </section>
  );
}

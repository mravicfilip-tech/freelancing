import { money } from '../data';
import type { DashboardData } from '../useDashboardData';
import { Figure } from '../Figure';
import { Button } from '../Button';
import { EmptyState, WalletArt } from '../EmptyState';
import { PayMark, RtxMark } from '../icons';

type StatProps = {
  label: string;
  symbol?: string;
  value: string;
  suffix?: string;
  note: string;
  mark?: 'coin' | 'usdt';
};

/* The corner link is gone. Each card stated a figure and then offered a way out
   of it, three times over, for destinations the dashboard reaches from the rail
   anyway — so the arrows were three controls competing with the numbers they
   sat beside. The token mark keeps the card's right edge. */
function Stat({ label, symbol, value, suffix, note, mark }: StatProps) {
  return (
    <article className="stat">
      <div>
        <h3 className="stat__label">{label}</h3>
        <Figure symbol={symbol} value={value} suffix={suffix} />
        <p className="stat__note">{note}</p>
      </div>
      <div className="stat__aside">
        {mark === 'coin' && <RtxMark className="stat__mark" />}
        {mark === 'usdt' && <PayMark id="USDT" className="stat__mark" />}
      </div>
    </article>
  );
}

/** Jumps to the buy form, the same move the mobile bar's Buy slot makes. */
const toBuy = () => {
  const form = document.getElementById('buy');
  form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  form?.querySelector<HTMLInputElement>('.field__input')?.focus({ preventScroll: true });
};

export function StatRow({
  holdings,
  referrals,
  presale,
}: Pick<DashboardData, 'holdings' | 'referrals' | 'presale'>) {
  /* Three cards reading 0.00 is three times the space for one fact. Until the
     wallet has bought something, the row is a single card that says so and
     offers the move that fills it. */
  if (holdings.balance === 0) {
    return (
      <section className="card stat-empty" aria-label="Your position">
        <EmptyState
          art={WalletArt}
          title="No $RTX yet"
          body="Your balance, what it is worth at listing, and anything your referrals earn all appear here once your first purchase clears."
        >
          <Button onClick={toBuy}>Buy your first $RTX</Button>
        </EmptyState>
      </section>
    );
  }

  return (
    <section className="stat-row" aria-label="Your position">
      <Stat
        label="Your balance"
        value={money(holdings.balance)}
        suffix="$RTX"
        note={`Across ${holdings.purchases} purchases`}
        mark="coin"
      />
      <Stat
        label="Worth at launch"
        value={money(holdings.worthAtTge)}
        suffix="USDT"
        note={`At the $${presale.listPrice.toFixed(2)} listing price`}
        mark="usdt"
      />
      <Stat
        label="Referral earnings"
        value={money(referrals.earnings)}
        suffix="USDT"
        note={
          referrals.invited > 0
            ? `${referrals.share * 100}% of what ${referrals.invited} friends have bought`
            : `${referrals.share * 100}% of whatever your friends buy`
        }
      />
    </section>
  );
}

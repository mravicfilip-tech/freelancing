import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { theme } from '../theme';
import { money } from '../data';
import { Stat } from '../panels/StatRow';
import { EmptyState, InviteArt } from '../EmptyState';
import { CheckIcon, CopyIcon } from '../icons';
import { useCopy } from '../useCopy';
import { TextField } from '../settings/fields';
import { Saved, useSaved } from '../settings/saved';
import { NetworkSelect } from './NetworkSelect';
import { ACTIVITY, TOTALS, fmtDate, type Activity } from './data';
import { NETWORKS, check, loadWallet, saveWallet, type NetworkId, type PayoutWallet, type Problem } from './wallet';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../settings/settings.css';
import '../products/products.css';

const params = new URLSearchParams(window.location.search);
/** `?empty=1` renders the page a wallet sees before anyone has joined. */
const EMPTY = params.get('empty') === '1';
const PCT = `${TOTALS.share * 100}%`;

const PROBLEM: Record<Problem | 'save', string> = {
  address: 'Enter a wallet address.',
  network: 'Select the network for this wallet.',
  invalid: 'Enter a valid wallet address for the selected network.',
  save: "We couldn't save your payout wallet. Please try again.",
};

/* ---------- The offer and the link ---------- */
function Offer() {
  const [copied, copy] = useCopy();
  return (
    <section className="card ref-offer" aria-labelledby="ref-offer-title">
      <p className="pstat">{PCT} paid in USDT</p>
      <h2 className="phero__title" id="ref-offer-title">Invite friends. Earn {PCT}.</h2>
      <p className="phero__body">Share your personal referral link and earn {PCT} of each completed purchase made by the people you refer. Commission is paid in USDT to your saved payout wallet.</p>
      <div className="ref-link">
        <span className="field__label">Your referral link</span>
        <div className="ref-link__row">
          <span className="ref-link__url num">{TOTALS.link}</span>
          <Button onClick={() => copy(TOTALS.link)}>
            {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
            Copy link
          </Button>
        </div>
        <span className="ref-link__done"><Saved on={copied}>Referral link copied.</Saved></span>
      </div>
    </section>
  );
}

/* ---------- The payout wallet ---------- */
function Wallet({ saved, onSaved }: { saved: PayoutWallet | null; onSaved: (w: PayoutWallet) => void }) {
  const [address, setAddress] = useState(saved?.address ?? '');
  const [network, setNetwork] = useState<NetworkId | null>(saved?.network ?? null);
  const [problem, setProblem] = useState<Problem | 'save' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, flash] = useSaved();

  const clear = () => { setProblem(null); setConfirming(false); };
  const commit = () => {
    const w: PayoutWallet = { address: address.trim(), network: network! };
    if (!saveWallet(w)) { setProblem('save'); return; }
    setConfirming(false);
    onSaved(w);
    flash();
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = check(address, network);
    if (p) { setProblem(p); return; }
    setProblem(null);
    // A saved wallet is only replaced on purpose: the change is confirmed in place.
    const changed = saved && (saved.address !== address.trim() || saved.network !== network);
    if (changed) { setConfirming(true); return; }
    commit();
  };
  const net = NETWORKS.find((n) => n.id === saved?.network);

  return (
    <section className="card ref-wallet" aria-labelledby="ref-wallet-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="ref-wallet-title">Referral payout wallet</h2>
          <p className="orders__sub">Choose where you want to receive your USDT commission.</p>
        </div>
      </header>
      <form className="set-grid" onSubmit={submit} noValidate>
        <TextField id="ref-address" label="Wallet address" value={address} onChange={(v) => { setAddress(v); clear(); }} placeholder="Enter USDT wallet address" autoComplete="off" />
        <div className="set-field">
          <label className="field__label" htmlFor="ref-network">Network</label>
          <div className="field__control">
            <NetworkSelect id="ref-network" value={network} onChange={(n) => { setNetwork(n); clear(); }} />
          </div>
        </div>
        {confirming ? (
          <div className="ref-confirm" role="alertdialog" aria-label="Replace the saved payout wallet">
            <p>Replace the wallet on {net?.name}? Commission from the next payout goes to the new address.</p>
            <Button onClick={commit}>Replace wallet</Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>Keep current</Button>
          </div>
        ) : (
          <div className="set-actions">
            <Button type="submit">Save payout wallet</Button>
            {problem ? <span className="field__error set-error" role="alert">{PROBLEM[problem]}</span> : <Saved on={done}>Your referral payout wallet has been saved.</Saved>}
          </div>
        )}
        <p className="ref-warn">The wallet address must support USDT on the selected network. <b>Incorrect details may result in permanent loss.</b></p>
      </form>
    </section>
  );
}

/* ---------- Activity ---------- */
function ActivityTable({ rows }: { rows: Activity[] }) {
  return (
    <section className="card orders ref-table" aria-labelledby="ref-activity-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="ref-activity-title">Referral activity</h2>
          <p className="orders__sub">Completed purchases and the commission earned.</p>
        </div>
      </header>
      {rows.length === 0 ? (
        <EmptyState
          art={InviteArt}
          title="No referrals yet"
          body={`Share your link with anyone buying into the presale. Each completed purchase they make earns you ${PCT}, paid in USDT.`}
        />
      ) : (
        <div className="orders__scroll">
          <table className="orders__table">
            <thead>
              <tr>
                <th scope="col">Referred user</th>
                <th scope="col">Purchase</th>
                <th scope="col">Your {PCT}</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-right ref-date">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="num ref-user">{r.user}</td>
                  <td className="num ref-usd">${money(r.usd)}</td>
                  <td className="num referrals__cut ref-cut">+{money(r.cut)} USDT</td>
                  <td className="ref-state"><span className={`ref-status${r.status === 'Paid' ? ' ref-status--paid' : ''}`}>{r.status}</span></td>
                  <td className="num is-right ref-date">{fmtDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Referrals: what the {PCT} has earned, paid and still owed, the link that
 * earns it, the wallet it is paid to, and every purchase behind the figures.
 * USDT goes out only once a wallet and its network are saved.
 */
export function ReferralsPage() {
  const mode = theme.use();
  const [wallet, setWallet] = useState<PayoutWallet | null>(() => loadWallet());
  const rows = EMPTY ? [] : ACTIVITY;
  const earned = rows.reduce((s, r) => s + r.cut, 0);
  const paid = rows.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.cut, 0);
  const pending = earned - paid;

  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash pd pd-referrals" data-theme={mode}>
      <Sidebar active="referrals" />
      <main className="dash__main">
        <Topbar title="Referrals" />
        <section className="stat-row" aria-label="Your commission">
          <Stat label="Total earned" value={money(earned)} suffix="USDT" note={rows.length ? `${PCT} of ${rows.length} completed purchases` : 'Nothing earned yet'} mark="usdt" />
          <Stat label="Paid" value={money(paid)} suffix="USDT" note="Completed payouts" />
          <Stat label="Pending" value={money(pending)} suffix="USDT" note={wallet ? 'Awaiting payout' : 'Save a payout wallet to receive this'} />
        </section>
        <div className="ref-split">
          <Offer />
          <Wallet saved={wallet} onSaved={setWallet} />
        </div>
        <ActivityTable rows={rows} />
      </main>
      <MobileNav active="referrals" />
    </div>
  );
}

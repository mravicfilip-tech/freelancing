import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, At, CheckCircle, CircleNotch, Clock, LockKey, UsersThree, WarningCircle, XCircle } from '@phosphor-icons/react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { Field } from '../../components/ui/Field';
import { Message } from '../../components/ui/Message';
import { RadioCard, RadioCards } from '../../components/ui/RadioCards';
import { Skeleton } from '../../components/ui/Skeleton';
import { Stepper } from '../../components/ui/Stepper';
import { COINS, coinById, type CoinId } from '../../data/wallet';
import { formatAmount, formatToken } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useWallet } from '../wallet/store';
import { RECENT_RECIPIENTS, TIP, findPlayer, largeRecipients } from './tipData';
import { Panel, StepHeading, SummaryCard, SummaryRow, initialsOf, moveBalance, readQuery, useViewSwitch, wait } from './shared';

// Tip, Figma 370:24. Tip another player by username, coin and amount. The wallet's Tip tab mounts
// this. The tip comes out of the balance in USDT, and the player gets it in the coin picked.
//
// URL switches for screenshots.
//   ?to=Peki972&amount=25&coin=btc&note=Thanks&step=details|review|status   ?step=status sends on load
//   ?outcome=failed   the tip cannot be sent, and nothing leaves the balance
//   ?state=loading|error|empty|large   the form, and the recent recipients
//   ?access=locked   tips are locked until identity is verified (shared with the wallet)

type Step = 'details' | 'review' | 'status';
type Outcome = 'processing' | 'completed' | 'failed';

const STEPS: Step[] = ['details', 'review', 'status'];
const STEP_LABEL: Record<Step, string> = { details: 'Details', review: 'Review', status: 'Status' };

type Form = {
  step: Step;
  coinId: CoinId;
  username: string;
  amount: string;
  note: string;
  touched: boolean;
  txId?: string;
  outcome?: Outcome;
  autoSubmit?: boolean;
};

function initialForm(): Form {
  const q = readQuery();
  const coinId = COINS.find((c) => c.id === q.get('coin'))?.id ?? 'usdt';
  const want = q.get('step') as Step | null;
  const ready = !!q.get('to') && !!q.get('amount');
  return {
    step: ready && want && STEPS.includes(want) ? want : 'details',
    coinId,
    username: q.get('to') ?? '',
    amount: q.get('amount') ?? '',
    note: q.get('note') ?? '',
    touched: false,
    autoSubmit: ready && want === 'status' ? true : undefined,
  };
}

type Errors = Partial<Record<'username' | 'amount', string>>;

function validate(f: Form, balance: number): Errors {
  const e: Errors = {};
  const u = f.username.trim().replace(/^@/, '');
  if (!u) e.username = 'Enter the username of the player you want to tip.';
  else if (!/^[A-Za-z0-9_]{3,16}$/.test(u)) e.username = 'A username is 3 to 16 letters, numbers or underscores. Check it, then enter it again.';
  else if (u.toLowerCase() === TIP.me.toLowerCase()) e.username = 'That is your own username. Enter another player.';
  else if (!findPlayer(u)) e.username = `We could not find a player called ${u}. Check the spelling, usernames are not case sensitive.`;

  const raw = f.amount.trim().replace(',', '.');
  const n = Number(raw);
  const left = TIP.dailyLimit - TIP.usedToday;
  if (!raw) e.amount = 'Enter how much to tip.';
  else if (!Number.isFinite(n) || n <= 0) e.amount = 'Enter the amount as a number, such as 10.';
  else if (n < TIP.min) e.amount = `The smallest tip is ${TIP.min} USDT. Enter at least that.`;
  else if (n > balance) e.amount = `Your balance is ${formatAmount(balance)} USDT. Enter that or less.`;
  else if (n > left) e.amount = `You can tip ${formatAmount(left)} USDT more today. Enter that or less, or tip again tomorrow.`;
  return e;
}

const amountOf = (f: Form) => Math.round(Number(f.amount.trim().replace(',', '.')) * 100) / 100;
const nameOf = (f: Form) => findPlayer(f.username.trim().replace(/^@/, '')) ?? f.username.trim();

function receives(f: Form) {
  const coin = coinById(f.coinId);
  const value = amountOf(f);
  return Number.isFinite(value) ? Number((value / coin.rate).toFixed(coin.decimals)) : 0;
}

let tipSeq = 48214120;

type View = 'ready' | 'loading' | 'error';

function DetailsStep({ f, set, errors, balance, recent, view, retry }: { f: Form; set: (p: Partial<Form>) => void; errors: Errors; balance: number; recent: string[]; view: View; retry: () => void }) {
  const err = f.touched ? errors : {};
  const left = TIP.dailyLimit - TIP.usedToday;

  if (view === 'loading') {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading tip details">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[var(--bl-sp-96)] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
    );
  }
  if (view === 'error') {
    return (
      <Message
        className="items-start px-0 py-6 text-left"
        icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
        title="We could not load your tip limits"
        body="Your balance has not changed. Check your connection, then try again."
        action={
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="Who do you want to tip?" lead={`The tip comes out of your balance and reaches the player ${TIP.arrives}.`} />
      <div className="flex flex-col gap-3">
        <span id="tip-coin-label" className="text-14 font-medium text-ink2">
          Send it as
        </span>
        <RadioCards value={f.coinId} onValueChange={(v) => set({ coinId: v as CoinId })} aria-labelledby="tip-coin-label" className="grid grid-cols-4 gap-3">
          {COINS.map((c) => (
            <RadioCard key={c.id} value={c.id} className="flex-col items-start gap-2 p-4">
              <img src={c.icon} alt="" width={32} height={32} className="rounded-full ring-1 ring-ink/20" />
              <span className="flex min-w-0 flex-col">
                <span className="text-16 font-semibold text-ink">{c.symbol}</span>
                <span className="text-14 text-ink2">{c.name}</span>
              </span>
            </RadioCard>
          ))}
        </RadioCards>
      </div>
      <div className="flex flex-col gap-3">
        <Field
          label="Player username"
          autoComplete="off"
          spellCheck={false}
          placeholder="For example Peki972"
          value={f.username}
          onChange={(e) => set({ username: e.target.value })}
          prefix={<At className="h-5 w-5" aria-hidden />}
          hint="Usernames are not case sensitive."
          error={err.username}
        />
        <div className="flex flex-col gap-2">
          <span id="recent-label" className="text-14 font-medium text-ink2">
            Recent
          </span>
          {recent.length === 0 ? (
            <p className="flex items-center gap-2 text-14 text-ink3">
              <UsersThree className="h-5 w-5 shrink-0" aria-hidden />
              Players you tip show here, so the next tip is one click.
            </p>
          ) : (
            <ul aria-labelledby="recent-label" className={cn('flex flex-wrap gap-2', recent.length > 12 && 'max-h-[var(--bl-sidebar-open)] overflow-y-auto p-1')}>
              {recent.map((r) => (
                <li key={r}>
                  <Button variant="secondary" size="sm" onClick={() => set({ username: r })} aria-pressed={f.username.trim().toLowerCase() === r.toLowerCase()}>
                    {r}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Field
        label="Amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={f.amount}
        onChange={(e) => set({ amount: e.target.value })}
        suffix={
          <span className="flex items-center gap-2">
            <span className="text-16 text-ink3">USDT</span>
            <Button variant="tertiary" size="sm" onClick={() => set({ amount: String(Math.min(balance, left)) })}>
              Max
            </Button>
          </span>
        }
        hint={`Available ${formatAmount(balance)} USDT. You can tip ${formatAmount(left)} USDT more today.`}
        error={err.amount}
      />
      <Field
        label="Note, optional"
        autoComplete="off"
        maxLength={TIP.noteMax}
        placeholder="Add a short message"
        value={f.note}
        onChange={(e) => set({ note: e.target.value })}
        hint={`${f.note.length} of ${TIP.noteMax} characters.`}
      />
    </div>
  );
}

function ReviewStep({ f }: { f: Form }) {
  const coin = coinById(f.coinId);
  const name = nameOf(f);
  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="Check and send" lead="A tip is final. Check the username, the amount and the coin." />
      <div className="flex items-center gap-4 rounded-xl border border-line bg-sunken p-4">
        <Avatar initials={initialsOf(name)} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-16 font-semibold text-ink">{name}</span>
          <span className="break-words text-14 text-ink2">
            Gets {formatToken(receives(f), coin.symbol, coin.decimals)} {TIP.arrives}
          </span>
          {f.note.trim() && <span className="mt-1 break-words text-14 text-ink3">Note, {f.note.trim()}</span>}
        </div>
      </div>
      <Callout tone="warning">
        <p className="font-semibold">A tip cannot be taken back.</p>
        <p className="text-ink2">If the username is wrong, the tip goes to a different player. Check the name above before you send.</p>
      </Callout>
    </div>
  );
}

function StatusStep({ f, onRetry, onEdit, onReset }: { f: Form; onRetry: () => void; onEdit: () => void; onReset: () => void }) {
  const outcome = f.outcome ?? 'processing';
  const name = nameOf(f);
  const amount = formatAmount(amountOf(f));
  const view = {
    processing: { Icon: CircleNotch, tone: 'text-accent', title: 'Sending your tip', spin: true },
    completed: { Icon: CheckCircle, tone: 'text-success', title: 'Tip sent', spin: false },
    failed: { Icon: XCircle, tone: 'text-danger', title: 'We could not send this tip', spin: false },
  }[outcome];
  const lead =
    outcome === 'completed'
      ? `${amount} USDT is on its way to ${name}. They get it ${TIP.arrives}.`
      : outcome === 'failed'
        ? 'Nothing left your balance. Try again, and if it fails twice, contact support.'
        : undefined;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <view.Icon weight={view.spin ? 'bold' : 'fill'} className={cn('h-10 w-10', view.tone, view.spin && 'animate-spin')} aria-hidden />
        <StepHeading title={view.title} lead={lead} />
      </div>
      <div className="flex gap-3">
        {outcome === 'failed' ? (
          <>
            <Button size="lg" onClick={onRetry}>
              Try again
            </Button>
            <Button size="lg" variant="secondary" onClick={onEdit}>
              Edit the tip
            </Button>
          </>
        ) : outcome === 'completed' ? (
          <>
            <Button size="lg" onClick={onReset}>
              Send another tip
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/lobby">Go to the lobby</Link>
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Summary({ f, balance }: { f: Form; balance: number }) {
  const coin = coinById(f.coinId);
  const errors = validate(f, balance);
  const amountOk = !errors.amount && f.amount.trim() !== '';
  const userOk = !errors.username && f.username.trim() !== '';
  const receipt = f.step === 'status' && f.txId && f.outcome === 'completed';
  const UNSET = <span className="text-16 text-ink3">Not set</span>;
  return (
    <SummaryCard id="tip-summary-title" title={receipt ? 'Receipt' : 'Summary'}>
      <div className="flex items-center gap-3">
        <img src={coin.icon} alt="" width={32} height={32} className="shrink-0 rounded-full ring-1 ring-ink/20" />
        <div className="flex flex-col">
          <span className="text-16 font-semibold text-ink">{coin.name}</span>
          <span className="text-14 text-ink2">Tip</span>
        </div>
      </div>
      <dl className="flex flex-col gap-3">
        <SummaryRow label="To">{userOk ? nameOf(f) : UNSET}</SummaryRow>
        <SummaryRow label="Amount">{amountOk ? `${formatAmount(amountOf(f))} USDT` : UNSET}</SummaryRow>
        {coin.symbol !== 'USDT' && <SummaryRow label="Rate">1 {coin.symbol} = {formatAmount(coin.rate)} USDT</SummaryRow>}
        <SummaryRow label="Fee">0.00 USDT</SummaryRow>
        <SummaryRow label="They receive" strong>
          {amountOk ? formatToken(receives(f), coin.symbol, coin.decimals) : UNSET}
        </SummaryRow>
      </dl>
      <p className="flex items-center gap-2 text-14 text-ink2">
        <Clock className="h-5 w-5 shrink-0 text-ink3" aria-hidden />
        Arrives {TIP.arrives}
      </p>
      {receipt && (
        <dl className="flex flex-col gap-3 border-t border-line pt-4">
          <SummaryRow label="Reference">{f.txId}</SummaryRow>
          <SummaryRow label="Balance now">{formatAmount(balance)} USDT</SummaryRow>
        </dl>
      )}
    </SummaryCard>
  );
}

export function TipPanel() {
  const wallet = useWallet();
  const switchState = useViewSwitch();
  const [f, setF] = useState<Form>(initialForm);
  const set = (p: Partial<Form>) => setF((cur) => ({ ...cur, ...p }));
  const [view, setView] = useState<View>(switchState === 'loading' ? 'loading' : switchState === 'error' ? 'error' : 'ready');
  const recent = useMemo(() => (switchState === 'empty' ? [] : switchState === 'large' ? largeRecipients() : RECENT_RECIPIENTS), [switchState]);
  const fast = useMemo(() => !!f.autoSubmit, []); // eslint-disable-line react-hooks/exhaustive-deps
  const failOutcome = useMemo(() => readQuery().get('outcome') === 'failed', []);
  const locked = wallet.withdrawLocked;
  const errors = validate(f, wallet.balance);
  const index = STEPS.indexOf(f.step);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const shown = useRef(f.step);
  useEffect(() => {
    if (shown.current === f.step) return;
    shown.current = f.step;
    document.getElementById('step-title')?.focus();
  }, [f.step]);

  const retryView = async () => {
    setView('loading');
    await wait(900);
    if (alive.current) setView('ready');
  };

  const next = () => {
    if (Object.keys(errors).length) {
      set({ touched: true });
      return;
    }
    set({ step: 'review', touched: false });
  };

  async function submit() {
    if (Object.keys(errors).length) {
      set({ step: 'details', touched: true });
      return;
    }
    const amount = amountOf(f);
    const id = `TP-${tipSeq++}`;
    set({ step: 'status', txId: id, outcome: 'processing' });
    await (fast ? Promise.resolve() : wait(1200));
    if (!alive.current) return;
    if (failOutcome) {
      set({ outcome: 'failed' });
      return;
    }
    moveBalance(wallet, -amount);
    set({ outcome: 'completed' });
  }

  const autoRan = useRef(false);
  useEffect(() => {
    if (!f.autoSubmit || autoRan.current) return;
    autoRan.current = true;
    void submit();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const body = locked ? (
    <div className="flex flex-col items-start gap-4">
      <LockKey weight="fill" className="h-6 w-6 text-pending" aria-hidden />
      <StepHeading title="Verify your identity to send tips" lead="It takes about 2 minutes with a photo ID. Deposits and play are open while you wait." />
      <Button asChild size="lg">
        <Link to="/account">Verify identity</Link>
      </Button>
    </div>
  ) : f.step === 'details' ? (
    <DetailsStep f={f} set={set} errors={errors} balance={wallet.balance} recent={recent} view={view} retry={retryView} />
  ) : f.step === 'review' ? (
    <ReviewStep f={f} />
  ) : (
    <StatusStep f={f} onRetry={() => set({ step: 'review', outcome: undefined })} onEdit={() => set({ step: 'details', outcome: undefined })} onReset={() => setF({ step: 'details', coinId: f.coinId, username: '', amount: '', note: '', touched: false })} />
  );

  const hideFooter = locked || f.step === 'status' || view !== 'ready';
  return (
    <div className="grid grid-cols-12 items-start gap-6">
      <Panel label="Tip" className="col-span-7">
        {!locked && <Stepper steps={STEPS.map((s) => STEP_LABEL[s])} current={index} />}
        {body}
        {!hideFooter && (
          <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
            {index > 0 ? (
              <Button variant="quiet" size="lg" onClick={() => set({ step: 'details' })}>
                <ArrowLeft className="h-5 w-5" aria-hidden />
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button size="lg" onClick={f.step === 'review' ? submit : next}>
              {f.step === 'review' ? 'Send tip' : 'Continue'}
            </Button>
          </div>
        )}
      </Panel>
      <div className="col-span-5">
        <Summary f={f} balance={wallet.balance} />
      </div>
    </div>
  );
}

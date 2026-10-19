import type { Dispatch } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, CircleNotch, Clock, LockKey, XCircle } from '@phosphor-icons/react';
import { RadioCard, RadioCards } from '../../components/ui/RadioCards';
import { Field } from '../../components/ui/Field';
import { CopyField } from '../../components/ui/CopyField';
import { Callout } from '../../components/ui/Callout';
import { Button } from '../../components/ui/Button';
import { MethodLogo } from '../../components/ui/MethodLogo';
import {
  ACCOUNT,
  CASH_METHODS,
  COINS,
  WIRE_DETAILS,
  cashById,
  coinById,
  type Selection,
} from '../../data/wallet';
import { formatAmount, formatToken } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { Action, Errors, FlowState } from './flow';

export type StepProps = { s: FlowState; dispatch: Dispatch<Action>; errors: Errors; balance: number };

const key = (sel?: Selection) => (sel ? (sel.kind === 'coin' ? `coin:${sel.coinId}` : `cash:${sel.methodId}`) : '');
const parse = (v: string): Selection => {
  const [kind, id] = v.split(':');
  return kind === 'coin' ? { kind: 'coin', coinId: id as never } : { kind: 'cash', methodId: id as never };
};

export function StepHeading({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={id} tabIndex={-1} className="font-display text-24 font-semibold text-ink outline-none">
        {title}
      </h2>
      {lead && <p className="text-16 text-ink2">{lead}</p>}
    </div>
  );
}

function GroupLabel({ children }: { children: string }) {
  return <h3 className="text-14 font-semibold uppercase tracking-[var(--bl-ls-label)] text-ink3">{children}</h3>;
}

// Method. Coins and cash methods in one radio group, so one pick moves the flow on.
export function MethodStep({ s, dispatch, errors, balance }: StepProps) {
  const deposit = s.direction === 'deposit';
  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        id="step-title"
        title={deposit ? 'How do you want to deposit?' : 'Where should the money go?'}
        lead={deposit ? 'Crypto lands in minutes. Cards and PayPal land at once.' : `You can withdraw up to ${formatAmount(balance)} USDT.`}
      />
      <RadioCards
        value={key(s.selection)}
        onValueChange={(v) => dispatch({ type: 'select', selection: parse(v) })}
        aria-labelledby="step-title"
        aria-describedby={s.touched && errors.selection ? 'method-error' : undefined}
        className="flex flex-col gap-6"
      >
        <section className="flex flex-col gap-3">
          <GroupLabel>Crypto</GroupLabel>
          <div className="grid grid-cols-4 gap-3">
            {COINS.map((c) => (
              <RadioCard key={c.id} value={`coin:${c.id}`} className="flex-col items-start gap-2 p-4">
                <img src={c.icon} alt="" width={32} height={32} className="rounded-full ring-1 ring-ink/20" />
                <span className="flex flex-col">
                  <span className="text-16 font-semibold text-ink">{c.symbol}</span>
                  <span className="text-14 text-ink2">{c.name}</span>
                </span>
              </RadioCard>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <GroupLabel>Card, PayPal and bank</GroupLabel>
          <div className="grid grid-cols-2 gap-3">
            {CASH_METHODS.map((m) => (
              <RadioCard key={m.id} value={`cash:${m.id}`} className="gap-4">
                <MethodLogo selection={{ kind: 'cash', methodId: m.id }} />
                <span className="flex flex-col pr-6">
                  <span className="text-16 font-semibold text-ink">{m.name}</span>
                  <span className="text-14 text-ink2">
                    {deposit ? m.depositArrives : m.withdrawArrives}, {m.flatFee ? `$${m.flatFee} fee` : `${m.feePct}% fee`}
                  </span>
                </span>
              </RadioCard>
            ))}
          </div>
        </section>
      </RadioCards>
      {s.touched && errors.selection && (
        <p id="method-error" role="alert" className="text-14 text-danger">
          {errors.selection}
        </p>
      )}
    </div>
  );
}

export function LockedWithdraw() {
  return (
    <div className="flex flex-col items-start gap-4">
      <LockKey weight="fill" className="h-6 w-6 text-pending" aria-hidden />
      <StepHeading
        id="step-title"
        title="Verify your identity to withdraw"
        lead="It takes about 2 minutes with a photo ID. Deposits and play are open while you wait."
      />
      <Button asChild size="lg">
        <Link to="/account?section=account">Verify identity</Link>
      </Button>
    </div>
  );
}

function NetworkPicker({ s, dispatch, withFee }: StepProps & { withFee: boolean }) {
  if (s.selection?.kind !== 'coin') return null;
  const coin = coinById(s.selection.coinId);
  if (coin.networks.length < 2) return null;
  return (
    <div className="flex flex-col gap-3">
      <span id="network-label" className="text-14 font-medium text-ink2">
        Network
      </span>
      <RadioCards
        value={s.networkId}
        onValueChange={(v) => dispatch({ type: 'network', networkId: v })}
        aria-labelledby="network-label"
        className="grid grid-cols-3 gap-3"
      >
        {coin.networks.map((n) => (
          <RadioCard key={n.id} value={n.id} className="flex-col items-start gap-1 p-4">
            <span className="text-16 font-semibold text-ink">{n.short}</span>
            <span className="pr-6 text-14 text-ink2">{n.name}</span>
            <span className="text-14 text-ink3">{withFee ? `Fee ${formatToken(n.withdrawFee, coin.symbol, coin.decimals)}` : n.arrival}</span>
          </RadioCard>
        ))}
      </RadioCards>
    </div>
  );
}

// Send, deposit by coin. Network first, then the address, with the one warning that saves money.
export function SendStep(props: StepProps) {
  const { s } = props;
  if (s.selection?.kind !== 'coin') return null;
  const coin = coinById(s.selection.coinId);
  const net = coin.networks.find((n) => n.id === s.networkId) ?? coin.networks[0];
  return (
    <div className="flex flex-col gap-6">
      <StepHeading id="step-title" title={`Send ${coin.symbol} to your deposit address`} lead="Copy the address into your wallet or exchange, or scan the code." />
      <NetworkPicker {...props} withFee={false} />
      <Callout tone="warning">
        <p className="font-semibold">
          Send only {coin.symbol} on {net.name}
          {coin.networks.length > 1 ? ` (${net.short})` : ''}
          {coin.memo ? `, and add the ${coin.memo.label.toLowerCase()} ${coin.memo.value}.` : '.'}
        </p>
        <p className="text-ink2">
          {coin.memo
            ? 'Coins sent on another network are lost, and without the tag the deposit cannot be matched to your account.'
            : 'Coins sent on any other network are lost and cannot be returned.'}
        </p>
      </Callout>
      <div className="flex gap-6">
        <div className="shrink-0 rounded-xl bg-white p-3">
          <QRCodeSVG value={net.depositAddress} size={136} bgColor="#FFFFFF" fgColor="#140C23" level="M" title={`QR code for your ${coin.symbol} address`} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <CopyField label={`Your ${coin.symbol} address`} value={net.depositAddress} />
          {coin.memo && <CopyField label={coin.memo.label} value={coin.memo.value} />}
        </div>
      </div>
    </div>
  );
}

const PRESETS = [50, 100, 250, 500];

// Amount, deposit by cash method.
export function AmountStep({ s, dispatch, errors }: StepProps) {
  if (s.selection?.kind !== 'cash') return null;
  const m = cashById(s.selection.methodId);
  return (
    <div className="flex flex-col gap-6">
      <StepHeading id="step-title" title="How much do you want to deposit?" />
      <div className="flex flex-col gap-3">
        <span className="text-14 font-medium text-ink2" id="presets-label">
          Quick amounts
        </span>
        <div className="flex gap-3" role="group" aria-labelledby="presets-label">
          {PRESETS.filter((p) => p >= m.min && p <= m.max).map((p) => {
            const on = Number(s.amount) === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => dispatch({ type: 'field', key: 'amount', value: String(p) })}
                className={cn(
                  'num h-10 flex-1 rounded-lg border-2 text-16 font-semibold transition-colors duration-150',
                  on ? 'border-accent bg-raised text-ink' : 'border-line bg-panel text-ink2 hover:border-field hover:text-ink',
                )}
              >
                ${p}
              </button>
            );
          })}
        </div>
      </div>
      <Field
        label="Amount"
        prefix="$"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={s.amount}
        onChange={(e) => dispatch({ type: 'field', key: 'amount', value: e.target.value })}
        hint={`Between $${formatAmount(m.min, 0)} and $${formatAmount(m.max, 0)}.`}
        error={s.touched ? errors.amount : undefined}
      />
    </div>
  );
}

// Review, deposit by cash method. The numbers live in the summary column, so this step names the
// instrument and asks for the one decision left.
export function ReviewDepositStep({ s, dispatch, errors }: StepProps) {
  if (s.selection?.kind !== 'cash') return null;
  const id = s.selection.methodId;
  if (id === 'wire') {
    return (
      <div className="flex flex-col gap-6">
        <StepHeading id="step-title" title="Send a bank transfer" lead="Use these details in your banking app. The amount is in the summary." />
        <div className="grid grid-cols-2 gap-4">
          <CopyField label="Beneficiary" value={WIRE_DETAILS.beneficiary} mono={false} className="col-span-2" />
          <CopyField label="IBAN" value={WIRE_DETAILS.iban} className="col-span-2" />
          <CopyField label="BIC" value={WIRE_DETAILS.bic} />
          <CopyField label="Reference" value={WIRE_DETAILS.reference} />
        </div>
        <Callout tone="warning">
          <p className="font-semibold">Add the reference {WIRE_DETAILS.reference} to the transfer.</p>
          <p className="text-ink2">Without it the money cannot be matched to your account.</p>
        </Callout>
      </div>
    );
  }
  if (id === 'paypal') {
    return (
      <div className="flex flex-col gap-6">
        <StepHeading id="step-title" title="Pay with PayPal" lead="You confirm the payment in PayPal, then come straight back here." />
        <Instrument selection={s.selection} title="PayPal" detail={ACCOUNT.paypalEmail} />
      </div>
    );
  }
  if (id === 'visa') {
    return (
      <div className="flex flex-col gap-6">
        <StepHeading id="step-title" title="Review and pay" lead="Check the summary, then pay with your saved card." />
        <Instrument selection={s.selection} title={`Visa ending ${ACCOUNT.savedCard.last4}`} detail={`Expires ${ACCOUNT.savedCard.expires}. Shows as LUSTY LAGOON on your statement.`} />
      </div>
    );
  }
  const err = s.touched ? errors : {};
  return (
    <div className="flex flex-col gap-6">
      <StepHeading id="step-title" title="Add your Mastercard" lead="Card details go straight to our payment processor. We never store the full number." />
      <Field
        label="Card number"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="1234 5678 9012 3456"
        value={s.card.number}
        onChange={(e) => dispatch({ type: 'card', key: 'number', value: groupCard(e.target.value) })}
        suffix={<MethodLogo selection={s.selection} size="sm" />}
        error={err.number}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={s.card.expiry} onChange={(e) => dispatch({ type: 'card', key: 'expiry', value: e.target.value })} error={err.expiry} />
        <Field label="Security code" inputMode="numeric" autoComplete="cc-csc" placeholder="3 digits" value={s.card.cvc} onChange={(e) => dispatch({ type: 'card', key: 'cvc', value: e.target.value })} error={err.cvc} />
      </div>
    </div>
  );
}

const groupCard = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

function Instrument({ selection, title, detail }: { selection: Selection; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-sunken p-4">
      <MethodLogo selection={selection} />
      <div className="flex min-w-0 flex-col">
        <span className="text-16 font-semibold text-ink">{title}</span>
        <span className="break-words text-14 text-ink2">{detail}</span>
      </div>
    </div>
  );
}

// Details, withdraw. Where it goes, then how much.
export function DetailsStep(props: StepProps) {
  const { s, dispatch, errors, balance } = props;
  if (!s.selection) return null;
  const err = s.touched ? errors : {};
  // Max fills what this method can actually take, the balance or the method's limit, whichever is lower.
  const maxAmount = s.selection.kind === 'cash' ? Math.min(balance, cashById(s.selection.methodId).max) : balance;
  const max = (
    <Button variant="tertiary" size="sm" onClick={() => dispatch({ type: 'field', key: 'amount', value: String(maxAmount) })}>
      Max
    </Button>
  );
  const amount = (
    <Field
      label="Amount"
      inputMode="decimal"
      autoComplete="off"
      placeholder="0.00"
      value={s.amount}
      onChange={(e) => dispatch({ type: 'field', key: 'amount', value: e.target.value })}
      suffix={
        <span className="flex items-center gap-2">
          <span className="text-16 text-ink3">USDT</span>
          {max}
        </span>
      }
      hint={`Available ${formatAmount(balance)} USDT.`}
      error={err.amount}
    />
  );

  if (s.selection.kind === 'coin') {
    const coin = coinById(s.selection.coinId);
    const net = coin.networks.find((n) => n.id === s.networkId) ?? coin.networks[0];
    return (
      <div className="flex flex-col gap-6">
        <StepHeading id="step-title" title={`Where should we send your ${coin.symbol}?`} />
        <NetworkPicker {...props} withFee />
        <Callout tone="warning">
          <p className="font-semibold">
            Your wallet must accept {coin.symbol} on {net.name}
            {coin.networks.length > 1 ? ` (${net.short})` : ''}.
          </p>
          <p className="text-ink2">Coins sent to an address on another network are lost and cannot be returned.</p>
        </Callout>
        <Field
          label={`${net.name} address`}
          autoComplete="off"
          spellCheck={false}
          placeholder={PLACEHOLDER[net.format]}
          value={s.address}
          onChange={(e) => dispatch({ type: 'field', key: 'address', value: e.target.value })}
          className="[&_input]:font-mono [&_input]:text-14"
          error={err.address}
        />
        {coin.memo && (
          <Field
            label={`${coin.memo.label}, if your exchange gave you one`}
            inputMode="numeric"
            autoComplete="off"
            value={s.memo}
            onChange={(e) => dispatch({ type: 'field', key: 'memo', value: e.target.value })}
          />
        )}
        {amount}
      </div>
    );
  }

  const id = s.selection.methodId;
  return (
    <div className="flex flex-col gap-6">
      <StepHeading id="step-title" title={`Withdraw to ${cashById(id).name}`} />
      {amount}
      {id === 'paypal' && (
        <Field label="PayPal email" type="email" autoComplete="email" value={s.paypalEmail} onChange={(e) => dispatch({ type: 'field', key: 'paypalEmail', value: e.target.value })} error={err.paypalEmail} />
      )}
      {(id === 'visa' || id === 'mastercard') && (
        <Instrument
          selection={s.selection}
          title={id === 'visa' ? `Visa ending ${ACCOUNT.savedCard.last4}` : 'Mastercard ending 7710'}
          detail="Card withdrawals go back to the card you deposited with."
        />
      )}
      {id === 'wire' && (
        <>
          <Field label="IBAN" autoComplete="off" spellCheck={false} placeholder="DE89 3704 0044 0532 0130 00" value={s.iban} onChange={(e) => dispatch({ type: 'field', key: 'iban', value: e.target.value.toUpperCase() })} error={err.iban} />
          <Field label="Name on the account" autoComplete="name" value={s.holder} onChange={(e) => dispatch({ type: 'field', key: 'holder', value: e.target.value })} error={err.holder} />
        </>
      )}
    </div>
  );
}

const PLACEHOLDER = {
  bitcoin: 'Starts with bc1, 1 or 3',
  evm: 'Starts with 0x',
  tron: 'Starts with T',
  litecoin: 'Starts with ltc1, L or M',
  xrp: 'Starts with r',
  dogecoin: 'Starts with D',
} as const;

// Review, withdraw. The destination in full, and the last check before money leaves.
export function ReviewWithdrawStep({ s }: StepProps) {
  if (!s.selection) return null;
  if (s.selection.kind === 'coin') {
    const coin = coinById(s.selection.coinId);
    const net = coin.networks.find((n) => n.id === s.networkId) ?? coin.networks[0];
    return (
      <div className="flex flex-col gap-6">
        <StepHeading id="step-title" title="Check the address, then confirm" />
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-sunken p-4">
          <span className="text-14 font-medium text-ink2">
            Sending to this {net.name} address
          </span>
          <span className="break-all font-mono text-16 text-ink">{s.address.trim()}</span>
          {s.memo && <span className="text-14 text-ink2">Destination tag {s.memo}</span>}
        </div>
        <Callout tone="warning">
          <p className="font-semibold">Crypto sent to a wrong address cannot be recovered.</p>
          <p className="text-ink2">Match the first and last 4 characters with the address in your wallet.</p>
        </Callout>
      </div>
    );
  }
  const id = s.selection.methodId;
  const title = id === 'paypal' ? s.paypalEmail : id === 'wire' ? s.iban : id === 'visa' ? `Visa ending ${ACCOUNT.savedCard.last4}` : 'Mastercard ending 7710';
  const detail = id === 'wire' ? s.holder : cashById(id).name;
  return (
    <div className="flex flex-col gap-6">
      <StepHeading id="step-title" title="Check and confirm" lead="The amount leaves your balance now and arrives as the summary says." />
      <Instrument selection={s.selection} title={title} detail={detail} />
    </div>
  );
}

// Status. One headline, a short timeline, and the next thing to do.

type Stage = { label: string; note?: string };

export function StatusStep({ s, dispatch, onRetry }: StepProps & { onRetry: () => void }) {
  if (!s.selection) return null;
  const coin = s.selection.kind === 'coin' ? coinById(s.selection.coinId) : null;
  const net = coin?.networks.find((n) => n.id === s.networkId) ?? coin?.networks[0];
  const cash = s.selection.kind === 'cash' ? cashById(s.selection.methodId) : null;
  const deposit = s.direction === 'deposit';

  let stages: Stage[];
  if (deposit && coin && net) {
    stages = [
      { label: 'Waiting for your transfer' },
      { label: 'Found on the network', note: `${s.confirms} of ${net.confirmations} confirmations` },
      { label: 'Added to your balance' },
    ];
  } else if (deposit) {
    stages = [{ label: 'Payment sent' }, { label: cash?.id === 'wire' ? 'Waiting for your bank' : 'Approved by your bank' }, { label: 'Added to your balance' }];
  } else {
    stages = [{ label: 'Request received' }, { label: 'Security check' }, { label: coin ? 'Sent to the network' : `Paid out to ${cash?.name}` }];
  }

  const view = {
    processing: { Icon: CircleNotch, tone: 'text-accent', title: deposit ? 'Processing your payment' : 'Sending your withdrawal', spin: true },
    pending: {
      Icon: Clock,
      tone: 'text-pending',
      title: deposit ? (coin ? 'Waiting for your deposit' : 'Transfer on its way') : 'Withdrawal on its way',
      spin: false,
    },
    completed: { Icon: CheckCircle, tone: 'text-success', title: deposit ? 'Deposit complete' : 'Withdrawal sent', spin: false },
    declined: { Icon: XCircle, tone: 'text-danger', title: deposit ? 'Your bank declined this payment' : 'This withdrawal was declined', spin: false },
  }[s.outcome ?? 'processing'];

  const lead =
    s.outcome === 'declined'
      ? deposit
        ? 'No money was taken. Try again, or pay another way.'
        : 'It did not pass our security check, and the money is back in your balance. Try again, or withdraw another way.'
      : s.outcome === 'completed' && deposit
        ? coin && s.received
          ? `We received ${formatToken(s.received, coin.symbol, coin.decimals)}. You can play with it now.`
          : 'The money is in your balance. You can play with it now.'
        : s.outcome === 'pending' && deposit && cash?.id === 'wire'
          ? 'Bank transfers take 1 to 3 days. We add it to your balance the moment it lands.'
          : s.outcome === 'pending' && deposit && coin
            ? `Keep this page open or come back later. We add it after ${net?.confirmations} confirmations.`
            : !deposit
              ? coin
                ? `It usually arrives in ${net?.arrival.toLowerCase()}.`
                : `${cash?.name} withdrawals arrive ${cash?.withdrawArrives.toLowerCase()}.`
              : undefined;

  const done = s.outcome === 'declined' ? 1 : s.stage;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <view.Icon weight={view.spin ? 'bold' : 'fill'} className={cn('h-10 w-10', view.tone, view.spin && 'animate-spin')} aria-hidden />
        <StepHeading id="step-title" title={view.title} lead={lead} />
      </div>

      <ol className="flex flex-col gap-0" aria-label="Progress">
        {stages.map((st, i) => {
          const state = s.outcome === 'declined' && i === 1 ? 'failed' : i < done || (i === done && s.outcome === 'completed') ? 'done' : i === done ? 'now' : 'todo';
          return (
            <li key={st.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2',
                    state === 'done' && 'border-success bg-success',
                    state === 'now' && 'border-accent',
                    state === 'failed' && 'border-danger bg-danger',
                    state === 'todo' && 'border-line',
                  )}
                >
                  {state === 'done' && <CheckCircle weight="fill" size={16} className="text-page" aria-hidden />}
                  {state === 'failed' && <XCircle weight="fill" size={16} className="text-page" aria-hidden />}
                  {state === 'now' && <span className="h-[var(--bl-sp-8)] w-2 animate-pulse rounded-full bg-accent" aria-hidden />}
                </span>
                {i < stages.length - 1 && <span aria-hidden className={cn('h-6 w-[var(--bl-border-2)]', state === 'done' ? 'bg-success' : 'bg-line')} />}
              </div>
              <div className="flex flex-col pb-4">
                <span className={cn('text-16 font-medium', state === 'todo' ? 'text-ink3' : 'text-ink')}>
                  {st.label}
                  <span className="sr-only">, {state === 'done' ? 'done' : state === 'now' ? 'in progress' : state === 'failed' ? 'failed' : 'not started'}</span>
                </span>
                {st.note && state === 'now' && <span className="num text-14 text-ink2">{st.note}</span>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex gap-3">
        {s.outcome === 'declined' ? (
          <>
            <Button size="lg" onClick={onRetry}>
              Try again
            </Button>
            <Button size="lg" variant="secondary" onClick={() => dispatch({ type: 'go', step: 'method' })}>
              {deposit ? 'Pay another way' : 'Withdraw another way'}
            </Button>
          </>
        ) : s.outcome === 'processing' ? null : (
          <>
            {s.outcome === 'completed' && deposit && (
              <Button asChild size="lg">
                <Link to="/lobby">Go to the lobby</Link>
              </Button>
            )}
            <Button size="lg" variant="secondary" onClick={() => dispatch({ type: 'reset' })}>
              {deposit ? 'Make another deposit' : 'Make another withdrawal'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useReducer, useRef } from 'react';
import { ArrowLeft, Clock } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { StatusChip } from '../../components/ui/StatusChip';
import { MethodLogo } from '../../components/ui/MethodLogo';
import { cashById, coinById, methodLabel, type Direction, type Transaction } from '../../data/wallet';
import { formatAmount, formatToken, formatUsd } from '../../lib/format';
import { cn } from '../../lib/cn';
import { STEP_LABEL, initialState, quote, reducer, stepsFor, validate, type FlowState } from './flow';
import {
  AmountStep,
  DetailsStep,
  LockedWithdraw,
  MethodStep,
  ReviewDepositStep,
  ReviewWithdrawStep,
  SendStep,
  StatusStep,
  type StepProps,
} from './steps';
import { nextTxId, useWallet } from './store';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function PaymentFlow({ direction }: { direction: Direction }) {
  const wallet = useWallet();
  const [s, dispatch] = useReducer(reducer, direction, (d) => initialState(d, new URLSearchParams(window.location.search)));
  const fast = useMemo(() => s.autoSubmit || new URLSearchParams(window.location.search).get('status') === 'done', []); // eslint-disable-line react-hooks/exhaustive-deps
  const steps = stepsFor(direction, s.selection);
  const index = steps.indexOf(s.step);
  const errors = validate(s, wallet.balance);
  const hasErrors = Object.keys(errors).length > 0;
  const locked = direction === 'withdraw' && wallet.withdrawLocked;

  // Move focus to the step heading on every step change, so keyboard and screen reader users land
  // on the new content and not on a button that has gone.
  const shownStep = useRef(s.step);
  useEffect(() => {
    if (shownStep.current === s.step) return;
    shownStep.current = s.step;
    document.getElementById('step-title')?.focus();
  }, [s.step]);

  const cancelled = useRef(false);
  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const next = () => {
    if (hasErrors) {
      dispatch({ type: 'touch' });
      return;
    }
    dispatch({ type: 'go', step: steps[index + 1] });
  };
  const back = () => dispatch({ type: 'go', step: steps[index - 1] });

  async function submit() {
    if (hasErrors) {
      dispatch({ type: 'touch' });
      return;
    }
    const sel = s.selection!;
    const id = nextTxId();
    const now = new Date().toISOString().slice(0, 19);
    const q = quote(s, wallet.balance)!;
    const tick = (ms: number) => (fast ? Promise.resolve() : wait(ms));
    const alive = () => !cancelled.current;

    if (direction === 'deposit' && sel.kind === 'coin') {
      const coin = coinById(sel.coinId);
      const net = coin.networks.find((n) => n.id === s.networkId) ?? coin.networks[0];
      const received = Number((250 / coin.rate).toFixed(coin.decimals));
      const value = Math.round(received * coin.rate * 100) / 100;
      const tx: Transaction = { id, direction, method: sel, networkId: net.id, amount: received, value, status: 'pending', date: now, reference: 'Waiting for the network' };
      wallet.record(tx, 0);
      dispatch({ type: 'submit', txId: id, outcome: 'pending', received });
      await tick(1400);
      const stepBy = Math.max(1, Math.ceil(net.confirmations / 4));
      for (let c = 0; c < net.confirmations && alive(); c = Math.min(net.confirmations, c + stepBy)) {
        dispatch({ type: 'stage', stage: 1, confirms: c });
        await tick(700);
      }
      if (!alive()) return;
      wallet.update(id, { status: 'completed', reference: '9b2e7f1c04d8a63e5b19c7f20a4d8e61c3b95f07d2a4e8c16b0f39d5a7e2c41f' }, value);
      dispatch({ type: 'stage', stage: 2, outcome: 'completed', confirms: net.confirmations });
      return;
    }

    if (direction === 'deposit' && sel.kind === 'cash') {
      const m = cashById(sel.methodId);
      if (m.id === 'wire') {
        wallet.record({ id, direction, method: sel, amount: q.amount, value: q.receive, status: 'pending', date: now, reference: 'LL-JD-48213907' }, 0);
        dispatch({ type: 'submit', txId: id, outcome: 'pending' });
        dispatch({ type: 'stage', stage: 1 });
        return;
      }
      dispatch({ type: 'submit', txId: id, outcome: 'processing' });
      await tick(m.id === 'paypal' ? 1800 : 1400);
      if (!alive()) return;
      const declined = wallet.declineCards && m.kind === 'card';
      wallet.record(
        { id, direction, method: sel, amount: q.amount, value: q.receive, status: declined ? 'declined' : 'completed', date: now, reference: `${m.id.slice(0, 3).toUpperCase()}-1019-${id.slice(-4)}` },
        declined ? 0 : q.receive,
      );
      dispatch({ type: 'stage', stage: declined ? 1 : 2, outcome: declined ? 'declined' : 'completed' });
      return;
    }

    // Withdrawals leave the balance at once and are held until they are sent.
    const coin = sel.kind === 'coin' ? coinById(sel.coinId) : null;
    const amount = coin ? Number((q.coinAmount ?? 0).toFixed(coin.decimals)) : q.amount;
    wallet.record({ id, direction, method: sel, networkId: s.networkId, amount, value: q.amount, status: 'pending', date: now, reference: 'Security check' }, -q.amount);
    dispatch({ type: 'submit', txId: id, outcome: 'processing' });
    await tick(900);
    if (!alive()) return;
    dispatch({ type: 'stage', stage: 1, outcome: 'pending' });
    await tick(1800);
    if (!alive()) return;
    if (coin) {
      wallet.update(id, { status: 'completed', reference: '3f8a1c9e27d04b6a5e1f83c90d7b2a4e6c15f8d03a9b7e2c41d6f05b8e3a9c72' });
      dispatch({ type: 'stage', stage: 2, outcome: 'completed' });
    } else {
      wallet.update(id, { reference: `PAYOUT-${id.slice(-6)}` });
      dispatch({ type: 'stage', stage: 2, outcome: 'pending' });
    }
  }

  // A ?step=status deep link submits once on load, so each result has its own URL for the case study.
  const autoRan = useRef(false);
  useEffect(() => {
    if (!s.autoSubmit || autoRan.current) return;
    autoRan.current = true;
    void submit();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const props: StepProps = { s, dispatch, errors, balance: wallet.balance };
  const body = locked ? (
    <LockedWithdraw />
  ) : (
    {
      method: <MethodStep {...props} />,
      send: <SendStep {...props} />,
      amount: <AmountStep {...props} />,
      details: <DetailsStep {...props} />,
      review: direction === 'deposit' ? <ReviewDepositStep {...props} /> : <ReviewWithdrawStep {...props} />,
      status: <StatusStep {...props} onRetry={() => dispatch({ type: 'go', step: 'review' })} />,
    }[s.step]
  );

  const primaryLabel = (() => {
    if (s.step === 'send') return "I've sent it";
    if (s.step === 'review' && direction === 'withdraw') return 'Confirm withdrawal';
    if (s.step === 'review' && s.selection?.kind === 'cash') {
      if (s.selection.methodId === 'paypal') return 'Continue to PayPal';
      if (s.selection.methodId === 'wire') return "I've sent the transfer";
      return 'Confirm and pay';
    }
    return 'Continue';
  })();
  const isSubmit = s.step === 'send' || s.step === 'review';

  return (
    <div className="grid grid-cols-12 items-start gap-6">
      <section aria-label={direction === 'deposit' ? 'Deposit' : 'Withdraw'} className="col-span-7 flex flex-col gap-8 rounded-2xl border border-line bg-panel p-6">
        {!locked && <Stepper steps={steps.map((st) => STEP_LABEL[st])} current={index} />}
        {body}
        {!locked && s.step !== 'status' && (
          <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
            {index > 0 ? (
              <Button variant="quiet" size="lg" onClick={back}>
                <ArrowLeft className="h-5 w-5" aria-hidden />
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button size="lg" onClick={isSubmit ? submit : next}>
              {primaryLabel}
            </Button>
          </div>
        )}
      </section>
      <Summary s={s} balance={wallet.balance} locked={locked} />
    </div>
  );
}

const UNSET = 'Not set';

const when = (arrives: string) => {
  const t = arrives.toLowerCase();
  return t === 'instantly' || t.startsWith('within') ? t : `in ${t}`;
};

function Row({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', strong && 'border-t border-line pt-4')}>
      <dt className={cn('text-14', strong ? 'font-semibold text-ink' : 'text-ink2')}>{label}</dt>
      <dd className={cn('num text-right', children === UNSET ? 'text-16 text-ink3' : cn('text-ink', strong ? 'text-20 font-semibold' : 'text-16'))}>{children}</dd>
    </div>
  );
}

// The summary column fills in as the player moves, and turns into the receipt at the end.
function Summary({ s, balance, locked }: { s: FlowState; balance: number; locked: boolean }) {
  const { transactions } = useWallet();
  const deposit = s.direction === 'deposit';
  const q = quote(s, balance);
  // Numbers show only for an amount the flow would accept, so the summary never promises 507 BTC.
  const valid = q && Number.isFinite(q.amount) && q.amount > 0 && q.amount >= q.min && q.amount <= q.max;
  const tx = s.txId ? transactions.find((t) => t.id === s.txId) : undefined;
  const receipt = s.step === 'status' && tx;

  let rows: React.ReactNode = null;
  let arrives = '';
  if (s.selection?.kind === 'coin') {
    const coin = coinById(s.selection.coinId);
    const net = coin.networks.find((n) => n.id === s.networkId) ?? coin.networks[0];
    arrives = net.arrival;
    rows = deposit ? (
      <>
        <Row label="Network">{coin.networks.length > 1 ? `${net.name} (${net.short})` : net.name}</Row>
        <Row label="Minimum deposit">{formatToken(coin.minDeposit, coin.symbol, coin.decimals)}</Row>
        {coin.symbol !== 'USDT' && <Row label="Rate">1 {coin.symbol} = {formatAmount(coin.rate)} USDT</Row>}
        <Row label="Added after">
          {net.confirmations} {net.confirmations === 1 ? 'confirmation' : 'confirmations'}
        </Row>
        {receipt && s.received ? <Row label="Received" strong>{formatToken(s.received, coin.symbol, coin.decimals)}</Row> : null}
      </>
    ) : (
      <>
        <Row label="Network">{coin.networks.length > 1 ? `${net.name} (${net.short})` : net.name}</Row>
        <Row label="Amount">{valid ? `${formatAmount(q!.amount)} USDT` : UNSET}</Row>
        <Row label="Rate">1 {coin.symbol} = {formatAmount(coin.rate)} USDT</Row>
        <Row label="Network fee">{formatToken(net.withdrawFee, coin.symbol, coin.decimals)}</Row>
        <Row label="You receive" strong>
          {valid && q!.receive > 0 ? formatToken(q!.receive, coin.symbol, coin.decimals) : UNSET}
        </Row>
      </>
    );
  } else if (s.selection?.kind === 'cash') {
    const m = cashById(s.selection.methodId);
    arrives = deposit ? m.depositArrives : m.withdrawArrives;
    rows = (
      <>
        <Row label={deposit ? 'You pay' : 'Amount'}>{valid ? (deposit ? formatUsd(q!.amount) : `${formatAmount(q!.amount)} USDT`) : UNSET}</Row>
        <Row label={q!.feeLabel}>{valid ? formatUsd(q!.fee) : UNSET}</Row>
        <Row label={deposit ? 'Added to balance' : 'You receive'} strong>
          {valid && q!.receive > 0 ? (deposit ? `${formatAmount(q!.receive)} USDT` : formatUsd(q!.receive)) : UNSET}
        </Row>
      </>
    );
  }

  return (
    <aside aria-labelledby="summary-title" className="sticky top-24 col-span-5 flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="summary-title" className="font-display text-20 font-semibold text-ink">
          {receipt ? 'Receipt' : 'Summary'}
        </h2>
        {receipt && <StatusChip status={tx.status} />}
      </div>
      {!s.selection || locked ? (
        <p className="text-16 text-ink2">
          {locked ? 'Withdrawal details show here once your identity is verified.' : deposit ? 'Pick a method to see the fees and when the money lands.' : 'Pick a method to see the fees and what you receive.'}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <MethodLogo selection={s.selection} />
            <div className="flex flex-col">
              <span className="text-16 font-semibold text-ink">{methodLabel(s.selection, s.networkId)}</span>
              <span className="text-14 text-ink2">{deposit ? 'Deposit' : 'Withdrawal'}</span>
            </div>
          </div>
          <dl className="flex flex-col gap-3">
            {receipt && tx.status === 'declined' ? (
              <>
                <Row label="Amount">{formatUsd(tx.amount)}</Row>
                <Row label="Charged" strong>
                  {formatUsd(0)}
                </Row>
              </>
            ) : (
              rows
            )}
          </dl>
          {(!receipt || tx.status === 'pending') && (
            <p className="flex items-center gap-2 text-14 text-ink2">
              <Clock className="h-5 w-5 text-ink3" aria-hidden />
              {deposit ? 'Lands' : 'Arrives'} {when(arrives)}
            </p>
          )}
          {receipt && (
            <dl className="flex flex-col gap-3 border-t border-line pt-4">
              <Row label="Transaction">{tx.id}</Row>
              <Row label="Balance now">{formatAmount(balance)} USDT</Row>
            </dl>
          )}
        </>
      )}
    </aside>
  );
}

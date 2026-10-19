import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle, Lightning, Ticket, WarningCircle } from '@phosphor-icons/react';
import { siPaypal, siVisa } from 'simple-icons';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { KitButton } from '../kit/parts';
import { PRESETS, QUICK_METHODS, checkoutUrl, quoteFor, type QuickMethod } from './quote';
import { Title } from './ui';

// The second thing the eye lands on. A glass card in the vault beside the balance. The methods as
// quiet glass chips, the picked one lit from its top edge with a check. The amount in one well with
// the presets inside it, a summary well with You pay as the one strong number, the promo code, and
// Checkout, the orange pill key and the only orange in the money row. Every behaviour of round 4
// stays, the arrow keys, the presets, the checks, the promo states and the deep link in quote.ts.

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0C13]';

function Glyph({ path, fill, className, viewBox = '0 0 24 24' }: { path: string; fill: string; className?: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className={className} aria-hidden>
      <path d={path} fill={fill} />
    </svg>
  );
}

function MethodIcon({ m }: { m: QuickMethod }): ReactNode {
  if (m.kind === 'cash') {
    if (m.methodId === 'visa') return <Glyph path={siVisa.path} fill="#FFFFFF" viewBox="0 7 24 10" className="h-[12px] w-[30px]" />;
    if (m.methodId === 'mastercard') return <img src="/brand/mastercard.svg" alt="" className="h-[20px] w-auto" />;
    return <Glyph path={siPaypal.path} fill="#3B9BEA" className="h-[20px] w-[20px]" />;
  }
  return <img src={coinById(m.coinId).icon} alt="" className="h-[28px] w-[28px] rounded-full" />;
}

function MethodChip({ m, on, onPick, tabIndex, refCb }: { m: QuickMethod; on: boolean; onPick: () => void; tabIndex: number; refCb: (el: HTMLButtonElement | null) => void }) {
  return (
    <button
      ref={refCb}
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={`${m.name}, ${m.tag}`}
      tabIndex={tabIndex}
      onClick={onPick}
      className={cn('relative flex h-[52px] w-full items-center gap-3 rounded-2xl pl-2 pr-2 text-left transition-[background-color,box-shadow] duration-200', FOCUS, on ? 'gv-picked' : 'gv-pill')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
        <MethodIcon m={m} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-14 font-semibold leading-5 text-white">{m.name}</span>
        <span className={cn('truncate text-12 font-medium leading-4', on ? 'text-[rgb(var(--gv-violet))]' : 'text-[rgb(var(--gv-ink-3))]')}>{m.tag}</span>
      </span>
      {on && (
        <span aria-hidden className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#B47CFF] text-[#1A0F2B]">
          <Check weight="bold" className="h-[11px] w-[11px]" />
        </span>
      )}
    </button>
  );
}

function Leader({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-[232px] items-baseline justify-between gap-4">
      <dt className="truncate text-14 text-[rgb(var(--gv-ink-2))]">{label}</dt>
      <dd className="num shrink-0 text-14 font-semibold text-white">{value}</dd>
    </div>
  );
}

export function QuickDeposit() {
  const navigate = useNavigate();
  const [key, setKey] = useState('visa');
  const [raw, setRaw] = useState('25');
  const [promo, setPromo] = useState('');
  const [promoState, setPromoState] = useState<'idle' | 'added' | 'blank'>('idle');
  const [tried, setTried] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const amountRef = useRef<HTMLInputElement>(null);
  const ids = { amount: useId(), help: useId(), promo: useId() };
  const method = QUICK_METHODS.find((x) => x.key === key)!;
  const amount = Number(raw.replace(/,/g, ''));
  const q = useMemo(() => quoteFor(method, Number.isFinite(amount) ? amount : 0), [method, amount]);
  const showProblem = q.problem && (tried || raw !== '');
  const payText = q.problem && !(amount > 0) ? '0.00' : formatAmount(q.pay, q.payDigits);

  const onKey = (e: KeyboardEvent, i: number) => {
    const step = { ArrowRight: 1, ArrowDown: 3, ArrowLeft: -1, ArrowUp: -3 }[e.key];
    if (!step) return;
    e.preventDefault();
    const n = (i + step + QUICK_METHODS.length) % QUICK_METHODS.length;
    setKey(QUICK_METHODS[n].key);
    refs.current[n]?.focus();
  };

  const checkout = () => {
    setTried(true);
    if (q.problem) {
      amountRef.current?.focus();
      return;
    }
    navigate(checkoutUrl(method, amount, promoState === 'added' ? promo.trim() : ''), { state: { method: method.key, amount, promo: promoState === 'added' ? promo.trim() : undefined } });
  };

  return (
    <section aria-labelledby="qd-title" className="gv-glass gv-edge flex flex-col gap-4 rounded-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <Title id="qd-title">Quick deposit</Title>
        <p className="flex items-center gap-1 text-12 font-medium text-[rgb(var(--gv-ink-3))]">
          <Lightning weight="fill" className="h-4 w-4 text-[#F4D543]" aria-hidden />
          Cards land instantly, coins in minutes
        </p>
      </div>

      <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-3 gap-2">
        {QUICK_METHODS.map((m, i) => (
          <div key={m.key} onKeyDown={(e) => onKey(e, i)}>
            <MethodChip m={m} on={m.key === key} onPick={() => setKey(m.key)} tabIndex={m.key === key ? 0 : -1} refCb={(el) => (refs.current[i] = el)} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-1">
          <label htmlFor={ids.amount} className="text-14 font-medium text-[rgb(var(--gv-ink-2))]">
            Amount
          </label>
          <span className="text-12 font-medium text-[rgb(var(--gv-ink-3))]">
            Minimum <span className="num text-white">{formatAmount(q.min)} USD</span>
          </span>
        </div>
        <div className={cn('gv-well flex h-[56px] min-w-0 items-center gap-2 rounded-2xl pl-4 pr-2 transition-shadow focus-within:shadow-[inset_0_0_0_1px_rgb(180_124_255)]', showProblem && 'shadow-[inset_0_0_0_1px_rgb(255_122_136/0.8)]')}>
          <span aria-hidden className="text-20 font-semibold text-[rgb(var(--gv-ink-3))]">
            $
          </span>
          <input
            ref={amountRef}
            id={ids.amount}
            inputMode="decimal"
            autoComplete="off"
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, ''))}
            aria-invalid={!!showProblem}
            aria-describedby={ids.help}
            placeholder="0.00"
            className="num h-full min-w-0 flex-1 bg-transparent text-20 font-semibold text-white outline-none placeholder:text-[rgb(var(--gv-ink-3))]"
          />
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={amount === p}
                onClick={() => setRaw(String(p))}
                className={cn('num h-10 rounded-full px-4 text-14 font-semibold transition-colors', FOCUS, amount === p ? 'gv-on text-white' : 'text-[rgb(var(--gv-ink-2))] hover:bg-white/[0.06] hover:text-white')}
              >
                ${p}
              </button>
            ))}
          </div>
        </div>
        <p id={ids.help} aria-live="polite" className={cn('flex min-h-[16px] items-center gap-1 px-1 text-12 font-medium', showProblem ? 'text-[#FF8FA3]' : 'text-[rgb(var(--gv-ink-3))]')}>
          {showProblem ? (
            <>
              <WarningCircle weight="fill" className="h-4 w-4 shrink-0" aria-hidden />
              {q.problem}
            </>
          ) : (
            'Credited as USDT, 1 USD is 1 USDT'
          )}
        </p>
      </div>

      <dl className="gv-well grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 rounded-2xl px-4 py-3">
        <div className="row-span-2 flex flex-col gap-0.5">
          <dt className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--gv-ink-3))]">You pay</dt>
          <dd className={cn('num truncate font-semibold tracking-[-0.02em] text-white', payText.length > 7 ? 'text-20 leading-8' : 'text-28')}>
            {payText} <span className="text-16 font-medium text-[rgb(var(--gv-ink-2))]">{q.payUnit}</span>
          </dd>
        </div>
        <Leader label="You get" value={`${formatAmount(amount > 0 ? q.get : 0)} USDT`} />
        <Leader label={q.feeLabel} value={`${formatAmount(q.fee)} USD`} />
      </dl>

      <form
        className="flex min-w-0 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          setPromoState(promo.trim() ? 'added' : 'blank');
        }}
      >
        <div className="gv-well flex h-11 min-w-0 items-center gap-2 rounded-full pl-4 pr-[4px] focus-within:shadow-[inset_0_0_0_1px_rgb(180_124_255)]">
          <Ticket weight="regular" className="h-4 w-4 shrink-0 text-[rgb(var(--gv-ink-3))]" aria-hidden />
          <label htmlFor={ids.promo} className="sr-only">
            Promo code
          </label>
          <input
            id={ids.promo}
            value={promo}
            onChange={(e) => {
              setPromo(e.target.value.toUpperCase());
              setPromoState('idle');
            }}
            placeholder="Promo code"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-14 font-semibold uppercase tracking-[0.04em] text-white outline-none placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-[rgb(var(--gv-ink-3))]"
          />
          {promoState === 'added' && (
            <span className="flex shrink-0 items-center gap-1 text-12 font-semibold text-[#38EE59]">
              <CheckCircle weight="fill" className="h-4 w-4" aria-hidden />
              Added
            </span>
          )}
          <button type="submit" className={cn('k-key k-key-purple k-key-pill inline-flex h-9 shrink-0 items-center px-4 text-14', FOCUS)}>
            Apply
          </button>
        </div>
        <p role="status" className="sr-only">
          {promoState === 'added' ? `Code ${promo.trim()} added. It is checked at checkout.` : promoState === 'blank' ? 'Type a promo code first.' : ''}
        </p>
      </form>

      <KitButton tone="primary" shape="pill" size="lg" onClick={checkout} className="mt-auto h-[56px] w-full text-16 focus-visible:ring-offset-[#0E0C13]">
        Checkout
        <span aria-hidden className="num font-semibold opacity-70">
          {q.problem ? '' : `${formatAmount(q.pay, q.payDigits)} ${q.payUnit}`}
        </span>
      </KitButton>
    </section>
  );
}

import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle, Lightning, Ticket, WarningCircle } from '@phosphor-icons/react';
import { siPaypal, siVisa } from 'simple-icons';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { KitButton } from '../kit/parts';
import { PRESETS, QUICK_METHODS, checkoutUrl, quoteFor, type QuickMethod } from './quote';
import { CardTitle } from './ui';

// Skinify's payment modal, set flat into the dashboard. Method cards with a type tag, the picked one
// with an accent outline and a check, amount presets in boxes, You pay, You get and the commission
// on dotted leaders, a gold Checkout and a promo code field with Apply.

function Glyph({ path, fill, className, viewBox = '0 0 24 24' }: { path: string; fill: string; className?: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className={className} aria-hidden>
      <path d={path} fill={fill} />
    </svg>
  );
}

function MethodMark({ m }: { m: QuickMethod }): ReactNode {
  if (m.kind === 'cash') {
    if (m.methodId === 'visa') return <Glyph path={siVisa.path} fill="#FFFFFF" viewBox="0 7 24 10" className="h-[32px] w-[78px]" />;
    if (m.methodId === 'mastercard')
      return (
        <span className="flex items-center gap-2">
          <img src="/brand/mastercard.svg" alt="" className="h-[30px] w-auto" />
          <span className="text-18 font-bold tracking-[-0.01em] text-ink">mastercard</span>
        </span>
      );
    return (
      <span className="flex items-center gap-2">
        <Glyph path={siPaypal.path} fill="#3B9BEA" className="h-[26px] w-[26px]" />
        <span className="text-20 font-bold italic tracking-[-0.02em] text-ink">PayPal</span>
      </span>
    );
  }
  const coin = coinById(m.coinId);
  return (
    <span className="flex items-center gap-2">
      <img src={coin.icon} alt="" className="h-[30px] w-[30px] rounded-full" />
      <span className="text-20 font-bold lowercase tracking-[-0.01em] text-ink">{m.name}</span>
    </span>
  );
}

function MethodCard({ m, on, onPick, tabIndex, refCb }: { m: QuickMethod; on: boolean; onPick: () => void; tabIndex: number; refCb: (el: HTMLButtonElement | null) => void }) {
  return (
    <button
      ref={refCb}
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={`${m.name}, ${m.tag}`}
      tabIndex={tabIndex}
      onClick={onPick}
      className={cn(
        'relative flex h-[88px] w-full items-center justify-center rounded-[14px] border-2 transition-colors duration-150',
        on ? 'border-accent bg-[#2A1D4D]' : 'border-transparent bg-[rgb(var(--k-item))] hover:bg-[rgb(var(--k-item-hover))]',
      )}
    >
      <span className={cn('absolute left-2 top-2 rounded-[6px] px-[6px] py-0.5 text-12 font-bold uppercase leading-4 tracking-[0.02em]', on ? 'bg-accent text-[#1A0F2B]' : 'bg-[#3A2A63] text-[#D9C6FF]')}>{m.tag}</span>
      {on && (
        <span aria-hidden className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[#1A0F2B]">
          <Check weight="bold" className="h-[12px] w-[12px]" />
        </span>
      )}
      <span className="mt-3">
        <MethodMark m={m} />
      </span>
    </button>
  );
}

function Leader({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className={cn('shrink-0', strong ? 'text-18 font-bold text-ink' : 'text-14 font-semibold text-[rgb(var(--k-muted))]')}>{label}</dt>
      <span aria-hidden className="mb-1 min-w-[16px] flex-1 border-b-2 border-dotted border-ink/15" />
      <dd className={cn('num shrink-0', strong ? 'text-18 font-bold text-win' : 'text-14 font-semibold text-ink')}>{value}</dd>
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
    <section aria-labelledby="qd-title" className="flex flex-col gap-4 rounded-[24px] bg-[rgb(var(--k-panel))] p-[20px]">
      <div className="flex items-start justify-between gap-4">
        <CardTitle id="qd-title" dot>
          Quick deposit
        </CardTitle>
        <p className="flex items-center gap-1 pt-1 text-14 font-semibold text-[rgb(var(--k-muted))]">
          <Lightning weight="fill" className="h-4 w-4 text-gold" aria-hidden />
          Cards land instantly, coins in minutes
        </p>
      </div>

      <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-3 gap-2">
        {QUICK_METHODS.map((m, i) => (
          <div key={m.key} onKeyDown={(e) => onKey(e, i)}>
            <MethodCard m={m} on={m.key === key} onPick={() => setKey(m.key)} tabIndex={m.key === key ? 0 : -1} refCb={(el) => (refs.current[i] = el)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor={ids.amount} className="text-16 font-bold text-ink">
              Amount
            </label>
            <span className="text-12 font-semibold text-[rgb(var(--k-dim))]">
              Minimum <span className="num text-win">{formatAmount(q.min)} USD</span>
            </span>
          </div>
          <div className="flex gap-2">
            <div className={cn('flex h-[48px] min-w-0 flex-1 items-center gap-2 rounded-[12px] border-2 bg-[rgb(var(--k-item))] pl-3 pr-3 focus-within:border-accent', showProblem ? 'border-danger/70' : 'border-transparent')}>
              <span aria-hidden className="text-16 font-bold text-[rgb(var(--k-muted))]">
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
                placeholder="Amount"
                className="num h-full min-w-0 flex-1 bg-transparent text-16 font-bold text-ink outline-none placeholder:font-semibold placeholder:text-[rgb(var(--k-dim))]"
              />
            </div>
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={amount === p}
                onClick={() => setRaw(String(p))}
                className={cn(
                  'num h-[48px] w-[52px] shrink-0 rounded-[12px] border-2 text-14 font-bold transition-colors',
                  amount === p ? 'border-accent bg-[#2A1D4D] text-ink' : 'border-transparent bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink',
                )}
              >
                ${p}
              </button>
            ))}
          </div>
          <p id={ids.help} aria-live="polite" className={cn('flex min-h-[20px] items-center gap-1 text-12 font-semibold', showProblem ? 'text-[#FF8FA3]' : 'text-[rgb(var(--k-dim))]')}>
            {showProblem ? (
              <>
                <WarningCircle weight="fill" className="h-4 w-4 shrink-0" aria-hidden />
                {q.problem}
              </>
            ) : (
              `Credited as USDT, 1 USD is 1 USDT`
            )}
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPromoState(promo.trim() ? 'added' : 'blank');
            }}
          >
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[12px] bg-[rgb(var(--k-item))] px-3 focus-within:ring-2 focus-within:ring-accent">
              <Ticket weight="fill" className="h-5 w-5 shrink-0 text-[rgb(var(--k-dim))]" aria-hidden />
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
                className="h-full min-w-0 flex-1 bg-transparent text-14 font-bold uppercase tracking-[0.04em] text-ink outline-none placeholder:normal-case placeholder:tracking-normal placeholder:font-semibold placeholder:text-[rgb(var(--k-dim))]"
              />
              {promoState === 'added' && <CheckCircle weight="fill" className="h-5 w-5 shrink-0 text-win" aria-label="Code added" />}
            </div>
            <KitButton type="submit" tone="purple" size="sm" className="h-11 px-[20px]">
              Apply
            </KitButton>
          </form>
          <p role="status" className="sr-only">
            {promoState === 'added' ? `Code ${promo.trim()} added. It is checked at checkout.` : promoState === 'blank' ? 'Type a promo code first.' : ''}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-3 border-l border-ink/10 pl-6">
          <dl className="flex flex-col gap-2">
            <Leader strong label="You pay" value={q.problem && !(amount > 0) ? '0.00' : `${formatAmount(q.pay, q.payDigits)} ${q.payUnit}`} />
            <Leader label="You get" value={`${formatAmount(amount > 0 ? q.get : 0)} USDT`} />
            <Leader label={q.feeLabel} value={`${formatAmount(q.fee)} USD`} />
          </dl>
          <KitButton tone="gold" size="lg" onClick={checkout} className="h-[48px] w-full rounded-[12px]">
            <CheckCircle weight="fill" className="h-5 w-5" aria-hidden />
            Checkout
          </KitButton>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import * as RG from '@radix-ui/react-radio-group';
import { CheckCircle, Gift, MagnifyingGlass, Warning, WarningCircle, XCircle } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { CopyField } from '../../components/ui/CopyField';
import { Field } from '../../components/ui/Field';
import { Message } from '../../components/ui/Message';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatAmount } from '../../lib/format';
import { useWallet } from '../wallet/store';
import { OFFERS, USED_CODES, VALID_CODES, largeOffers, type GiftFilter, type GiftOffer } from './giftData';
import { recordMove, readQuery, useViewSwitch, wait } from './shared';

// Gift cards, Figma 373:802. A grid of partner offers with filters and a Redeem action that reveals
// the code, and a field for a code the player already has. The wallet's Gift card tab mounts this.
//
// URL switches for screenshots.
//   ?state=loading|error|empty|large   the grid
//   ?code=LAGOON25&check=1   fills the code field, and checks it on load
//   LAGOON25 and WELCOME10 are valid, SUMMER50 is already used, anything else is not recognised

const PAGE = 9;
const FILTERS: { value: GiftFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'popular', label: 'Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'recent', label: 'Recent' },
];

// Codes used this session. Lives outside the component so a tab switch does not hand one back.
const used = new Set(USED_CODES);

type CodeResult = { kind: 'valid'; value: number; balanceAfter: number } | { kind: 'used' } | { kind: 'invalid' } | null;

function RedeemCode() {
  const wallet = useWallet();
  const [code, setCode] = useState(() => readQuery().get('code') ?? '');
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<CodeResult>(null);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function check() {
    const value = code.replace(/\s+/g, '').toUpperCase();
    setResult(null);
    if (!value) return setError('Enter the code first. It is on your gift card or in the email we sent.');
    if (!/^[A-Z0-9-]{6,20}$/.test(value)) return setError('A code is 6 to 20 letters and numbers. Copy it again, all of it.');
    setError(undefined);
    setBusy(true);
    await wait(800);
    if (!alive.current) return;
    setBusy(false);
    if (used.has(value)) return setResult({ kind: 'used' });
    const worth = VALID_CODES[value];
    if (!worth) return setResult({ kind: 'invalid' });
    used.add(value);
    recordMove(wallet, { id: `GC-${value}`, direction: 'deposit', label: 'Gift code', icon: 'gift', amount: worth, status: 'completed', reference: value });
    setResult({ kind: 'valid', value: worth, balanceAfter: Math.round((wallet.balance + worth) * 100) / 100 });
  }

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || readQuery().get('check') !== '1') return;
    autoRan.current = true;
    void check();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-labelledby="code-title" className="flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6">
      <div className="flex flex-col gap-1">
        <h2 id="code-title" className="font-display text-24 font-semibold text-ink">
          Redeem a code you have
        </h2>
        <p className="text-16 text-ink2">Got a gift code from us or a partner? Enter it and the credit goes to your balance.</p>
      </div>
      <form
        className="flex items-start gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void check();
        }}
      >
        <Field
          label="Gift code"
          autoComplete="off"
          spellCheck={false}
          placeholder="For example LAGOON25"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(undefined);
            setResult(null);
          }}
          error={error}
          hint={!error ? 'Codes are not case sensitive. Spaces are ignored.' : undefined}
          className="max-w-md flex-1 [&_input]:font-mono [&_input]:uppercase [&_input]:placeholder:normal-case"
        />
        <Button size="lg" type="submit" loading={busy} className="mt-[calc(var(--bl-sp-24)+var(--bl-sp-4))]">
          Redeem code
        </Button>
      </form>
      <div role="status" aria-live="polite" className="empty:hidden">
        {result?.kind === 'valid' && (
          <p className="flex items-start gap-2 text-16 text-ink">
            <CheckCircle weight="fill" className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <span>
              Code accepted. {formatAmount(result.value)} USDT is in your balance, which is now {formatAmount(result.balanceAfter)} USDT.
            </span>
          </p>
        )}
        {result?.kind === 'used' && (
          <p className="flex items-start gap-2 text-16 text-ink">
            <Warning weight="fill" className="mt-0.5 h-5 w-5 shrink-0 text-pending" aria-hidden />
            <span>This code was already used, and a code works once. If you did not use it, contact support with the code.</span>
          </p>
        )}
        {result?.kind === 'invalid' && (
          <p className="flex items-start gap-2 text-16 text-ink">
            <XCircle weight="fill" className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
            <span>We do not recognise this code. Check it for typos, then try again.</span>
          </p>
        )}
      </div>
    </section>
  );
}

function Offer({ offer, onRedeemed }: { offer: GiftOffer; onRedeemed: (id: string) => void }) {
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function redeem() {
    setBusy(true);
    await wait(600);
    if (!alive.current) return;
    setBusy(false);
    setRevealed(true);
    onRedeemed(offer.id);
  }

  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tonal font-display text-20 font-bold uppercase text-ink">
          {offer.brand[0]}
        </span>
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-18 font-semibold text-ink" title={offer.brand}>{offer.brand}</h3>
          <span className="truncate text-14 text-ink3" title={offer.domain}>{offer.domain}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="num text-20 font-semibold text-ink">{offer.value}</p>
        <p className="text-14 text-ink2">{offer.blurb}</p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <span className="text-14 text-ink3">{offer.ends}</span>
        {revealed ? (
          <>
            <CopyField label="Code" value={offer.code} />
            <p className="flex items-start gap-2 text-14 text-ink2">
              <CheckCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              Redeemed. Copy this code at {offer.domain}.
            </p>
          </>
        ) : offer.ended ? (
          <Button variant="secondary" disabled aria-label={`${offer.brand} offer has ended`}>
            Offer ended
          </Button>
        ) : (
          <Button variant="secondary" onClick={redeem} loading={busy} aria-label={`Redeem ${offer.brand} gift card`}>
            Redeem gift
          </Button>
        )}
      </div>
    </li>
  );
}

export function GiftCardsPanel() {
  const view = useViewSwitch();
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>(view === 'loading' ? 'loading' : view === 'error' ? 'error' : 'ready');
  const [filter, setFilter] = useState<GiftFilter>('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [redeemed, setRedeemed] = useState(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const offers = useMemo(() => (view === 'empty' ? [] : view === 'large' ? largeOffers() : OFFERS), [view]);
  const rows = offers.filter((o) => (filter === 'all' || o.tags.includes(filter)) && `${o.brand} ${o.domain}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = rows.slice(0, shown);
  const filtering = filter !== 'all' || query.trim() !== '';

  const retry = async () => {
    setStatus('loading');
    await wait(900);
    if (alive.current) setStatus('ready');
  };

  let body: React.ReactNode;
  if (status === 'error') {
    body = (
      <div className="rounded-2xl border border-line bg-panel">
        <Message
          icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
          title="We could not load the gift cards"
          body="Nothing was redeemed. Check your connection, then try again."
          action={
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (status === 'loading') {
    body = (
      <ul className="grid grid-cols-3 gap-4" aria-busy="true" aria-label="Loading gift cards">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-10" />
          </li>
        ))}
      </ul>
    );
  } else if (offers.length === 0) {
    body = (
      <div className="rounded-2xl border border-line bg-panel">
        <Message
          icon={<Gift weight="fill" className="h-10 w-10 text-ink3" aria-hidden />}
          title="No gift cards right now"
          body="New partner offers land every week. Check back soon, or redeem a code you already have above."
        />
      </div>
    );
  } else if (rows.length === 0) {
    body = (
      <div className="rounded-2xl border border-line bg-panel">
        <Message
          icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
          title="No gift cards match"
          body="Try another filter, or clear the search to see every offer."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
            >
              Clear filters
            </Button>
          }
        />
      </div>
    );
  } else {
    body = (
      <>
        <ul className="grid grid-cols-3 items-stretch gap-4">
          {visible.map((o) => (
            <Offer key={o.id} offer={o} onRedeemed={() => setRedeemed((n) => n + 1)} />
          ))}
        </ul>
        {rows.length > PAGE && (
          <div className="flex items-center justify-between gap-4">
            <p className="num text-14 text-ink2" aria-live="polite">
              Showing {Math.min(shown, rows.length)} of {rows.length}
            </p>
            {shown < rows.length && (
              <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
                Show {Math.min(PAGE, rows.length - shown)} more
              </Button>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <RedeemCode />
      <section aria-labelledby="gifts-title" className="flex flex-col gap-4">
        <SectionHeader
          id="gifts-title"
          title="Gift cards"
          action={
            <div className="flex items-end gap-3">
              <Field
                label="Search gift cards"
                placeholder="Search by brand"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE);
                }}
                prefix={<MagnifyingGlass className="h-5 w-5" aria-hidden />}
                className="w-[var(--bl-sidebar-open)] [&_label]:sr-only"
              />
              <RG.Root
                value={filter}
                onValueChange={(v) => {
                  setFilter(v as GiftFilter);
                  setShown(PAGE);
                }}
                aria-label="Show"
                className="flex h-11 rounded-lg border border-line bg-sunken p-1"
              >
                {FILTERS.map((f) => (
                  <RG.Item
                    key={f.value}
                    value={f.value}
                    className="h-8 rounded px-3 text-14 font-medium text-ink2 transition-colors hover:text-ink data-[state=checked]:bg-raised data-[state=checked]:text-ink"
                  >
                    {f.label}
                  </RG.Item>
                ))}
              </RG.Root>
            </div>
          }
        />
        <p className="text-14 text-ink2" aria-live="polite">
          {status === 'ready' && offers.length > 0 ? `${rows.length} ${rows.length === 1 ? 'gift card' : 'gift cards'}${filtering ? ' match' : ''}. ` : ''}
          {redeemed > 0 ? `${redeemed} redeemed this visit.` : ''}
        </p>
        {body}
      </section>
    </div>
  );
}

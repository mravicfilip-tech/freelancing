import { forwardRef, useMemo, useState, type ReactNode } from 'react';
import * as S from '@radix-ui/react-select';
import { CaretDown, CaretRight, Check, Cherries, Coins, Fish, Lightning, MagnifyingGlass, Sparkle, WarningCircle } from '@phosphor-icons/react';
import type { CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { Skeleton } from '../../../components/ui/Skeleton';
import { KitButton } from '../kit/parts';
import { SearchBox } from '../kit/TopParts';
import { CATEGORY_NAME, ORDERED, cardName, type Filter } from './shared';
import { Heading } from './Carousel';

// Grimdrop's category bar and trending grid. The picked room is the purple pill, the others are
// icon tabs. Providers and search sit on the right. Each game a card with the cover, its name in
// capitals and its category under it.

const TABS: {
  value: Filter;
  label: string;
  icon?: ReactNode;
  tint?: string;
}[] = [
  { value: 'all', label: 'All games' },
  {
    value: 'slots',
    label: 'Slots',
    icon: <Cherries weight="fill" />,
    tint: 'text-[#F06595]',
  },
  {
    value: 'megaways',
    label: 'Megaways',
    icon: <Lightning weight="fill" />,
    tint: 'text-[#4DABF7]',
  },
  {
    value: 'hold-and-win',
    label: 'Hold and win',
    icon: <Coins weight="fill" />,
    tint: 'text-gold',
  },
  {
    value: 'fish',
    label: 'Fish',
    icon: <Fish weight="fill" />,
    tint: 'text-[#3BC9DB]',
  },
  {
    value: 'new',
    label: 'New',
    icon: <Sparkle weight="fill" />,
    tint: 'text-[#A9E34B]',
  },
];

const PROVIDERS = ['all', ...Array.from(new Set(ORDERED.map((g) => g.provider))).sort()];

function ProviderSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <S.Root value={value} onValueChange={onChange}>
      <S.Trigger
        aria-label="Provider"
        className="flex h-[52px] min-w-[150px] items-center justify-between gap-3 rounded-[14px] border border-ink/10 bg-[rgb(var(--k-item))] px-4 text-16 font-bold text-ink hover:bg-[rgb(var(--k-item-hover))] data-[state=open]:border-[#B47CFF]/60"
      >
        <span className="max-w-[140px] truncate">{value === 'all' ? 'Providers' : value}</span>
        <S.Icon>
          <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--k-muted))]" aria-hidden />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={6}
          align="end"
          className="z-30 min-w-[220px] overflow-hidden rounded-[14px] border border-ink/10 bg-[rgb(var(--k-item))] p-1 shadow-[0_16px_40px_rgb(0_0_0/0.45)]"
        >
          <S.Viewport>
            {PROVIDERS.map((p) => (
              <S.Item
                key={p}
                value={p}
                className="flex h-10 cursor-pointer select-none items-center justify-between gap-3 rounded-[10px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-[rgb(var(--k-item-hover))]"
              >
                <S.ItemText>{p === 'all' ? 'All providers' : p}</S.ItemText>
                <S.ItemIndicator>
                  <Check weight="bold" className="h-4 w-4 text-[#C9A2FF]" aria-hidden />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}

function GameCard({ game, onPlay }: { game: CatalogueGame; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play ${game.name}, ${game.provider}`}
      className="group flex w-full flex-col gap-3 rounded-[18px] border border-ink/[0.06] bg-[rgb(var(--k-panel))] p-2 pb-3 text-center transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-[#B47CFF]/60"
    >
      <span className="block aspect-[3/4] w-full overflow-hidden rounded-[12px] bg-[rgb(var(--k-item))]">
        <img src={game.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </span>
      <span className="flex w-full flex-col gap-0.5 px-1">
        <span className="flex h-9 items-center justify-center">
          <span className="line-clamp-2 font-display text-14 font-bold uppercase leading-[18px] text-ink">{cardName(game)}</span>
        </span>
        <span className="truncate text-12 font-semibold text-[rgb(var(--k-muted))]">{CATEGORY_NAME[game.category]}</span>
      </span>
    </button>
  );
}

type Props = {
  filter: Filter;
  onFilter: (f: Filter) => void;
  query: string;
  onQuery: (q: string) => void;
  state: string | null;
  failed: boolean;
  onRetry: () => void;
  onPlay: (g: CatalogueGame) => void;
};

export const GameFinder = forwardRef<HTMLElement, Props>(function GameFinder({ filter, onFilter, query, onQuery, state, failed, onRetry, onPlay }, ref) {
  const [provider, setProvider] = useState('all');
  const [all, setAll] = useState(false);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERED.filter(
      (g) => (filter === 'all' || g.category === filter) && (provider === 'all' || g.provider === provider) && (!q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)),
    );
  }, [filter, provider, query]);
  const shown = all ? list : list.slice(0, 18);
  const title = filter === 'all' ? 'Trending games' : TABS.find((t) => t.value === filter)!.label;

  return (
    <section ref={ref} aria-labelledby="v2-games" className="flex scroll-mt-[100px] flex-col gap-6">
      <div className="flex items-center gap-3">
        <div role="radiogroup" aria-label="Game room" className="k-no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {TABS.map((t) => {
            const on = filter === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onFilter(t.value)}
                className={cn(
                  'flex h-[52px] shrink-0 items-center gap-2 rounded-[14px] border px-4 font-display text-14 font-bold uppercase tracking-[0.02em] transition-colors',
                  on ? 'k-btn-purple border-[#C9A2FF]/50 px-6 text-ink' : 'border-transparent text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item))] hover:text-ink',
                )}
              >
                {t.icon && (
                  <span
                    className={cn('flex h-8 w-8 items-center justify-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]', on ? 'bg-black/20 text-ink' : cn('bg-[rgb(var(--k-item))]', t.tint))}
                  >
                    {t.icon}
                  </span>
                )}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Heading id="v2-games">{title}</Heading>
        <span className="mr-auto" />
        <ProviderSelect value={provider} onChange={setProvider} />
        <SearchBox id="v2-search" value={query} onChange={onQuery} placeholder="Search games" className="w-[240px] shrink-0 border border-ink/10" />
        {list.length > 18 && (
          <button
            type="button"
            onClick={() => setAll((a) => !a)}
            className="flex h-[52px] items-center gap-2 rounded-[14px] border border-ink/10 bg-[rgb(var(--k-item))] px-4 text-14 font-bold text-ink hover:bg-[rgb(var(--k-item-hover))]"
          >
            {all ? 'Show fewer' : `View all ${list.length}`}
            <CaretRight weight="bold" className={cn('h-4 w-4 text-[rgb(var(--k-muted))] transition-transform', all && '-rotate-90')} aria-hidden />
          </button>
        )}
      </div>

      {state === 'loading' ? (
        <ul className="grid grid-cols-6 gap-3 w1600:grid-cols-7 w1920:grid-cols-9">
          {Array.from({ length: 12 }, (_, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-[18px] bg-[rgb(var(--k-panel))] p-2 pb-3">
              <Skeleton className="aspect-[3/4] w-full rounded-[12px]" />
              <Skeleton className="mx-auto h-4 w-3/4 rounded" />
            </li>
          ))}
        </ul>
      ) : failed ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] bg-[rgb(var(--k-panel))] px-6 py-16 text-center">
          <WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />
          <p className="text-18 font-bold text-ink">We could not load the games</p>
          <p className="text-16 text-[rgb(var(--k-muted))]">Your balance and bets are safe. Try again in a moment.</p>
          <KitButton tone="purple" onClick={onRetry} className="mt-2">
            Try again
          </KitButton>
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] bg-[rgb(var(--k-panel))] px-6 py-16 text-center">
          <MagnifyingGlass weight="bold" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />
          <p className="text-18 font-bold text-ink">{query.trim() ? `No games match "${query.trim()}"` : 'No games in this room from that provider'}</p>
          <p className="text-16 text-[rgb(var(--k-muted))]">Check the spelling, or search by provider, such as Pragmatic Play.</p>
          <KitButton
            tone="purple"
            className="mt-2"
            onClick={() => {
              onQuery('');
              setProvider('all');
            }}
          >
            Clear the search
          </KitButton>
        </div>
      ) : (
        <ul className="grid grid-cols-6 gap-3 w1600:grid-cols-7 w1920:grid-cols-9">
          {shown.map((g) => (
            <li key={g.id}>
              <GameCard game={g} onPlay={() => onPlay(g)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});

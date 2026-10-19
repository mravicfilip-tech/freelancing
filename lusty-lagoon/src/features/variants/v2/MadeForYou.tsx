import { useRef, useState } from 'react';
import { CaretLeft, CaretRight, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CATEGORIES, gameById, type CatalogueGame } from '../../../data/games';
import { formatPoints } from '../../../lib/format';

// Large game cards. The cover's own art, blurred, is the card's backdrop, and the sharp cover
// stands in front of it. Players now are mock values in the shape a game server returns.
const PICKS: { id: string; players: number }[] = [
  { id: 'sweet-bonanza', players: 1204 },
  { id: 'starlight-princess', players: 876 },
  { id: 'billy-bob-boom', players: 412 },
  { id: 'capypark', players: 338 },
  { id: 'scarab-wheel', players: 291 },
  { id: 'lucky-dwarfs', players: 187 },
];

function Arrow({ dir, onClick, disabled }: { dir: 'prev' | 'next'; onClick: () => void; disabled: boolean }) {
  const Icon = dir === 'prev' ? CaretLeft : CaretRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous, Made for you' : 'Next, Made for you'}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-ink transition-colors hover:border-accent disabled:opacity-50 disabled:hover:border-line"
    >
      <Icon weight="bold" className="h-5 w-5" aria-hidden />
    </button>
  );
}

export function MadeForYou({ loading, failed, onRetry, onPlay }: { loading: boolean; failed: boolean; onRetry: () => void; onPlay: (g: CatalogueGame) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 4);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 4);
  };
  const move = (d: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: d * (el.clientWidth + 16), behavior: 'smooth' });
  };

  return (
    <section aria-labelledby="mfy-title" className="mt-16 min-w-0">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="mfy-title" className="font-display text-28 font-bold leading-[1.2] text-ink">
            Made for you
          </h2>
          <p className="mt-1 text-14 text-ink2">Picked from the slots you played this week.</p>
        </div>
        {!loading && !failed && (
          <div className="flex gap-2">
            <Arrow dir="prev" onClick={() => move(-1)} disabled={atStart} />
            <Arrow dir="next" onClick={() => move(1)} disabled={atEnd} />
          </div>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[264px] w-full rounded-2xl" />
            ))}
          </div>
        ) : failed ? (
          <div className="rounded-2xl border border-line bg-panel">
            <Message
              className="py-12"
              icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
              title="We could not load your picks"
              body="Your balance and wagers are safe. Try again in a moment."
              action={
                <Button variant="secondary" onClick={onRetry}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : (
          <ul ref={ref} onScroll={update} className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none]">
            {PICKS.map((p) => {
              const g = gameById(p.id)!;
              return (
                <li key={g.id} className="relative h-[264px] shrink-0 basis-[calc((100%-32px)/3)] snap-start overflow-hidden rounded-2xl border border-line bg-sunken">
                  <img aria-hidden src={g.image} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl" />
                  <div aria-hidden className="absolute inset-0 bg-page/65" />
                  <div className="relative flex h-full items-center gap-6 p-4">
                    <button
                      type="button"
                      onClick={() => onPlay(g)}
                      aria-label={`Open ${g.name}`}
                      className="ll-tile h-full shrink-0 p-0.5 transition-colors duration-150 hover:border-gold focus-visible:border-gold"
                      style={{ aspectRatio: '134 / 200' }}
                    >
                      <img src={g.image} alt="" className="h-full w-full rounded-md object-cover" />
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <span className="mb-2 rounded bg-page/80 px-2 py-0.5 text-12 font-semibold text-ink">{g.tag ?? CATEGORIES.find((c) => c.value === g.category)?.label}</span>
                      <h3 className="line-clamp-2 font-display text-24 font-bold leading-[1.15] text-ink">{g.name}</h3>
                      <p className="mt-1 text-14 text-ink2">{g.provider}</p>
                      <p className="num mt-3 text-14 text-ink">
                        {g.rtp}% return <span className="text-ink3">to player</span>
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-14 text-ink">
                        <span aria-hidden className="h-[8px] w-[8px] shrink-0 rounded-full bg-success" />
                        <span className="num">{formatPoints(p.players)}</span> playing
                      </p>
                      <Button variant="secondary" size="md" className="mt-4" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`}>
                        Play
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { cn } from '../../../lib/cn';
import { ROOMS } from '../shared/data';
import type { Category } from '../../../data/games';
import { Live } from './ui';

// Four vivid category tiles after Turbo Bet. One hue each in two close stops, a lighter burst behind
// big 3D art, the title in the page's one heading style and a live count. Hover lights the edge and
// scales the art inside. Round 7 sets the titles in Bai Jamjuree 700, sentence case (note 2), and puts
// the title and the count on one 16px inset from the tile edge (note 4).

const players = (c: Category) => ROOMS.find((r) => r.id === c)?.players ?? 0;

type Tile = { hue: 'purple' | 'blue' | 'orange' | 'green'; title: string; count: number; countLabel: string; art: string; artClass: string; filter?: Category; to?: string };

const TILES: Tile[] = [
  { hue: 'purple', title: 'Slots', count: players('slots'), countLabel: 'playing slots', art: '/art/landing/slot-machine.webp', artClass: 'bottom-[-6px] right-3 h-[180px] w1920:h-[212px] w1920:right-6', filter: 'slots' },
  { hue: 'blue', title: 'Megaways', count: players('megaways'), countLabel: 'playing megaways', art: '/art/kit/neon-reels.webp', artClass: 'bottom-[-14px] right-[-14px] h-[176px] mix-blend-screen [mask-image:radial-gradient(closest-side,#000_62%,transparent)] w1920:h-[212px] w1920:right-0', filter: 'megaways' },
  { hue: 'orange', title: 'Hold & win', count: players('hold-and-win'), countLabel: 'playing hold and win', art: '/art/lobby/giveaway-chest.webp', artClass: 'bottom-[-10px] right-[-8px] h-[150px] w1920:h-[184px] w1920:right-2', filter: 'hold-and-win' },
  { hue: 'green', title: 'Refer', count: 12, countLabel: 'friends joined this week', art: '/art/money/refer-megaphone.webp', artClass: 'bottom-0 right-[-6px] h-[196px] w1920:h-[226px] w1920:right-4', to: '/refer' },
];

export function Tiles({ onPick }: { onPick: (c: Category) => void }) {
  return (
    <ul aria-label="Categories" className="grid grid-cols-4 gap-4">
      {TILES.map((t) => {
        const cls = cn('n1-tile n1-ring group block h-[208px] overflow-hidden rounded-[16px] text-left w1920:h-[240px]', `n1-tile-${t.hue}`);
        const inner = (
          <>
            <span aria-hidden className="n1-mark absolute right-0 top-0 -z-10 h-full w-2/3" />
            <span className="absolute left-4 top-4 z-10 font-display text-28 font-bold leading-[28px] tracking-[-0.01em] text-ink">{t.title}</span>
            <span className="absolute bottom-4 left-4 z-10 flex h-8 items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 text-14 font-extrabold text-ink backdrop-blur-sm">
              <Live />
              <span className="num">{t.count.toLocaleString('en-US')}</span>
              <span className="sr-only">{t.countLabel}</span>
            </span>
            <img src={t.art} alt="" className={cn('n1-zoom pointer-events-none absolute w-auto max-w-none object-contain', t.artClass)} />
          </>
        );
        return (
          <li key={t.title}>
            {t.to ? (
              <Link to={t.to} className={cls} aria-label={`Refer a friend, ${t.count} ${t.countLabel}`}>
                {inner}
              </Link>
            ) : (
              <button type="button" onClick={() => onPick(t.filter!)} className={cn(cls, 'w-full')} aria-label={`${t.title} games, ${t.count} ${t.countLabel}`}>
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

import { useState } from 'react';
import * as D from '@radix-ui/react-dialog';
import { Play, X } from '@phosphor-icons/react';
import { CATEGORIES, type CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { ROOM_TEXT } from './data';
import { Key } from './ui';

// The lobby's game dialog in the floor's shape. The same behaviour, Escape and the close square
// close it and focus returns to the cover that opened it, Play and Try the demo say where the game
// would launch. A clipped corner panel, small grey caps labels over bold tabular values, and the
// one orange key.
export function GameDialog({ game, onClose }: { game: CatalogueGame | null; onClose: () => void }) {
  const [opened, setOpened] = useState<'play' | 'demo' | null>(null);
  const room = game ? CATEGORIES.find((c) => c.value === game.category)?.label ?? '' : '';
  return (
    <D.Root
      open={!!game}
      onOpenChange={(o) => {
        if (!o) {
          setOpened(null);
          onClose();
        }
      }}
    >
      {game && (
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-40 bg-[#0E0D14]/80 backdrop-blur-[4px]" />
          <D.Content className="fixed left-1/2 top-1/2 z-40 w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 bg-transparent outline-none">
            <div className="v4-cut flex flex-col gap-6 bg-[rgb(var(--v4-panel))] p-6 [--cut:20px]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className={cn('text-12 font-bold uppercase tracking-[0.08em]', ROOM_TEXT[game.category])}>{room}</p>
                  <D.Title className="font-display text-28 font-bold uppercase leading-8 text-ink">{game.name}</D.Title>
                  <D.Description className="text-14 font-medium text-[rgb(var(--v4-muted))]">{game.provider}</D.Description>
                </div>
                <D.Close
                  aria-label="Close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-white/[0.07] bg-[rgb(var(--v4-raised))] text-[rgb(var(--v4-muted))] outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
                >
                  <X weight="bold" className="h-5 w-5" aria-hidden />
                </D.Close>
              </div>
              <div className="flex gap-6">
                <img
                  src={game.image}
                  alt=""
                  className={cn('shrink-0 rounded-[4px] border border-white/[0.07] object-cover', game.wideOnly ? 'aspect-[3/2] w-[260px]' : 'aspect-[3/4] w-[152px]')}
                />
                <dl className="grid flex-1 grid-cols-2 content-start gap-[1px] self-start overflow-hidden rounded-[4px] border border-white/[0.05] bg-white/[0.05]">
                  {[
                    ['Return to player', `${game.rtp}%`],
                    ['Volatility', game.volatility],
                    ['Room', room],
                    ['Provider', game.provider],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-1 bg-[rgb(var(--v4-well))] px-4 py-3">
                      <dt className="text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--v4-label))]">{k}</dt>
                      <dd className="num truncate text-16 font-bold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {opened && (
                <p role="status" className="rounded-[4px] border border-white/[0.07] bg-[rgb(var(--v4-well))] p-4 text-14 text-[rgb(var(--v4-muted))]">
                  {game.name} {opened === 'demo' ? 'demo ' : ''}opens on the partner platform. Launching games is not part of this prototype.
                </p>
              )}
              <div className="flex items-center gap-4">
                <Key tone="orange" onClick={() => setOpened('play')}>
                  <Play weight="fill" className="h-5 w-5" aria-hidden />
                  Play
                </Key>
                <Key tone="quiet" onClick={() => setOpened('demo')}>
                  Try the demo
                </Key>
              </div>
            </div>
          </D.Content>
        </D.Portal>
      )}
    </D.Root>
  );
}

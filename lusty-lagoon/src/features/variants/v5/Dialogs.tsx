import { useState, type ReactNode } from 'react';
import * as D from '@radix-ui/react-dialog';
import { Play, X } from '@phosphor-icons/react';
import { CATEGORIES, type CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { Key } from './ui';

// The vault's dialogs. The shared Dialog's behaviour, Escape and the close button close it and focus
// goes back to what opened it, on a black scrim with a frosted glass sheet, so opening one keeps the
// page black. The game sheet is the lobby GameDialog rebuilt in glass, the same rows and the same
// Play and Try the demo outcomes.

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1328]';

export function GlassDialog({ open, onOpenChange, title, description, children, className }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="gv-show fixed inset-0 z-40 bg-[#07060B]/75 backdrop-blur-[6px]" />
        <D.Content
          className={cn(
            'gv-show fixed left-1/2 top-1/2 z-40 flex w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 rounded-3xl border border-white/[0.06] bg-[#1A1328]/95 p-6 shadow-[0_32px_80px_rgb(0_0_0/0.3)] outline-none backdrop-blur-[24px]',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <D.Title className="text-28 font-semibold tracking-[-0.02em] text-white">{title}</D.Title>
              {description ? <D.Description className="text-14 text-[rgb(var(--gv-ink-2))]">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            <D.Close aria-label="Close" data-icon="pop" className={cn('gv-pill k-hov-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--gv-ink-2))] hover:text-white', FOCUS)}>
              <X weight="bold" className="h-4 w-4" aria-hidden />
            </D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** The lobby GameDialog in glass. A cover, the game's facts, Play and Try the demo. */
export function GameSheet({ game, onClose }: { game: CatalogueGame | null; onClose: () => void }) {
  const [opened, setOpened] = useState<'play' | 'demo' | null>(null);
  return (
    <GlassDialog
      open={!!game}
      onOpenChange={(o) => {
        if (!o) {
          setOpened(null);
          onClose();
        }
      }}
      title={game?.name ?? ''}
      description={game?.provider}
    >
      {game && (
        <>
          <div className="flex gap-6">
            <span className={cn('relative shrink-0 overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]', game.wideOnly ? 'aspect-[3/2] w-1/2' : 'aspect-[3/4] w-[152px]')}>
              <img src={game.image} alt="" className="h-full w-full object-cover" />
            </span>
            <dl className="flex flex-1 flex-col">
              {[
                ['Return to player', `${game.rtp}%`],
                ['Volatility', game.volatility],
                ['Category', CATEGORIES.find((c) => c.value === game.category)?.label ?? ''],
              ].map(([k, v]) => (
                <div key={k} className="gv-rule flex h-11 items-center justify-between gap-4 border-b">
                  <dt className="text-14 text-[rgb(var(--gv-ink-2))]">{k}</dt>
                  <dd className="num text-14 font-semibold capitalize text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {opened && (
            <p role="status" className="gv-well rounded-2xl p-4 text-14 text-[rgb(var(--gv-ink-2))]">
              {game.name} {opened === 'demo' ? 'demo ' : ''}opens on the partner platform. Launching games is not part of this prototype.
            </p>
          )}
          <div className="flex gap-3">
            <Key onClick={() => setOpened('play')} className="h-[48px] px-8 text-16 focus-visible:ring-offset-[#1A1328]">
              <Play weight="fill" className="h-4 w-4" aria-hidden />
              Play
            </Key>
            <button type="button" onClick={() => setOpened('demo')} className={cn('gv-pill inline-flex h-[48px] items-center rounded-full px-6 text-16 font-semibold text-white', FOCUS)}>
              Try the demo
            </button>
          </div>
        </>
      )}
    </GlassDialog>
  );
}

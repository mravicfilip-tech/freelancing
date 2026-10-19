import { ArrowDownLeft, ArrowUpRight, Gift, ShieldWarning, Trophy, XCircle } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';
import type { NotificationItem, NotificationKind } from './notificationsData';
import { whenOf } from './notificationsStore';

// Flat icon chips, one per kind. No stock 3D art, per the taste log.
const LOOK: Record<NotificationKind, { Icon: Icon; tone: string }> = {
  deposit: { Icon: ArrowDownLeft, tone: 'bg-success/10 text-success' },
  withdrawal: { Icon: ArrowUpRight, tone: 'bg-tonal text-ink' },
  declined: { Icon: XCircle, tone: 'bg-danger/10 text-danger' },
  reward: { Icon: Trophy, tone: 'bg-pending/10 text-pending' },
  giveaway: { Icon: Gift, tone: 'bg-tonal text-ink' },
  security: { Icon: ShieldWarning, tone: 'bg-pending/10 text-pending' },
};

export function NotificationRow({ item, onOpen, compact }: { item: NotificationItem; onOpen: (item: NotificationItem) => void; compact?: boolean }) {
  const { Icon: Glyph, tone } = LOOK[item.kind];
  const when = whenOf(item.minutesAgo);
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-tonal/50',
        item.read ? 'bg-transparent' : 'bg-tonal/30',
      )}
    >
      <span aria-hidden className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tone)}>
        <Glyph weight="bold" className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn('break-words text-16 text-ink', item.read ? 'font-medium' : 'font-semibold')}>
          {!item.read && <span className="sr-only">Unread. </span>}
          {item.title}
        </span>
        <span className={cn('break-words text-14 text-ink2', compact && 'line-clamp-3')}>
          {item.body.map((part, i) =>
            typeof part === 'string' ? (
              <span key={i}>{part}</span>
            ) : (
              <span key={i} className="num font-semibold text-ink">
                {part.b}
              </span>
            ),
          )}
        </span>
        <time dateTime={when.iso} title={when.full} className="num text-14 text-ink3">
          {when.label}
        </time>
      </span>
      {!item.read && <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold" />}
    </button>
  );
}

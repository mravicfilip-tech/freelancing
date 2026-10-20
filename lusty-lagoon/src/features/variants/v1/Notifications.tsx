import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowCircleDown, ArrowCircleUp, Bell, CaretRight, Checks, Gift, ShieldWarning, Trophy, WarningCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { notificationActions, useNotifications, whenOf } from '../../account/notificationsStore';
import { useDemoState } from '../../account/demoState';
import type { NotificationItem, NotificationKind } from '../../account/notificationsData';
import { Key, NMessage } from './ui';

// The notifications panel in the Neon arcade's own surfaces, round 8 (note 12). The same store, data
// and behaviour as the shared panel in features/account, so read state still carries to the full page,
// drawn the way the v1 sidebar draws its account group. Filled colour glyphs in tinted squares, rows
// that light on hover, unread rows on a faint purple with a dot in the accent purple, the chat
// header's type. It renders
// the content only, so the top bar's popover and a phone sheet can both host it. Host it in a flex
// column with a height cap, and the list scrolls inside it on the page's purple scrollbar.
// ?state=loading|error|empty|large reaches the other states.

const SHOWN = 8;

/** One glyph and one hue per kind. No yellow, per the taste log of 19 October. */
const LOOK: Record<NotificationKind, { icon: ReactNode; hue: string }> = {
  deposit: { icon: <ArrowCircleDown weight="fill" />, hue: '61 220 132' },
  withdrawal: { icon: <ArrowCircleUp weight="fill" />, hue: '92 200 255' },
  declined: { icon: <XCircle weight="fill" />, hue: '255 122 136' },
  reward: { icon: <Trophy weight="fill" />, hue: '255 155 72' },
  giveaway: { icon: <Gift weight="fill" />, hue: '190 166 255' },
  security: { icon: <ShieldWarning weight="fill" />, hue: '255 143 194' },
};

function Row({ item, onOpen }: { item: NotificationItem; onOpen: (item: NotificationItem) => void }) {
  const { icon, hue } = LOOK[item.kind];
  const when = whenOf(item.minutesAgo);
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn('n1-ring n1-note flex w-full items-start gap-3 rounded-[12px] p-3 text-left', !item.read && 'n1-note-new')}
    >
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] [&>svg]:h-5 [&>svg]:w-5" style={{ color: `rgb(${hue})`, background: `rgb(${hue} / 0.14)` }}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn('break-words text-14 leading-5 text-ink', item.read ? 'font-semibold' : 'font-extrabold')}>
          {!item.read && <span className="sr-only">Unread. </span>}
          {item.title}
        </span>
        <span className="line-clamp-3 break-words text-14 leading-5 text-[rgb(var(--n-muted))]">
          {item.body.map((part, i) =>
            typeof part === 'string' ? (
              <span key={i}>{part}</span>
            ) : (
              <span key={i} className="num font-bold text-ink">
                {part.b}
              </span>
            ),
          )}
        </span>
        <time dateTime={when.iso} title={when.full} className="num text-12 font-semibold leading-4 text-[rgb(var(--n-dim))]">
          {when.label}
        </time>
      </span>
      <span aria-hidden className={cn('mt-[6px] h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-transparent' : 'bg-accent')} />
    </button>
  );
}

export function N1Notifications({ onClose, className }: { onClose?: () => void; className?: string }) {
  const navigate = useNavigate();
  const demo = useDemoState();
  const { items, unread } = useNotifications();
  const [failed, setFailed] = useState(demo === 'error');
  const loading = demo === 'loading';
  const ready = !loading && !failed;

  const go = (to: string) => {
    onClose?.();
    navigate(to);
  };
  const open = (item: NotificationItem) => {
    notificationActions.markRead(item.id);
    go(item.href);
  };

  return (
    <section aria-labelledby="n1-notes-title" className={cn('flex min-h-0 w-full flex-1 flex-col', className)}>
      <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-4">
        <Bell weight="fill" className="h-5 w-5 text-[rgb(var(--n-lilac))]" aria-hidden />
        <h2 id="n1-notes-title" className="font-display text-16 font-bold text-ink">
          Notifications
        </h2>
        {ready && unread > 0 && <span className="num flex h-6 items-center rounded-full bg-[rgb(var(--n-purple)/0.22)] px-2 text-12 font-extrabold text-[rgb(var(--n-lilac))]">{unread} new</span>}
        <button
          type="button"
          disabled={!ready || unread === 0}
          onClick={() => notificationActions.markAllRead()}
          className="n1-ring ml-auto flex h-8 items-center gap-2 rounded-[8px] px-2 text-12 font-extrabold text-[rgb(var(--n-lilac))] transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-[rgb(var(--n-dim))] disabled:hover:bg-transparent"
        >
          <Checks weight="bold" className="h-4 w-4" aria-hidden />
          Mark all as read
        </button>
      </header>

      {loading ? (
        <div role="status" aria-label="Loading notifications" className="flex flex-col gap-1 p-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 p-3">
              <span className="n1-skel h-10 w-10 shrink-0 rounded-[12px]" />
              <span className="flex flex-1 flex-col gap-2">
                <span className="n1-skel h-4 w-3/5 rounded-[8px]" />
                <span className="n1-skel h-4 w-full rounded-[8px]" />
                <span className="n1-skel h-3 w-1/4 rounded-[8px]" />
              </span>
            </div>
          ))}
        </div>
      ) : failed ? (
        <NMessage
          className="py-8"
          icon={<WarningCircle weight="fill" className="text-danger" />}
          title="Notifications did not load"
          body="Check your connection, then try again."
          action={
            <Key tone="purple" size={36} onClick={() => setFailed(false)}>
              Try again
            </Key>
          }
        />
      ) : items.length === 0 ? (
        <NMessage className="py-8" icon={<Bell weight="fill" className="text-[rgb(var(--n-lilac))]" />} title="No notifications yet" body="Deposits, withdrawals, rank rewards and sign-ins show up here." />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2">
          {items.slice(0, SHOWN).map((item) => (
            <li key={item.id}>
              <Row item={item} onOpen={open} />
            </li>
          ))}
        </ul>
      )}

      <footer className="shrink-0 border-t border-white/[0.06] p-2">
        <button type="button" onClick={() => go('/notifications')} className="n1-ring group flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-14 font-bold text-[rgb(var(--n-lilac))] transition-colors hover:bg-white/[0.05] hover:text-ink">
          See all notifications
          <span data-icon="arrow" className="k-hov-icon flex">
            <CaretRight weight="bold" className="h-4 w-4" aria-hidden />
          </span>
        </button>
      </footer>
    </section>
  );
}

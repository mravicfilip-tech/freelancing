import { useState } from 'react';
import { Bell, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Message } from '../../components/ui/Message';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/cn';
import { NotificationRow } from './NotificationRow';
import { notificationActions, useNotifications } from './notificationsStore';
import { useDemoState } from './demoState';
import type { NotificationItem } from './notificationsData';

const SHOWN = 8;

// The list inside the bell's popover. It does not import the shell. Selecting an item or the footer
// link calls onNavigate with a route, and the caller closes the popover and moves there.
// ?state=loading|error|empty reaches the other states.
export function NotificationsPanel({ onNavigate, className }: { onNavigate: (to: string) => void; className?: string }) {
  const demo = useDemoState();
  const { items, unread } = useNotifications();
  const [failed, setFailed] = useState(demo === 'error');
  const loading = demo === 'loading';

  const open = (item: NotificationItem) => {
    notificationActions.markRead(item.id);
    onNavigate(item.href);
  };

  return (
    <section aria-labelledby="notif-panel-title" className={cn('flex w-[28rem] max-w-full flex-col', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 id="notif-panel-title" className="text-16 font-semibold text-ink">
            Notifications
          </h2>
          {unread > 0 && !loading && !failed && (
            <span className="num inline-flex h-6 items-center rounded-full bg-tonal px-2 text-12 font-semibold text-ink">{unread} new</span>
          )}
        </div>
        <Button variant="tertiary" size="sm" disabled={unread === 0 || loading || failed} onClick={() => notificationActions.markAllRead()}>
          <CheckCircle weight="bold" className="h-4 w-4" aria-hidden />
          Mark all as read
        </Button>
      </header>

      {loading ? (
        <div role="status" aria-label="Loading notifications" className="flex flex-col gap-4 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <Message
          className="py-8"
          icon={<WarningCircle weight="bold" className="h-8 w-8 text-danger" aria-hidden />}
          title="Notifications did not load"
          body="Check your connection, then try again."
          action={
            <Button variant="secondary" size="sm" onClick={() => setFailed(false)}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <Message
          className="py-8"
          icon={<Bell className="h-8 w-8 text-ink3" aria-hidden />}
          title="No notifications yet"
          body="Deposits, withdrawals, rank rewards and sign-ins show up here."
        />
      ) : (
        <ul className="flex max-h-[28rem] flex-col divide-y divide-line overflow-y-auto">
          {items.slice(0, SHOWN).map((item) => (
            <li key={item.id}>
              <NotificationRow item={item} onOpen={open} compact />
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-line p-2">
        <Button variant="tertiary" block onClick={() => onNavigate('/notifications')}>
          See all notifications
        </Button>
      </footer>
    </section>
  );
}

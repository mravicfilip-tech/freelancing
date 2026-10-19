import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellSlash, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Message } from '../../components/ui/Message';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { NotificationRow } from './NotificationRow';
import { notificationActions, useNotifications } from './notificationsStore';
import { useDemoState } from './demoState';
import type { NotificationItem } from './notificationsData';

const PAGE = 20;

type Filter = 'all' | 'unread';

function Rows({ items, onOpen }: { items: NotificationItem[]; onOpen: (n: NotificationItem) => void }) {
  const [shown, setShown] = useState(PAGE);
  const visible = items.slice(0, shown);
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
        {visible.map((item) => (
          <li key={item.id}>
            <NotificationRow item={item} onOpen={onOpen} />
          </li>
        ))}
      </ul>
      {items.length > shown && (
        <div className="flex items-center justify-between gap-4">
          <p className="num text-14 text-ink3">
            Showing {visible.length} of {items.length}
          </p>
          <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div role="status" aria-label="Loading notifications" className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Route /notifications. The same items as the bell panel, with All and Unread filters.
// ?state=loading|error|empty|large reaches the other states.
export function NotificationsPage() {
  const demo = useDemoState();
  const navigate = useNavigate();
  const { items, unread } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');
  const [failed, setFailed] = useState(demo === 'error');
  const [announce, setAnnounce] = useState('');
  const loading = demo === 'loading';

  const open = (item: NotificationItem) => {
    notificationActions.markRead(item.id);
    navigate(item.href);
  };

  const markAll = () => {
    notificationActions.markAllRead();
    setAnnounce('All notifications marked as read.');
  };

  const list = filter === 'unread' ? items.filter((n) => !n.read) : items;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-32 font-semibold text-ink">Notifications</h1>
          <p className="text-16 text-ink2">Deposits, withdrawals, rewards, giveaways and sign-ins.</p>
        </div>
        <Button variant="secondary" disabled={unread === 0 || loading || failed} onClick={markAll}>
          <CheckCircle weight="bold" className="h-5 w-5" aria-hidden />
          Mark all as read
        </Button>
      </div>
      <p role="status" className="sr-only">
        {announce}
      </p>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList aria-label="Filter notifications">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {!loading && !failed && unread > 0 && <span className="num ml-2 inline-flex h-6 items-center rounded-full bg-tonal px-2 text-12 font-semibold text-ink">{unread}</span>}
          </TabsTrigger>
        </TabsList>
        {(['all', 'unread'] as const).map((f) => (
          <TabsContent key={f} value={f} className="pt-6 outline-none">
            {loading ? (
              <Loading />
            ) : failed ? (
              <div className="rounded-2xl border border-line bg-panel">
                <Message
                  icon={<WarningCircle weight="bold" className="h-10 w-10 text-danger" aria-hidden />}
                  title="Notifications did not load"
                  body="Check your connection, then try again. Your balance and history are not affected."
                  action={<Button variant="secondary" onClick={() => setFailed(false)}>Try again</Button>}
                />
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-line bg-panel">
                {f === 'unread' && items.length > 0 ? (
                  <Message
                    icon={<BellSlash className="h-10 w-10 text-ink3" aria-hidden />}
                    title="You are all caught up"
                    body="There is nothing unread. Older notifications are under All."
                    action={<Button variant="secondary" onClick={() => setFilter('all')}>Show all notifications</Button>}
                  />
                ) : (
                  <Message
                    icon={<Bell className="h-10 w-10 text-ink3" aria-hidden />}
                    title="No notifications yet"
                    body="Deposits, withdrawals, rank rewards and sign-ins show up here as they happen."
                  />
                )}
              </div>
            ) : (
              <Rows key={f} items={list} onOpen={open} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

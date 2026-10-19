import { useState } from 'react';
import { Check, ChatCircleText, X } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { CountdownDigits, KitButton } from '../kit/parts';
import { ChatPanel } from '../kit/ChatPanel';
import { DAILY_CHEST, useCountdown } from '../shared/data';

// The right column, as Grimdrop and Wizard Casino set it. A green free bonus card with the chest
// breaking out of its corner, countdown digits and a gold Get bonus, over one panel with Chat,
// Messages and Friends tabs. Chat is the kit's panel.

export function BonusCard({ onOpen }: { onOpen: () => void }) {
  const { h, m, s, pad } = useCountdown(DAILY_CHEST.readyInSeconds);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  return (
    <section aria-labelledby="v2-bonus" className="k-hue-green relative isolate shrink-0 overflow-hidden rounded-[20px] p-[20px]">
      <span aria-hidden className="k-mark absolute inset-0 -z-10" />
      <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -right-6 top-[-18px] w-[150px] max-w-none" />
      <h2 id="v2-bonus" className="w-[150px] font-display text-[30px] font-bold uppercase leading-[28px] text-ink">
        Free
        <br />
        bonus
      </h2>
      <p className="mt-2 w-[150px] text-14 font-semibold leading-[18px] text-ink">
        Today's chest
        <br />
        pays {today.amount} {DAILY_CHEST.currency}
      </p>
      <span className="mt-4 inline-flex rounded-[12px] bg-black/25 p-[6px]">
        <CountdownDigits h={h} m={m} s={s} pad={pad} tone="light" />
      </span>
      <KitButton tone="gold" size="sm" onClick={onOpen} className="mt-3 flex h-11 rounded-[12px] px-6 font-display text-16 uppercase">
        Get bonus
      </KitButton>
    </section>
  );
}

const THREADS = [
  {
    id: 'm1',
    player: 'Alice G.',
    avatar: 'alice',
    text: 'Sent you 25 USDT for the draw, good luck',
    time: '3:52 PM',
    unread: true,
  },
  {
    id: 'm2',
    player: 'Peki82',
    avatar: 'peki',
    text: 'Bet size was 0.50, the free spins hit on the 3rd try',
    time: '3:44 PM',
    unread: true,
  },
  {
    id: 'm3',
    player: 'Lagoon Team',
    avatar: '',
    text: 'Your withdrawal of 120 USDT is on its way',
    time: '2:10 PM',
    unread: true,
  },
  {
    id: 'm4',
    player: 'Tane4',
    avatar: 'tane',
    text: 'Race tonight? I am 40K behind Ficko',
    time: 'Yesterday',
    unread: true,
  },
  {
    id: 'm5',
    player: 'JJ Maybank',
    avatar: 'jj',
    text: 'Thanks for the tip on Wolf Gold',
    time: 'Monday',
    unread: false,
  },
];

type Friend = {
  id: string;
  player: string;
  avatar: string;
  status: 'request' | 'online' | 'game' | 'offline';
  note?: string;
};
const FRIENDS: Friend[] = [
  { id: 'f1', player: 'Niksa S.', avatar: 'niksa-s', status: 'request' },
  { id: 'f2', player: 'Tane M.', avatar: 'tane-m', status: 'request' },
  {
    id: 'f3',
    player: 'Ficko1',
    avatar: 'ficko',
    status: 'game',
    note: 'In Gates of Olympus',
  },
  { id: 'f4', player: 'Alice G.', avatar: 'alice', status: 'online' },
  { id: 'f5', player: 'Goodie B.', avatar: 'goodie', status: 'online' },
  {
    id: 'f6',
    player: 'Peki M.',
    avatar: 'peki-m',
    status: 'offline',
    note: 'Seen 2 hours ago',
  },
  {
    id: 'f7',
    player: 'JJ Maybank',
    avatar: 'jj',
    status: 'offline',
    note: 'Seen yesterday',
  },
];

function Face({ src, initials, dot }: { src?: string; initials: string; dot?: 'on' | 'game' | 'off' }) {
  return (
    <span className="relative h-10 w-10 shrink-0">
      {src ? (
        <img src={`/art/avatars/${src}.webp`} alt="" className="h-10 w-10 rounded-[12px] object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#6D3BF0] text-14 font-bold text-ink">{initials}</span>
      )}
      {dot && (
        <span
          aria-hidden
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] rounded-full border-2 border-[rgb(var(--k-item))]',
            dot === 'on' && 'bg-[#3DDC84]',
            dot === 'game' && 'bg-gold',
            dot === 'off' && 'bg-[rgb(var(--k-dim))]',
          )}
        />
      )}
    </span>
  );
}

function Messages({ threads, onRead }: { threads: typeof THREADS; onRead: (id: string) => void }) {
  return (
    <ul aria-label="Messages" className="k-no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {threads.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onRead(t.id)}
            aria-label={`${t.player}, ${t.text}${t.unread ? ', unread' : ''}`}
            className="flex w-full items-start gap-3 rounded-[14px] bg-[rgb(var(--k-item))] p-3 text-left hover:bg-[rgb(var(--k-item-hover))]"
          >
            <Face src={t.avatar || undefined} initials="LT" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="truncate text-14 font-bold text-ink">{t.player}</span>
                <span className="ml-auto shrink-0 text-12 text-[rgb(var(--k-dim))]">{t.time}</span>
              </span>
              <span className={cn('line-clamp-2 text-14 leading-5', t.unread ? 'font-semibold text-ink' : 'text-[rgb(var(--k-muted))]')}>{t.text}</span>
            </span>
            {t.unread && <span aria-hidden className="mt-2 h-[8px] w-[8px] shrink-0 rounded-full bg-[#B47CFF]" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Friends({ onMessage }: { onMessage: () => void }) {
  const [list, setList] = useState(FRIENDS);
  const groups: { title: string; items: Friend[] }[] = [
    {
      title: 'Friend requests',
      items: list.filter((f) => f.status === 'request'),
    },
    {
      title: 'Online',
      items: list.filter((f) => f.status === 'online' || f.status === 'game'),
    },
    { title: 'Offline', items: list.filter((f) => f.status === 'offline') },
  ];
  const sq = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]';
  return (
    <div className="k-no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.title} aria-label={g.title} className="flex flex-col gap-2">
              <h3 className="px-1 text-12 font-bold text-[rgb(var(--k-dim))]">
                {g.title} ({g.items.length})
              </h3>
              <ul className="flex flex-col gap-2">
                {g.items.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 rounded-[14px] bg-[rgb(var(--k-item))] p-2 pl-3">
                    <Face src={f.avatar} initials={f.player.slice(0, 2)} dot={f.status === 'request' ? undefined : f.status === 'online' ? 'on' : f.status === 'game' ? 'game' : 'off'} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-14 font-bold text-ink">{f.player}</span>
                      <span className={cn('truncate text-12 font-semibold', f.status === 'online' ? 'text-[#3DDC84]' : f.status === 'game' ? 'text-gold' : 'text-[rgb(var(--k-dim))]')}>
                        {f.status === 'request' ? 'Wants to be friends' : f.status === 'online' ? 'Online' : f.note}
                      </span>
                    </span>
                    {f.status === 'request' ? (
                      <>
                        <button
                          type="button"
                          aria-label={`Decline ${f.player}`}
                          onClick={() => setList((l) => l.filter((x) => x.id !== f.id))}
                          className={cn(sq, 'bg-[#FF8A3D] text-[#2A1500] hover:brightness-110')}
                        >
                          <X weight="bold" className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={`Accept ${f.player}`}
                          onClick={() => setList((l) => l.map((x) => (x.id === f.id ? { ...x, status: 'online' } : x)))}
                          className={cn(sq, 'bg-[#3DDC84] text-[#0A2A17] hover:brightness-110')}
                        >
                          <Check weight="bold" className="h-4 w-4" aria-hidden />
                        </button>
                      </>
                    ) : (
                      <button type="button" aria-label={`Message ${f.player}`} onClick={onMessage} className={cn(sq, 'bg-black/25 text-[rgb(var(--k-muted))] hover:text-ink')}>
                        <ChatCircleText weight="fill" className="h-5 w-5" aria-hidden />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}

type Tab = 'chat' | 'messages' | 'friends';

export function Social() {
  const [tab, setTab] = useState<Tab>('chat');
  const [threads, setThreads] = useState(THREADS);
  const unread = threads.filter((t) => t.unread).length;
  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'chat', label: 'Chat' },
    { value: 'messages', label: 'Messages', count: unread },
    { value: 'friends', label: 'Friends' },
  ];
  return (
    <section aria-label="Chat and friends" className="flex min-h-0 flex-1 flex-col gap-3 rounded-[20px] border border-ink/[0.06] bg-[rgb(var(--k-panel))] p-3">
      <div role="tablist" aria-label="Chat and friends" className="grid shrink-0 grid-cols-[0.8fr_1.25fr_1fr] gap-1 rounded-[14px] bg-black/20 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            id={`v2-tab-${t.value}`}
            aria-selected={tab === t.value}
            aria-controls={`v2-panel-${t.value}`}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex h-10 items-center justify-center gap-1 rounded-[10px] text-14 font-bold transition-colors',
              tab === t.value ? 'k-btn-purple text-ink' : 'text-[rgb(var(--k-muted))] hover:text-ink',
            )}
          >
            {t.label}
            {!!t.count && <span className="num flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F06595] px-1 text-12 leading-none text-ink">{t.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`v2-panel-${tab}`} aria-labelledby={`v2-tab-${tab}`} className="flex min-h-0 flex-1 flex-col">
        {tab === 'chat' && (
          <>
            <ChatPanel className="min-h-0 flex-1 rounded-none bg-transparent p-0 [&>header]:hidden [&>ol]:mt-1 [&>ol]:pt-4 [&>ol]:[mask-image:linear-gradient(180deg,transparent,#000_72px)]" />
          </>
        )}
        {tab === 'messages' && <Messages threads={threads} onRead={(id) => setThreads((l) => l.map((t) => (t.id === id ? { ...t, unread: false } : t)))} />}
        {tab === 'friends' && <Friends onMessage={() => setTab('messages')} />}
      </div>
    </section>
  );
}

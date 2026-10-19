import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ChatCircle, Check, Pause, X } from '@phosphor-icons/react';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { cn } from '../../../lib/cn';
import { CHAT, DAILY_CHEST, ONLINE_NOW, useCountdown, type ChatMessage } from '../shared/data';
import { LiveDot } from './parts';

// The right rail, 320 wide, sticky and as tall as the window. The daily chest sits on top with its
// art breaking out of the card. Chat and Friends fill the rest, the composer stays at the bottom.

function ChestCard() {
  const t = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  return (
    <section
      id="v1-chest"
      tabIndex={-1}
      aria-labelledby="v1-chest-title"
      className="relative shrink-0 rounded-2xl border border-line bg-raised p-4 outline-none focus:border-accent"
    >
      <img aria-hidden src="/art/lobby/giveaway-chest.webp" alt="" width={140} height={140} className="pointer-events-none absolute -right-4 -top-[52px] h-[140px] w-[140px] max-w-none" />
      <h2 id="v1-chest-title" className="text-18 font-bold leading-6 text-ink">
        Daily chest
      </h2>
      <p className="mt-1 text-14 text-ink2">{t.left > 0 ? 'Ready in' : 'Ready now'}</p>
      <p className="num font-display text-32 font-bold leading-[40px] text-ink" aria-live="off">
        {t.hms}
      </p>
      <p className="mt-1 text-14 text-ink2">
        {today.day} opens <span className="num font-semibold text-ink">{today.amount} {DAILY_CHEST.currency}</span>. {DAILY_CHEST.streak} day streak.
      </p>
      <ol aria-label="Seven day streak" className="mt-4 grid grid-cols-7 gap-1">
        {DAILY_CHEST.days.map((d) => (
          <li
            key={d.day}
            className={cn(
              'flex h-[56px] flex-col items-center justify-center gap-1 rounded-lg border text-center',
              d.status === 'claimed' && 'border-accent bg-sunken',
              d.status === 'today' && 'border-field bg-menu-active',
              d.status === 'locked' && 'border-line bg-sunken/50',
            )}
          >
            <span className={cn('text-12 font-medium', d.status === 'locked' ? 'text-ink3' : 'text-ink2')}>{d.day}</span>
            {d.status === 'claimed' ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-gold">
                <Check weight="bold" className="h-3 w-3" aria-hidden />
                <span className="sr-only">Claimed, {d.amount} {DAILY_CHEST.currency}</span>
              </span>
            ) : (
              <span className={cn('num text-14 font-semibold', d.status === 'today' ? 'text-ink' : 'text-ink3')}>
                {d.amount}
                <span className="sr-only"> {DAILY_CHEST.currency}{d.status === 'today' ? ', today' : ''}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <Button
        variant="secondary"
        block
        aria-pressed={remind}
        onClick={() => setRemind((r) => !r)}
        className="mt-4"
      >
        {remind ? (
          <>
            <Check weight="bold" className="h-4 w-4" aria-hidden />
            Reminder on
          </>
        ) : (
          'Remind me when it is ready'
        )}
      </Button>
    </section>
  );
}

function Mentioned({ text }: { text: string }) {
  return (
    <>
      {text.split(/(@[\w]+)/g).map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-semibold text-accent">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function RoleBadge({ role }: { role: 'admin' | 'mod' }) {
  return (
    <span className={cn('rounded px-1 text-12 font-semibold leading-4', role === 'admin' ? 'bg-brand text-ink' : 'border border-tonal-line bg-tonal text-ink')}>
      {role === 'admin' ? 'Admin' : 'Mod'}
    </span>
  );
}

function Face({ m }: { m: Pick<ChatMessage, 'avatar' | 'initials'> }) {
  return m.avatar ? <img src={m.avatar} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <Avatar initials={m.initials} size="sm" />;
}

function ChatList({ messages, state }: { messages: ChatMessage[]; state: string | null }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, state]);
  if (state === 'loading') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul ref={ref} aria-label="Chat messages" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3 [scrollbar-width:thin]">
      {messages.map((m) => (
        <li key={m.id} className={cn('flex gap-3 rounded-lg px-2 py-2', m.mine ? 'bg-menu-active/60' : 'hover:bg-raised/50')}>
          <Face m={m} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span className="truncate text-14 font-semibold text-ink">{m.player}</span>
              {m.role && <RoleBadge role={m.role} />}
              <span className="num ml-auto shrink-0 text-12 text-ink3">{m.time}</span>
            </p>
            <p className="break-words text-14 leading-5 text-ink2">
              <Mentioned text={m.text} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type Friend = { name: string; avatar: string; status: string; online: boolean };
const FRIENDS: Friend[] = [
  { name: 'Peki82', avatar: '/art/avatars/peki.webp', status: 'Playing Sugar Rush', online: true },
  { name: 'Alice G.', avatar: '/art/avatars/alice.webp', status: 'In the lobby', online: true },
  { name: 'Ficko1', avatar: '/art/avatars/ficko.webp', status: 'Playing Gates of Olympus', online: true },
  { name: 'Goodie B.', avatar: '/art/avatars/goodie.webp', status: 'Seen 2 hours ago', online: false },
  { name: 'Tane4', avatar: '/art/avatars/tane.webp', status: 'Seen yesterday', online: false },
];
const REQUESTS: Friend[] = [
  { name: 'JJ Maybank', avatar: '/art/avatars/jj.webp', status: 'Wants to be friends', online: true },
  { name: 'Niksa', avatar: '/art/avatars/niksa.webp', status: 'Wants to be friends', online: true },
];

function FriendRow({ f, children }: { f: Friend; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-raised/50">
      <span className="relative shrink-0">
        <img src={f.avatar} alt="" width={36} height={36} className={cn('h-9 w-9 rounded-full object-cover', !f.online && 'opacity-60')} />
        <span aria-hidden className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sunken', f.online ? 'bg-success' : 'bg-ink3')} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-14 font-semibold text-ink">{f.name}</span>
        <span className="truncate text-12 text-ink2">{f.status}</span>
      </span>
      {children}
    </li>
  );
}

function IconButton({ label, onClick, tone, children }: { label: string; onClick: () => void; tone?: 'ok'; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink2 hover:text-ink', tone === 'ok' ? 'hover:border-success hover:text-success' : 'hover:border-field')}
    >
      {children}
    </button>
  );
}

function Friends({ onMessage }: { onMessage: (name: string) => void }) {
  const [requests, setRequests] = useState(REQUESTS);
  const [friends, setFriends] = useState(FRIENDS);
  const online = friends.filter((f) => f.online);
  const offline = friends.filter((f) => !f.online);
  const Head = ({ children }: { children: string }) => <h3 className="px-2 pb-1 pt-3 text-12 font-medium text-ink3">{children}</h3>;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 [scrollbar-width:thin]">
      {requests.length > 0 && (
        <>
          <Head>{`Requests, ${requests.length}`}</Head>
          <ul>
            {requests.map((r) => (
              <FriendRow key={r.name} f={r}>
                <IconButton
                  label={`Accept ${r.name}`}
                  tone="ok"
                  onClick={() => {
                    setRequests((l) => l.filter((x) => x.name !== r.name));
                    setFriends((l) => [{ ...r, status: 'In the lobby' }, ...l]);
                  }}
                >
                  <Check weight="bold" className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton label={`Decline ${r.name}`} onClick={() => setRequests((l) => l.filter((x) => x.name !== r.name))}>
                  <X weight="bold" className="h-4 w-4" aria-hidden />
                </IconButton>
              </FriendRow>
            ))}
          </ul>
        </>
      )}
      <Head>{`Online, ${online.length}`}</Head>
      <ul>
        {online.map((f) => (
          <FriendRow key={f.name} f={f}>
            <IconButton label={`Message ${f.name}`} onClick={() => onMessage(f.name)}>
              <ChatCircle weight="bold" className="h-4 w-4" aria-hidden />
            </IconButton>
          </FriendRow>
        ))}
      </ul>
      <Head>{`Offline, ${offline.length}`}</Head>
      <ul>
        {offline.map((f) => (
          <FriendRow key={f.name} f={f}>
            <IconButton label={`Message ${f.name}`} onClick={() => onMessage(f.name)}>
              <ChatCircle weight="bold" className="h-4 w-4" aria-hidden />
            </IconButton>
          </FriendRow>
        ))}
      </ul>
    </div>
  );
}

function Social({ state }: { state: string | null }) {
  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT);
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const paused = state === 'error';

  const send = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || paused) return;
    setMessages((m) => [...m, { id: `me-${m.length}`, player: 'John D.', avatar: '/art/avatars/john-sm.webp', initials: 'JD', text: t, time: 'Just now', mine: true }]);
    setText('');
  };
  const message = (name: string) => {
    setTab('chat');
    setText(`@${name.split(' ')[0].replace(/[^\w]/g, '')} `);
    window.setTimeout(() => input.current?.focus(), 0);
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
      <TabsList aria-label="Chat and friends" className="shrink-0 gap-6 px-2">
        <TabsTrigger value="chat" className="gap-2">
          Chat
          <span className="num flex items-center gap-1 text-12 font-medium text-ink2">
            <LiveDot />
            {ONLINE_NOW.toLocaleString('en-US')}
            <span className="sr-only"> online</span>
          </span>
        </TabsTrigger>
        <TabsTrigger value="friends" className="gap-2">
          Friends
          <span className="num text-12 font-medium text-ink2">{FRIENDS.filter((f) => f.online).length}<span className="sr-only"> online</span></span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="min-h-0 flex-1 flex-col outline-none data-[state=active]:flex">
        {paused && (
          <p role="status" className="mx-2 mt-3 flex shrink-0 items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-14 text-ink2">
            <Pause weight="fill" className="h-4 w-4 shrink-0 text-pending" aria-hidden />
            Chat is paused and reconnects on its own.
          </p>
        )}
        <ChatList messages={messages} state={state} />
        <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-line px-3 pt-3">
          <label htmlFor="v1-compose" className="sr-only">
            Message the lagoon
          </label>
          <input
            ref={input}
            id="v1-compose"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            disabled={paused}
            placeholder="Say something nice"
            autoComplete="off"
            className="h-[44px] min-w-0 flex-1 rounded-lg border border-field bg-page px-3 text-14 text-ink outline-none placeholder:text-ink3 focus:border-accent disabled:opacity-50"
          />
          <Button type="submit" variant="secondary" size="lg" disabled={paused || !text.trim()}>
            Send
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="friends" className="min-h-0 flex-1 flex-col outline-none data-[state=active]:flex">
        <Friends onMessage={message} />
      </TabsContent>
    </Tabs>
  );
}

export function Rail({ state }: { state: string | null }) {
  return (
    <aside aria-label="Daily chest and chat" className="w-[320px] shrink-0 border-l border-side-line bg-sunken">
      <div className="sticky top-0 flex h-screen flex-col gap-4 pb-4 pt-16">
        <div className="px-4">
          <ChestCard />
        </div>
        <Social state={state} />
      </div>
    </aside>
  );
}

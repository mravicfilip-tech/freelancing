import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChatCircleDots, Heart, PaperPlaneTilt, X } from '@phosphor-icons/react';
import { ACCOUNT } from '../../../data/wallet';
import { CHAT, ONLINE_NOW, type ChatMessage } from '../shared/data';
import { cn } from '../../../lib/cn';
import { LiveDot } from './parts';

// The chat panel, built to Turbo Bet's rail and drawn under the round 4 chrome. A quiet header with a
// live online count and a stack of avatars, each message as a name line with its role tag and a
// dark bubble, a like button, and a composer with a purple Send. Sending adds the message as John D.

const ROLE: Record<string, string> = { admin: 'bg-[#6D3BF0] text-ink', mod: 'bg-[#2B8A3E] text-ink' };

function Avatar({ m }: { m: ChatMessage }) {
  return (
    <span className="relative h-10 w-10 shrink-0">
      {m.avatar ? (
        <img src={m.avatar} alt="" className="h-10 w-10 rounded-[12px] object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#6D3BF0] text-14 font-bold text-ink">{m.initials}</span>
      )}
      <span aria-hidden className="absolute -bottom-2 left-1/2 flex h-[18px] min-w-[24px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-[rgb(var(--k-panel))] bg-[#7B3FF2] px-1 text-12 font-bold leading-none text-ink">
        {m.role ? 'TM' : (m.player.length % 9) + 12}
      </span>
    </span>
  );
}

export function ChatPanel({ onClose, className }: { onClose?: () => void; className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT);
  const [draft, setDraft] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages.length]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: `me-${m.length}`, player: ACCOUNT.name, avatar: '/art/avatars/john-sm.webp', initials: ACCOUNT.initials, text, time: 'Now', mine: true }]);
    setDraft('');
  };

  return (
    <section aria-labelledby="chat-title" className={cn('k-surface flex min-h-0 flex-col rounded-[20px] p-3', className)}>
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.06] pb-3 pl-2 pr-1">
        <ChatCircleDots weight="fill" className="h-6 w-6 text-[#C9A2FF]" aria-hidden />
        <h2 id="chat-title" className="text-16 font-bold text-ink">
          Chat
        </h2>
        <span className="ml-auto flex items-center gap-2 text-14 font-semibold text-ink">
          <LiveDot />
          <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span>
          <span className="sr-only">players online</span>
        </span>
        <span aria-hidden className="flex -space-x-2">
          {['peki', 'alice', 'ficko'].map((a) => (
            <img key={a} src={`/art/avatars/${a}.webp`} alt="" className="h-[28px] w-[28px] rounded-full border-2 border-[rgb(var(--k-panel))] object-cover" />
          ))}
        </span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Hide the chat" className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:text-ink">
            <X weight="bold" className="h-4 w-4" aria-hidden />
          </button>
        )}
      </header>

      <ol ref={list} aria-label="Messages" className="k-no-scrollbar mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2">
        {messages.map((m) => (
          <li key={m.id} className="flex gap-3">
            <Avatar m={m} />
            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
              <p className="flex items-center gap-2">
                <span className={cn('truncate text-14 font-bold', m.mine ? 'text-[#C9A2FF]' : 'text-ink')}>{m.player}</span>
                {m.role && <span className={cn('rounded-[6px] px-[6px] py-0.5 text-12 font-bold uppercase leading-none tracking-[0.04em]', ROLE[m.role])}>{m.role}</span>}
                <span className="ml-auto text-12 text-[rgb(var(--k-dim))]">{m.time}</span>
                <button
                  type="button"
                  aria-pressed={!!liked[m.id]}
                  aria-label={`Like ${m.player}'s message`}
                  onClick={() => setLiked((l) => ({ ...l, [m.id]: !l[m.id] }))}
                  className="rounded p-0.5 text-[rgb(var(--k-dim))] hover:text-ink"
                >
                  <Heart weight={liked[m.id] ? 'fill' : 'regular'} className={cn('h-4 w-4', liked[m.id] && 'text-[#F06595]')} aria-hidden />
                </button>
              </p>
              <p className={cn('rounded-[12px] px-3 py-2 text-14 font-medium leading-5 text-ink', m.mine ? 'border border-[#B47CFF]/30 bg-[#8D3BF0]/20' : 'bg-white/[0.04]')}>
                {m.text.split(/(@\w+)/).map((part, i) => (part.startsWith('@') ? <span key={i} className="text-[#C9A2FF]">{part}</span> : part))}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={send} className="mt-2 flex shrink-0 items-center gap-2 rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] p-[6px] pl-4 focus-within:ring-2 focus-within:ring-[#B47CFF]">
        <label htmlFor="chat-input" className="sr-only">
          Send a message
        </label>
        <input
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message"
          maxLength={200}
          className="h-10 min-w-0 flex-1 bg-transparent text-14 text-ink outline-none placeholder:text-[rgb(var(--k-dim))]"
        />
        <button type="submit" className="k-btn-purple flex h-10 items-center gap-2 rounded-[10px] px-4 text-14 font-bold text-ink hover:brightness-110">
          <PaperPlaneTilt weight="fill" className="h-4 w-4" aria-hidden />
          Send
        </button>
      </form>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import * as P from '@radix-ui/react-popover';
import { ArrowBendUpLeft, ArrowUp, CaretRight, ChatCircleDots, Heart, PaperPlaneRight, SealCheck, Smiley, X } from '@phosphor-icons/react';
import { ACCOUNT } from '../../../data/wallet';
import { gameById, type CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { ONLINE_NOW } from '../shared/data';
import { amountText, Avatar, CoinChip, CoinIcon, Live, NMessage } from './ui';
import { V1_CHAT, winById, type V1Message } from './data';

// The chat rail after Snegbet. A header with the online count and Rules, each message as a card with
// its level badge, MOD tags, reply quotes and a shared win card, and a composer with an emoji picker
// and a purple key send. Sending posts as John D., a reply carries its quote.

const EMOJI = ['🔥', '🎰', '💰', '🍀', '😂', '🙌', '💜', '🌴'];

function Quote({ of }: { of: V1Message }) {
  return (
    <span className="n1-well relative flex flex-col rounded-[8px] py-[6px] pl-3 pr-2">
      <span aria-hidden className="absolute bottom-[6px] left-[6px] top-[6px] w-[2px] rounded-full bg-[rgb(var(--n-purple))]" />
      <span className="truncate text-12 font-bold text-ink">{of.player}</span>
      <span className="truncate text-12 text-[rgb(var(--n-muted))]">{of.text}</span>
    </span>
  );
}

function WinCard({ id, onPlay }: { id: string; onPlay: (g: CatalogueGame) => void }) {
  const w = winById(id);
  const g = gameById(w.gameId)!;
  return (
    <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}, ${w.player} won ${amountText(w.coin, w.amount)}`} className="n1-wincard n1-ring group relative flex items-center gap-3 rounded-[12px] p-[6px] pr-2 text-left">
      <span className="h-[48px] w-10 shrink-0 overflow-hidden rounded-[8px]">
        <img src={g.image} alt="" className="n1-zoom h-full w-full object-cover object-top" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate pr-6 text-12 font-bold text-ink">{g.short ?? g.name}</span>
        <span className="flex items-center gap-[6px]">
          <CoinIcon id={w.coin} size={16} />
          <span className="num text-14 font-extrabold text-ink">{amountText(w.coin, w.amount)}</span>
          <CoinChip id={w.coin} className="bg-black/25 text-ink/80" />
        </span>
      </span>
      <span data-icon="arrow" className="k-hov-icon n1-keysq absolute right-[6px] top-[6px] flex h-5 w-5 items-center justify-center rounded-full text-ink">
        <CaretRight weight="bold" className="h-[12px] w-[12px]" aria-hidden />
      </span>
    </button>
  );
}

export function Chat({ onPlay, onRules, state, className }: { onPlay: (g: CatalogueGame) => void; onRules: () => void; state: string | null; className?: string }) {
  const [messages, setMessages] = useState<V1Message[]>(state === 'empty' ? [] : V1_CHAT);
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState<V1Message | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [emoji, setEmoji] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // The rail is always full. Messages sit on the bottom edge, newest last, and the oldest one in view
  // fades out under the top edge, where a "Show earlier messages" pill floats over the fade (note on
  // the empty area, round 6). Messages that are wholly above the edge are hidden from focus and from
  // assistive tech. The count is read from the layout on every pass, and again when the list changes
  // height and when the fonts land. Opening the pill shows every message and scrolls as a chat.
  const [earlier, setEarlier] = useState(0);
  const [gone, setGone] = useState(0);
  const [all, setAll] = useState(false);
  const [fit, setFit] = useState(0);
  const listed = state !== 'loading' && messages.length > 0;
  useEffect(() => {
    const el = list.current;
    if (!el || all) return;
    let h = el.clientHeight;
    const ro = new ResizeObserver(() => {
      if (el.clientHeight === h) return;
      h = el.clientHeight;
      setFit((f) => f + 1);
    });
    ro.observe(el);
    let live = true;
    document.fonts?.ready.then(() => live && setFit((f) => f + 1));
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [listed, all]);
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || all) return;
    const edge = el.getBoundingClientRect().top + parseFloat(getComputedStyle(el).paddingTop);
    const tops = [...el.querySelectorAll<HTMLElement>(':scope > li[data-msg]')].map((li) => li.getBoundingClientRect());
    setEarlier(tops.filter((r) => r.top < edge - 1).length);
    setGone(tops.filter((r) => r.bottom <= edge + 24).length);
  }, [messages.length, fit, all, listed]);
  const openAll = () => {
    setAll(true);
    setEarlier(0);
    setGone(0);
    requestAnimationFrame(() => list.current?.scrollTo({ top: 0 }));
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: `me-${m.length}`, player: ACCOUNT.name, avatar: '/art/avatars/john-sm.webp', initials: ACCOUNT.initials, text, time: 'Now', mine: true, level: 6, replyTo: reply?.id }]);
    setDraft('');
    setReply(null);
  };
  const byId = (id: string) => messages.find((m) => m.id === id) ?? V1_CHAT.find((m) => m.id === id);

  return (
    <section aria-labelledby="n1-chat-title" className={cn('n1-panel flex min-h-[0px] flex-col rounded-[20px]', className)}>
      {/* The header sits on the same 12px inset as the messages and the composer (round 7, note 4). */}
      <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        <ChatCircleDots weight="fill" className="h-5 w-5 text-[rgb(var(--n-lilac))]" aria-hidden />
        <h2 id="n1-chat-title" className="font-display text-16 font-bold text-ink">
          Chat
        </h2>
        <span className="n1-well ml-auto flex h-8 items-center gap-2 rounded-[10px] px-[10px] text-12 font-extrabold text-ink">
          <Live />
          <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span>
          <span className="sr-only">players online</span>
        </span>
        <button type="button" onClick={onRules} className="n1-ring h-8 rounded-[10px] bg-[rgb(var(--n-purple)/0.18)] px-3 text-12 font-extrabold text-[rgb(var(--n-lilac))] shadow-[inset_0_0_0_1px_rgb(190_166_255/0.16)] transition-colors hover:bg-[rgb(var(--n-purple)/0.28)]">
          Rules
        </button>
      </header>

      {state === 'loading' ? (
        <div className="flex flex-1 flex-col justify-end gap-4 p-4" aria-hidden>
          {[72, 56, 96, 56, 72].map((hgt, i) => (
            <div key={i} className="flex gap-3">
              <span className="n1-skel h-9 w-9 shrink-0 rounded-[10px]" />
              <span className="n1-skel flex-1 rounded-[12px]" style={{ height: hgt }} />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-1 items-center">
          <NMessage icon={<ChatCircleDots weight="fill" className="text-[rgb(var(--n-lilac))]" />} title="The chat is quiet" body="Say hi to the lagoon. Messages show here the moment they land." />
        </div>
      ) : (
        <div className="relative flex min-h-[0px] flex-1 flex-col">
          {earlier > 0 && !all && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
              <button type="button" onClick={openAll} className="n1-raised n1-hoverable n1-ring pointer-events-auto flex h-8 items-center gap-2 rounded-full px-4 text-12 font-bold text-[rgb(var(--n-muted))] shadow-[0_8px_20px_-8px_rgb(0_0_0/0.6)] hover:text-ink">
                <ArrowUp weight="bold" className="h-[12px] w-[12px]" aria-hidden />
                <span>
                  Show <span className="num">{earlier}</span> earlier messages
                </span>
              </button>
            </div>
          )}
          <ol
            ref={list}
            aria-label="Messages"
            className={cn(
              'n1-noscroll flex min-h-[0px] flex-1 flex-col gap-[6px] px-3 pb-2 pt-3',
              all ? 'overflow-y-auto [mask-image:linear-gradient(180deg,transparent_0,#000_24px)]' : 'justify-end overflow-hidden',
              !all && earlier > 0 && '[mask-image:linear-gradient(180deg,transparent_0,transparent_28px,#000_120px)]',
            )}
          >
          {messages.map((m, idx) => {
            const quoted = m.replyTo ? byId(m.replyTo) : undefined;
            return (
              <li key={m.id} data-msg aria-hidden={!all && idx < gone ? true : undefined} className={cn('group/msg flex shrink-0 gap-3', !all && idx < gone && 'invisible')}>
                <Avatar src={m.avatar} initials={m.initials} level={m.level} className="mt-1" />
                <div className={cn('relative flex min-w-0 flex-1 flex-col gap-1 rounded-[12px] px-3 py-2', m.mine ? 'bg-[rgb(var(--n-purple)/0.14)] shadow-[inset_0_0_0_1px_rgb(190_166_255/0.2)]' : 'bg-white/[0.035]')}>
                  <p className="flex items-center gap-2">
                    <span className={cn('truncate text-12 font-bold', m.mine ? 'text-[rgb(var(--n-lilac))]' : 'text-[rgb(var(--n-muted))]')}>{m.player}</span>
                    {m.role === 'mod' && <span className="rounded-[6px] bg-[#1C4A36] px-[6px] text-12 font-extrabold uppercase leading-[18px] tracking-[0.04em] text-[#8CF0B8]">Mod</span>}
                    {m.role === 'admin' && (
                      <span className="flex shrink-0 items-center" title="Lagoon team">
                        <SealCheck weight="fill" className="h-4 w-4 text-[rgb(var(--n-lilac))]" aria-hidden />
                        <span className="sr-only">Lagoon team</span>
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-12 text-[rgb(var(--n-dim))]">{m.time}</span>
                    <button
                      type="button"
                      aria-label={`Reply to ${m.player}`}
                      onClick={() => {
                        setReply(m);
                        input.current?.focus();
                      }}
                      data-icon="pop"
                      className="k-hov-icon n1-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-white/[0.06] text-[rgb(var(--n-muted))] hover:bg-white/[0.12] hover:text-ink"
                    >
                      <ArrowBendUpLeft weight="bold" className="h-[14px] w-[14px]" aria-hidden />
                    </button>
                  </p>
                  {quoted && <Quote of={quoted} />}
                  <p className="break-words pr-6 text-14 font-medium leading-5 text-ink">
                    {m.text.split(/(@\w+)/).map((part, i) => (part.startsWith('@') ? <span key={i} className="font-bold text-[rgb(var(--n-lilac))]">{part}</span> : part))}
                  </p>
                  {m.winId && <WinCard id={m.winId} onPlay={onPlay} />}
                  <button
                    type="button"
                    aria-pressed={!!liked[m.id]}
                    aria-label={`Like ${m.player}'s message`}
                    onClick={() => setLiked((l) => ({ ...l, [m.id]: !l[m.id] }))}
                    data-icon="pop"
                    className={cn('k-hov-icon n1-ring absolute right-[6px] flex h-6 w-6 items-center justify-center rounded-[6px] hover:bg-white/[0.06] hover:text-ink', m.winId ? 'top-[34px]' : 'bottom-[6px]', liked[m.id] ? 'text-[#FF6FA8]' : 'text-[rgb(var(--n-dim))] opacity-0 focus-visible:opacity-100 group-hover/msg:opacity-100')}
                  >
                    <Heart weight={liked[m.id] ? 'fill' : 'bold'} className="h-[14px] w-[14px]" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
          </ol>
        </div>
      )}

      <form onSubmit={send} className="shrink-0 p-3 pt-1">
        {reply && (
          <div className="mb-2 flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <Quote of={reply} />
            </span>
            <button type="button" onClick={() => setReply(null)} aria-label="Cancel the reply" data-icon="pop" className="k-hov-icon n1-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[rgb(var(--n-muted))] hover:bg-white/[0.06] hover:text-ink">
              <X weight="bold" className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
        <div className="n1-well flex items-center gap-2 rounded-[12px] p-[6px] pl-4 focus-within:border-[rgb(var(--n-purple)/0.6)]">
          <label htmlFor="n1-chat-input" className="sr-only">
            Message
          </label>
          <input
            ref={input}
            id="n1-chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message"
            maxLength={200}
            className="h-9 min-w-0 flex-1 bg-transparent text-14 font-medium text-ink outline-none placeholder:text-[rgb(var(--n-dim))]"
          />
          <P.Root open={emoji} onOpenChange={setEmoji}>
            <P.Trigger aria-label="Add an emoji" data-icon="pop" className="k-hov-icon n1-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-[rgb(var(--n-muted))] hover:bg-white/[0.1] hover:text-ink data-[state=open]:text-ink">
              <Smiley weight="fill" className="h-5 w-5" aria-hidden />
            </P.Trigger>
            <P.Portal>
              <P.Content side="top" align="end" sideOffset={8} className="n1 n1-panel z-30 grid grid-cols-4 gap-1 rounded-[12px] p-2 shadow-[0_16px_40px_rgb(0_0_0/0.5)] outline-none">
                {EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    aria-label={`Add ${e}`}
                    onClick={() => {
                      setDraft((d) => (d + e).slice(0, 200));
                      setEmoji(false);
                      input.current?.focus();
                    }}
                    className="n1-ring flex h-9 w-9 items-center justify-center rounded-[10px] text-20 hover:bg-white/[0.08]"
                  >
                    {e}
                  </button>
                ))}
              </P.Content>
            </P.Portal>
          </P.Root>
          <button type="submit" aria-label="Send" data-icon="arrow" className="k-hov-icon n1-keysq n1-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-ink transition-[filter] hover:brightness-110 active:translate-y-px">
            <PaperPlaneRight weight="fill" className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </form>
    </section>
  );
}

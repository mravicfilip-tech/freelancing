import { CHAT, LIVE_WINS, type ChatMessage } from '../shared/data';
import { gameById, type CatalogueGame } from '../../../data/games';

// Neon arcade's view of the shared data. The chat gains Snegbet's reply quotes and a shared win card,
// the sidebar gains a row of five exclusive and new games. Nothing here invents a new data shape.

export type V1Message = ChatMessage & { level: number | string; replyTo?: string; winId?: string };

/** A steady level per player, so the badge does not change between renders. */
const levelOf = (name: string) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return 8 + (h % 60);
};

const EXTRA: ChatMessage[] = [
  { id: 'v1-a', player: 'Alice G.', avatar: '/art/avatars/alice.webp', initials: 'AG', text: 'My win in', time: '3:52 PM' },
  { id: 'v1-b', player: 'Niksa', avatar: '/art/avatars/niksa.webp', initials: 'NS', role: 'mod', text: 'Huge hit, congrats. Screenshot it for the weekly highlights', time: '3:53 PM' },
];

const REPLY: Record<string, string> = { c3: 'c1', 'v1-b': 'v1-a' };
const WIN: Record<string, string> = { 'v1-a': 'w13' };

export const V1_CHAT: V1Message[] = [...CHAT, ...EXTRA].map((m) => ({
  ...m,
  level: m.role === 'admin' ? 'TM' : levelOf(m.player),
  replyTo: REPLY[m.id],
  winId: WIN[m.id],
}));

export const winById = (id: string) => LIVE_WINS.find((w) => w.id === id)!;

/** The sidebar originals row. Exclusive and new games, with the badge Snegbet puts on a tile. */
export const ORIGINALS: { game: CatalogueGame; badge?: 'new' | 'hot' }[] = [
  { game: gameById('sugar-rush')!, badge: 'hot' },
  { game: gameById('lucky-dwarfs')! },
  { game: gameById('scarab-wheel')! },
  { game: gameById('festival-of-fortune')!, badge: 'new' },
  { game: gameById('coins-of-alkemor')! },
];

export const CHAT_RULES = [
  'Be kind. No insults, threats or hate of any kind.',
  'Never share a password, a wallet seed or a card number.',
  'Tips over 25 USDT go through the Tip tab, not the chat.',
  'No links to other casinos or to referral codes.',
];

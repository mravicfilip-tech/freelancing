import { TOKENS, type TokenId } from '../data';

/**
 * The mystery box: what a box can hold, the odds, and the colours each
 * rarity carries. Colours are the Figma card's, fixed in both themes, since
 * the cards are collectibles rather than surfaces.
 */
export type Rarity = 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type Kind = 'cash' | 'bonus' | 'payfi';
export type Prize = { id: string; kind: Kind; value: string; sub: string; odds: number; rarity: Rarity };

export const RARITY: Record<Rarity, { label: string; ink: string; text: string; glow: [number, number, number]; base: [number, number, number]; wash: [string, string, string] }> = {
  uncommon: { label: 'Uncommon', ink: '#b9c0d2', text: '#e8edf3', glow: [132, 149, 165], base: [0.29, 0.34, 0.39], wash: ['rgba(185,192,210,0.12)', 'rgba(20,26,34,0.12)', 'rgba(132,149,165,0.12)'] },
  rare: { label: 'Rare', ink: '#84a3f3', text: '#9dbcf7', glow: [93, 183, 191], base: [0.12, 0.31, 0.54], wash: ['rgba(132,163,243,0.16)', 'rgba(8,20,50,0.16)', 'rgba(42,120,202,0.16)'] },
  epic: { label: 'Epic', ink: '#ae84f3', text: '#c3a4f7', glow: [174, 132, 243], base: [0.29, 0.12, 0.54], wash: ['rgba(174,132,243,0.16)', 'rgba(30,8,74,0.16)', 'rgba(120,42,202,0.16)'] },
  legendary: { label: 'Legendary', ink: '#f3b084', text: '#f3ad84', glow: [243, 173, 132], base: [0.54, 0.23, 0.11], wash: ['rgba(243,182,132,0.12)', 'rgba(74,8,8,0.12)', 'rgba(202,53,42,0.12)'] },
  mythic: { label: 'Mythic', ink: '#f384a1', text: '#f5879f', glow: [245, 135, 159], base: [0.61, 0.11, 0.22], wash: ['rgba(243,132,158,0.24)', 'rgba(74,8,15,0.24)', 'rgba(202,42,48,0.24)'] },
};

/** Ten prizes, odds summing to 100, in the order the design lists them. */
export const PRIZES: Prize[] = [
  { id: 'mythic-5000', kind: 'cash', value: '$5,000', sub: 'IN $RTX', odds: 1, rarity: 'mythic' },
  { id: 'leg-bonus', kind: 'bonus', value: '5,000%', sub: 'BONUS', odds: 6, rarity: 'legendary' },
  { id: 'leg-2000', kind: 'cash', value: '$2,000', sub: 'IN $RTX', odds: 2, rarity: 'legendary' },
  { id: 'leg-payfi', kind: 'payfi', value: 'PayFi', sub: 'EARLY ACCESS', odds: 3, rarity: 'legendary' },
  { id: 'epic-1000', kind: 'cash', value: '$1,000', sub: 'IN $RTX', odds: 4, rarity: 'epic' },
  { id: 'epic-bonus', kind: 'bonus', value: '2,500%', sub: 'BONUS', odds: 11, rarity: 'epic' },
  { id: 'epic-500', kind: 'cash', value: '$500', sub: 'IN $RTX', odds: 10, rarity: 'epic' },
  { id: 'rare-250', kind: 'cash', value: '$250', sub: 'IN $RTX', odds: 15, rarity: 'rare' },
  { id: 'rare-bonus', kind: 'bonus', value: '1,000%', sub: 'BONUS', odds: 18, rarity: 'rare' },
  { id: 'unc-100', kind: 'cash', value: '$100', sub: 'IN $RTX', odds: 30, rarity: 'uncommon' },
];

export const BOX = { price: 100, left: 1_000 };
export const PAY: TokenId[] = ['ETH', 'BTC'];
export const rate = (id: TokenId) => TOKENS.find((t) => t.id === id)?.usd ?? 1;

/** What a prize reads as in the claimed list. */
export const reward = (p: Prize) => (p.kind === 'payfi' ? 'PayFi early access' : p.kind === 'bonus' ? `${p.value} bonus` : `${p.value} in $RTX`);

/** Draw by the odds. */
export function draw(rnd = Math.random): Prize {
  let r = rnd() * 100;
  for (const p of PRIZES) {
    r -= p.odds;
    if (r < 0) return p;
  }
  return PRIZES[PRIZES.length - 1];
}

export type Claim = { id: number; prize: Prize; box: string; spent: number; when: Date };
export const BOXES = ['Treasure chest', 'Gift pack', 'Surprise box', 'Mystery box'];

/** A seeded history so the table has pages to turn from the first visit. */
export function seedClaims(n = 28): Claim[] {
  let s = 7;
  const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  const out: Claim[] = [];
  const t0 = Date.UTC(2026, 6, 24, 16, 45);
  for (let i = 0; i < n; i++) {
    const prize = draw(rnd);
    out.push({ id: 900 - i, prize, box: BOXES[Math.floor(rnd() * BOXES.length)], spent: BOX.price * (1 + Math.floor(rnd() * 3)), when: new Date(t0 - i * (2.5 + rnd() * 6) * 3_600_000) });
  }
  return out;
}

export const PAGE = 9;
export const when = (d: Date) => `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

// The rank ladder behind the sidebar card. Points come from play, one point per cent wagered.

export type Rank = { name: string; from: number; reward: string };

export const RANKS: Rank[] = [
  { name: 'Bronze', from: 0, reward: 'A free daily spin on the wheel' },
  { name: 'Silver', from: 650_000, reward: 'A weekly cash drop of up to $50' },
  { name: 'Gold', from: 1_500_000, reward: 'Weekly cash drops of up to $200 and a personal host' },
  { name: 'Platinum', from: 4_000_000, reward: 'Cash drops of up to $500 and withdrawals first in line' },
  { name: 'Diamond', from: 10_000_000, reward: 'Cash drops of up to $1,000 and invites to private events' },
];

/** 550000 reads 550K, 1500000 reads 1.5M, the way the Figma rank card writes points. */
export function shortPoints(n: number) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

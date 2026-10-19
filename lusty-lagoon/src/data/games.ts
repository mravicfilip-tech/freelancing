// The game catalogue, from the covers in the Figma lobby and landing frames. Providers, RTP and
// volatility are mock values in the shape a game aggregator returns.

export type Category = 'slots' | 'megaways' | 'hold-and-win' | 'fish' | 'new';

export type CatalogueGame = {
  id: string;
  name: string;
  provider: string;
  /** Portrait cover, 3 by 4. */
  image: string;
  /** Landscape cover, 3 by 2, where the Figma has one. */
  wide?: string;
  category: Category;
  rtp: number;
  volatility: 'Low' | 'Medium' | 'High';
  tag?: string;
};

const tall = (id: string) => `/art/games/${id}.webp`;
const wide = (id: string) => `/art/games/${id}-wide.webp`;

export const GAMES: CatalogueGame[] = [
  { id: 'sugar-rush', name: 'Sugar Rush', provider: 'Pragmatic Play', image: wide('sugar-rush'), wide: wide('sugar-rush'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot' },
  { id: 'scarab-wheel', name: 'Scarab Wheel', provider: 'Pragmatic Play', image: tall('scarab-wheel'), wide: wide('scarab-wheel'), category: 'slots', rtp: 96.2, volatility: 'Medium', tag: 'Exclusive' },
  { id: 'coin-volcano', name: 'Coin Volcano', provider: '3 Oaks Gaming', image: wide('coin-volcano'), wide: wide('coin-volcano'), category: 'hold-and-win', rtp: 95.8, volatility: 'Medium' },
  { id: 'aztec-fire', name: 'Aztec Fire', provider: '3 Oaks Gaming', image: tall('aztec-fire'), category: 'hold-and-win', rtp: 95.6, volatility: 'Medium' },
  { id: 'wolf-gold', name: 'Wolf Gold', provider: 'Pragmatic Play', image: tall('wolf-gold'), category: 'slots', rtp: 96.0, volatility: 'Medium' },
  { id: 'gates-of-olympus', name: 'Gates of Olympus', provider: 'Pragmatic Play', image: tall('gates-of-olympus'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot' },
  { id: 'zeus-thunderbolt', name: "Zeus's Thunderbolt 5000", provider: 'NetGaming', image: tall('zeus-thunderbolt'), category: 'slots', rtp: 96.1, volatility: 'High', tag: 'New' },
  { id: 'mad-max', name: "Mad Max, Furiosa's Revenge", provider: 'Relax Gaming', image: tall('mad-max'), category: 'megaways', rtp: 96.3, volatility: 'High' },
  { id: 'festival-of-fortune', name: 'Festival of Fortune', provider: 'NetGaming', image: tall('festival-of-fortune'), category: 'new', rtp: 95.9, volatility: 'Low', tag: 'New' },
  { id: 'tiki-boom', name: 'Tiki Boom', provider: 'Gamzix', image: tall('tiki-boom'), category: 'slots', rtp: 96.0, volatility: 'Medium' },
  { id: 'super-boom', name: 'Super Boom', provider: 'Gamzix', image: tall('super-boom'), category: 'slots', rtp: 95.7, volatility: 'High' },
  { id: 'sumo-supreme', name: 'Sumo Supreme Megaways', provider: 'Pragmatic Play', image: tall('sumo-supreme'), category: 'megaways', rtp: 96.5, volatility: 'High' },
];

export const CATEGORIES: { value: 'all' | Category; label: string }[] = [
  { value: 'all', label: 'All games' },
  { value: 'slots', label: 'Slots' },
  { value: 'megaways', label: 'Megaways' },
  { value: 'hold-and-win', label: 'Hold and win' },
  { value: 'fish', label: 'Fish games' },
  { value: 'new', label: 'New' },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

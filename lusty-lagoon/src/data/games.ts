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
  /** True when the Figma only has a landscape cover, so portrait grids leave it out. */
  wideOnly?: boolean;
};

const tall = (id: string) => `/art/games/${id}.webp`;
const wide = (id: string) => `/art/games/${id}-wide.webp`;

export const GAMES: CatalogueGame[] = [
  { id: 'chilli-madness', name: 'Chilli Madness', provider: 'EGT', image: wide('chilli-madness'), wide: wide('chilli-madness'), category: 'slots', rtp: 95.9, volatility: 'Medium', wideOnly: true },
  { id: 'sweet-bonanza', name: 'Sweet Bonanza', provider: 'Pragmatic Play', image: wide('sweet-bonanza'), wide: wide('sweet-bonanza'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot', wideOnly: true },
  { id: 'running-sushi', name: 'Running Sushi', provider: 'Habanero', image: wide('running-sushi'), wide: wide('running-sushi'), category: 'slots', rtp: 96.2, volatility: 'Medium', wideOnly: true },
  { id: 'sugar-rush', name: 'Sugar Rush', provider: 'Pragmatic Play', image: wide('sugar-rush'), wide: wide('sugar-rush'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot', wideOnly: true },
  { id: 'billy-bob-boom', name: 'Billy Bob Boom', provider: 'Fugaso', image: wide('billy-bob-boom'), wide: wide('billy-bob-boom'), category: 'hold-and-win', rtp: 96.0, volatility: 'High', wideOnly: true },
  { id: 'wolf-howl', name: 'Wolf Howl', provider: 'Spinomenal', image: wide('wolf-howl'), wide: wide('wolf-howl'), category: 'slots', rtp: 96.1, volatility: 'Medium', wideOnly: true },
  { id: 'donny-dough', name: 'Donny Dough', provider: 'Pragmatic Play', image: wide('donny-dough'), wide: wide('donny-dough'), category: 'new', rtp: 96.0, volatility: 'Medium', tag: 'New', wideOnly: true },
  { id: 'cash-of-gods', name: 'Cash of Gods', provider: 'Pragmatic Play', image: wide('cash-of-gods'), wide: wide('cash-of-gods'), category: 'megaways', rtp: 96.4, volatility: 'High', tag: 'Exclusive', wideOnly: true },
  { id: 'lucky-bass', name: 'Lucky Bass Mega Cash Collect', provider: 'Playtech', image: wide('lucky-bass'), wide: wide('lucky-bass'), category: 'fish', rtp: 95.9, volatility: 'Medium', wideOnly: true },
  { id: 'book-of-ra', name: 'Book of Ra 6 Deluxe', provider: 'Novomatic', image: wide('book-of-ra'), wide: wide('book-of-ra'), category: 'slots', rtp: 95.1, volatility: 'High', wideOnly: true },
  { id: 'scarab-wheel', name: 'Scarab Wheel', provider: 'Pragmatic Play', image: tall('scarab-wheel'), wide: wide('scarab-wheel'), category: 'slots', rtp: 96.2, volatility: 'Medium', tag: 'Exclusive' },
  { id: 'coin-volcano', name: 'Coin Volcano', provider: '3 Oaks Gaming', image: wide('coin-volcano'), wide: wide('coin-volcano'), category: 'hold-and-win', rtp: 95.8, volatility: 'Medium', wideOnly: true },
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

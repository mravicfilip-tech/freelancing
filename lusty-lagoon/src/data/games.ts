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
  /** A shorter name for narrow cards, as the Figma writes it. */
  short?: string;
};

const tall = (id: string) => `/art/games/${id}.webp`;
const wide = (id: string) => `/art/games/${id}-wide.webp`;

export const GAMES: CatalogueGame[] = [
  { id: 'sugar-rush', name: 'Sugar Rush', provider: 'Pragmatic Play', image: tall('sugar-rush'), wide: wide('sugar-rush'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot' },
  { id: 'sweet-bonanza', name: 'Sweet Bonanza', provider: 'Pragmatic Play', image: tall('sweet-bonanza'), wide: wide('sweet-bonanza'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot' },
  { id: 'lucky-dwarfs', name: 'Lucky Dwarfs', provider: 'Fugaso', image: tall('lucky-dwarfs'), category: 'slots', rtp: 96.0, volatility: 'Medium', tag: 'Exclusive' },
  { id: 'scarab-wheel', name: 'Scarab Wheel', provider: 'Pragmatic Play', image: tall('scarab-wheel'), wide: wide('scarab-wheel'), category: 'slots', rtp: 96.2, volatility: 'Medium', tag: 'Exclusive' },
  { id: 'billy-bob-boom', name: 'Billy Bob Boom', provider: 'Fugaso', image: tall('billy-bob-boom'), wide: wide('billy-bob-boom'), category: 'hold-and-win', rtp: 96.0, volatility: 'High' },
  { id: 'gates-of-olympus', name: 'Gates of Olympus', provider: 'Pragmatic Play', image: tall('gates-of-olympus'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot' },
  { id: 'aztec-fire', name: 'Aztec Fire', provider: '3 Oaks Gaming', image: tall('aztec-fire'), category: 'hold-and-win', rtp: 95.6, volatility: 'Medium' },
  { id: 'book-of-ra', name: 'Book of Ra 6 Deluxe', provider: 'Novomatic', image: tall('book-of-ra'), wide: wide('book-of-ra'), category: 'slots', rtp: 95.1, volatility: 'High', short: 'Book of Ra' },
  { id: 'big-bass-splash', name: 'Big Bass Splash', provider: 'Pragmatic Play', image: tall('big-bass-splash'), category: 'fish', rtp: 96.7, volatility: 'High', tag: 'Hot' },
  { id: 'dog-house-multihold', name: 'The Dog House Multihold', provider: 'Pragmatic Play', image: tall('dog-house-multihold'), category: 'hold-and-win', rtp: 96.0, volatility: 'High' },
  { id: 'wolf-gold', name: 'Wolf Gold', provider: 'Pragmatic Play', image: tall('wolf-gold'), category: 'slots', rtp: 96.0, volatility: 'Medium' },
  { id: 'zeus-thunderbolt', name: 'Zeus\'s Thunderbolt 5000', provider: 'NetGaming', image: tall('zeus-thunderbolt'), category: 'slots', rtp: 96.1, volatility: 'High', tag: 'New' },
  { id: 'mad-max', name: 'Mad Max, Furiosa\'s Revenge', provider: 'Relax Gaming', image: tall('mad-max'), category: 'megaways', rtp: 96.3, volatility: 'High' },
  { id: 'festival-of-fortune', name: 'Festival of Fortune', provider: 'NetGaming', image: tall('festival-of-fortune'), category: 'new', rtp: 95.9, volatility: 'Low', tag: 'New' },
  { id: 'tiki-boom', name: 'Tiki Boom', provider: 'Gamzix', image: tall('tiki-boom'), category: 'slots', rtp: 96.0, volatility: 'Medium' },
  { id: 'super-boom', name: 'Super Boom', provider: 'Gamzix', image: tall('super-boom'), category: 'slots', rtp: 95.7, volatility: 'High' },
  { id: 'sumo-supreme', name: 'Sumo Supreme Megaways', provider: 'Pragmatic Play', image: tall('sumo-supreme'), category: 'megaways', rtp: 96.5, volatility: 'High' },
  { id: 'scruffy-duck', name: 'Scruffy Duck', provider: 'NetEnt', image: tall('scruffy-duck'), category: 'slots', rtp: 96.2, volatility: 'Medium' },
  { id: 'dwarf-and-dragon', name: 'Dwarf and Dragon', provider: 'Rotativka', image: tall('dwarf-and-dragon'), category: 'slots', rtp: 96.0, volatility: 'Medium' },
  { id: 'beware-the-deep', name: 'Beware the Deep Megaways', provider: 'Pragmatic Play', image: tall('beware-the-deep'), category: 'fish', rtp: 96.5, volatility: 'High' },
  { id: 'lava-lions', name: 'Lava Lions', provider: 'Gaming Corps', image: tall('lava-lions'), category: 'slots', rtp: 96.1, volatility: 'Medium' },
  { id: 'diamond-king-gold', name: 'Diamond King Gold', provider: 'Pragmatic Play', image: tall('diamond-king-gold'), category: 'hold-and-win', rtp: 96.0, volatility: 'Medium' },
  { id: 'five-lions', name: '5 Lions Megaways', provider: 'Pragmatic Play', image: tall('five-lions'), category: 'megaways', rtp: 96.5, volatility: 'High' },
  { id: 'release-the-kraken', name: 'Release the Kraken Megaways', provider: 'Pragmatic Play', image: tall('release-the-kraken'), category: 'megaways', rtp: 96.5, volatility: 'High' },
  { id: 'farm-hunt', name: 'Farm Hunt', provider: 'Gamzix', image: tall('farm-hunt'), category: 'new', rtp: 96.0, volatility: 'Medium', tag: 'New' },
  { id: 'battle-dwarf', name: 'Battle Dwarf', provider: 'Rotativka', image: tall('battle-dwarf'), category: 'slots', rtp: 95.8, volatility: 'Medium' },
  { id: 'hell-hot', name: 'Hell Hot 40', provider: 'Rotativka', image: tall('hell-hot'), category: 'slots', rtp: 96.0, volatility: 'Medium' },
  { id: 'gold-fever', name: 'Gold Fever Fortune', provider: 'Gamzix', image: tall('gold-fever'), category: 'slots', rtp: 95.9, volatility: 'Medium' },
  { id: 'coins-of-alkemor', name: 'Coins of Alkemor', provider: '3 Oaks Gaming', image: tall('coins-of-alkemor'), category: 'hold-and-win', rtp: 95.7, volatility: 'Medium', tag: 'New' },
  { id: 'cash-n-riches', name: 'Cash \'n Riches Megaways', provider: 'Rotativka', image: tall('cash-n-riches'), category: 'megaways', rtp: 96.0, volatility: 'High' },
  { id: 'dwarven-gems', name: 'Dwarven Gems Megaways', provider: 'Rotativka', image: tall('dwarven-gems'), category: 'megaways', rtp: 96.1, volatility: 'High' },
  { id: 'buffalo-mania', name: 'Buffalo Mania Megaways', provider: 'Rotativka', image: tall('buffalo-mania'), category: 'megaways', rtp: 96.0, volatility: 'High' },
  { id: 'boom-boom-gold', name: 'Boom Boom Gold', provider: '3 Oaks Gaming', image: tall('boom-boom-gold'), category: 'hold-and-win', rtp: 95.8, volatility: 'Medium' },
  { id: 'primate-king', name: 'Primate King Megaways', provider: 'Relax Gaming', image: tall('primate-king'), category: 'megaways', rtp: 96.2, volatility: 'High' },
  { id: 'buffalo-king', name: 'Buffalo King Megaways', provider: 'Pragmatic Play', image: tall('buffalo-king'), category: 'megaways', rtp: 96.5, volatility: 'High' },
  { id: 'jokers-jewels', name: 'Joker\'s Jewels Jackpot Play', provider: 'Pragmatic Play', image: tall('jokers-jewels'), category: 'slots', rtp: 96.5, volatility: 'Medium' },
  { id: 'take-the-bank', name: 'Take the Bank', provider: 'Betsoft', image: tall('take-the-bank'), category: 'slots', rtp: 96.0, volatility: 'Medium', tag: 'New' },
  { id: 'laughing-buddha', name: 'Laughing Buddha', provider: 'Habanero', image: tall('laughing-buddha'), category: 'slots', rtp: 96.7, volatility: 'Medium' },
  { id: 'chicken-rush', name: 'Chicken Rush', provider: 'Gamzix', image: tall('chicken-rush'), category: 'new', rtp: 96.0, volatility: 'Medium', tag: 'New' },
  { id: 'starlight-princess', name: 'Starlight Princess 1000', provider: 'Pragmatic Play', image: tall('starlight-princess'), category: 'slots', rtp: 96.5, volatility: 'High', tag: 'Hot' },
  { id: 'capypark', name: 'Capypark', provider: 'Gamzix', image: tall('capypark'), category: 'new', rtp: 96.0, volatility: 'Medium', tag: 'New' },
  { id: '888-dragons', name: '888 Dragons', provider: 'Pragmatic Play', image: tall('888-dragons'), category: 'slots', rtp: 96.8, volatility: 'Low' },
  { id: 'chilli-madness', name: 'Chilli Madness', provider: 'EGT', image: wide('chilli-madness'), wide: wide('chilli-madness'), category: 'slots', rtp: 95.9, volatility: 'Medium', wideOnly: true },
  { id: 'running-sushi', name: 'Running Sushi', provider: 'Habanero', image: wide('running-sushi'), wide: wide('running-sushi'), category: 'slots', rtp: 96.2, volatility: 'Medium', wideOnly: true },
  { id: 'coin-volcano', name: 'Coin Volcano', provider: '3 Oaks Gaming', image: wide('coin-volcano'), wide: wide('coin-volcano'), category: 'hold-and-win', rtp: 95.8, volatility: 'Medium', wideOnly: true },
  { id: 'wolf-howl', name: 'Wolf Howl', provider: 'Spinomenal', image: wide('wolf-howl'), wide: wide('wolf-howl'), category: 'slots', rtp: 96.1, volatility: 'Medium', wideOnly: true },
  { id: 'donny-dough', name: 'Donny Dough', provider: 'Pragmatic Play', image: wide('donny-dough'), wide: wide('donny-dough'), category: 'new', rtp: 96.0, volatility: 'Medium', tag: 'New', wideOnly: true },
  { id: 'cash-of-gods', name: 'Cash of Gods', provider: 'Pragmatic Play', image: wide('cash-of-gods'), wide: wide('cash-of-gods'), category: 'megaways', rtp: 96.4, volatility: 'High', tag: 'Exclusive', wideOnly: true },
  { id: 'lucky-bass', name: 'Lucky Bass Mega Cash Collect', provider: 'Playtech', image: wide('lucky-bass'), wide: wide('lucky-bass'), category: 'fish', rtp: 95.9, volatility: 'Medium', wideOnly: true },
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

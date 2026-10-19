// Mock data for Tip, Figma 370:24. The Figma has a coin dropdown, a username, an amount and a line
// saying the tip arrives in 2 hours. Players, limits and the daily total are made up.

export const TIP = {
  min: 1,
  dailyLimit: 1000,
  usedToday: 250,
  /** The player's own username, so a tip to oneself can be refused. */
  me: 'JohnD',
  arrives: 'within 2 hours',
  noteMax: 80,
};

export const PLAYERS = [
  'Peki972',
  'Niksa74',
  'LuckyMango',
  'SunsetRoller',
  'KaiTheWinner',
  'Zorana_B',
  'DiceQueen88',
  'Ficko1',
  'Tane4',
  'Alice_G',
  'MilaR',
  'WolfGoldFan',
];

export const RECENT_RECIPIENTS = ['Peki972', 'Zorana_B', 'LuckyMango', 'Ficko1'];

// 40 recent recipients for the large list state. All of them exist in the directory check below.
export const largeRecipients = () => Array.from({ length: 40 }, (_, i) => `Player${String(100 + i * 7).padStart(4, '0')}`);

export const findPlayer = (username: string): string | undefined => {
  const u = username.trim().toLowerCase();
  const hit = PLAYERS.find((p) => p.toLowerCase() === u);
  if (hit) return hit;
  return /^player\d{4}$/.test(u) ? `Player${u.slice(6)}` : undefined;
};

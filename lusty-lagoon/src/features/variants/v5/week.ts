// The player's week, closing balance per day in USDT, rebuilt from the wallet history in
// data/wallet.ts and the session results in CONTINUE_PLAYING. Today closes on the live balance, so
// a deposit made in this tab moves today's bar and the day's change with it.
//
// Sun 18 Oct, PayPal withdrawal 250.00 pending, Visa deposit 97.50, Gates of Olympus down 40.00.
// Sat 17 Oct, BTC withdrawal 1,230.63, Big Bass Splash up 12.50. Fri 16 Oct, ETH deposit 905.00,
// Wolf Gold down 25.00. Thu 15 Oct, LTC deposit 295.68, down 60.00 on slots. Wed 14 Oct, up 38.00.

export const WEEK: { day: string; date: string; close: number }[] = [
  { day: 'Tue', date: '13 Oct', close: 2188.95 },
  { day: 'Wed', date: '14 Oct', close: 2226.95 },
  { day: 'Thu', date: '15 Oct', close: 2462.63 },
  { day: 'Fri', date: '16 Oct', close: 3342.63 },
  { day: 'Sat', date: '17 Oct', close: 2124.5 },
  { day: 'Sun', date: '18 Oct', close: 1932 },
];

/** Today so far, the USDT TRC20 deposit at 09:41 and the Sugar Rush session of 12 minutes ago. */
export const TODAY = { date: '19 Oct', deposited: 500, won: 60, game: 'Sugar Rush' };

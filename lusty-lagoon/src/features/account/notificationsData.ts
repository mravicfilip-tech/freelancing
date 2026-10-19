// Mock notifications. Times are minutes before the page loaded, so labels stay stable in a shot
// and read naturally to anyone who opens the page.

export type NotificationKind = 'deposit' | 'withdrawal' | 'declined' | 'reward' | 'giveaway' | 'security';

// A body is plain text with highlighted runs, such as an amount, kept apart from any markup.
export type BodyPart = string | { b: string };

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: BodyPart[];
  minutesAgo: number;
  read: boolean;
  /** Where selecting the item goes. */
  href: string;
};

export const BASE_ITEMS: NotificationItem[] = [
  {
    id: 'n-deposit-btc',
    kind: 'deposit',
    title: 'Deposit received',
    body: [{ b: '0.0042 BTC' }, ' landed in your balance. That is ', { b: '280.00 USDT' }, '.'],
    minutesAgo: 4,
    read: false,
    href: '/wallet/deposit',
  },
  {
    id: 'n-withdrawal-sent',
    kind: 'withdrawal',
    title: 'Withdrawal sent',
    body: [{ b: '1,200.00 USDT' }, ' is on its way to your Tron (TRC20) address TQ4x...9Lm2. It can take up to 15 minutes to arrive.'],
    minutesAgo: 38,
    read: false,
    href: '/wallet/withdraw',
  },
  {
    id: 'n-rank-reward',
    kind: 'reward',
    title: 'Your Bronze reward is ready',
    body: ['You reached ', { b: '550K points' }, '. Claim ', { b: '50 free spins' }, ' on Sugar Rush from the lobby.'],
    minutesAgo: 125,
    read: false,
    href: '/lobby',
  },
  {
    id: 'n-giveaway',
    kind: 'giveaway',
    title: 'Weekend giveaway starts at 20:00',
    body: ['Share ', { b: '25,000 USDT' }, ' with other players. Join from the lobby before it starts.'],
    minutesAgo: 310,
    read: true,
    href: '/lobby',
  },
  {
    id: 'n-signin',
    kind: 'security',
    title: 'New sign-in to your account',
    body: ['Chrome on Windows, Belgrade, Serbia. If this was not you, change your password now.'],
    minutesAgo: 17 * 60 + 40,
    read: true,
    href: '/account?section=account',
  },
  {
    id: 'n-declined-visa',
    kind: 'declined',
    title: 'Card deposit declined',
    body: ['Your Visa ending ', { b: '4821' }, ' was declined for ', { b: '$250.00' }, '. Try another method or contact your bank.'],
    minutesAgo: 26 * 60 + 12,
    read: true,
    href: '/wallet/deposit',
  },
  {
    id: 'n-deposit-usdt',
    kind: 'deposit',
    title: 'Deposit received',
    body: [{ b: '500.00 USDT' }, ' on Tron (TRC20) landed in your balance after 20 confirmations.'],
    minutesAgo: 2 * 24 * 60 + 95,
    read: true,
    href: '/wallet/deposit',
  },
  {
    id: 'n-withdrawal-long',
    kind: 'withdrawal',
    title: 'Withdrawal sent to a saved bank account with a very long reference name that has to wrap',
    body: [
      { b: '$3,480.00' },
      ' was sent by wire transfer to Banca Intesa Beograd, reference LUSTLGNTXN1234567890ABCDEFGHIJKLMNOP. Wire transfers take 1 to 3 days.',
    ],
    minutesAgo: 4 * 24 * 60 + 20,
    read: true,
    href: '/wallet/withdraw',
  },
  {
    id: 'n-giveaway-won',
    kind: 'giveaway',
    title: 'You won a giveaway spot',
    body: ['You are in the Friday draw for ', { b: '10,000 USDT' }, '. Winners are listed in the lobby at 21:00.'],
    minutesAgo: 6 * 24 * 60 + 300,
    read: true,
    href: '/lobby',
  },
];

// A very large list for the ?state=large shot, built from the base items.
export function largeItems(count = 120): NotificationItem[] {
  return Array.from({ length: count }, (_, i) => {
    const base = BASE_ITEMS[i % BASE_ITEMS.length];
    return { ...base, id: `${base.id}-${i}`, minutesAgo: base.minutesAgo + i * 90, read: i > 6 ? true : base.read };
  });
}

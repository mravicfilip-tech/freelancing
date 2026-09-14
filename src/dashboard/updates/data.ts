/**
 * Project updates, newest first. Each has the two-part headline the reference
 * sets, a category, a one-line excerpt for lists, and the body the reader
 * layout shows in full.
 */
export type Category = 'Dev release' | 'Announcement' | 'Presale' | 'Security';

export type Update = {
  id: number;
  /** The release number the team counts by. */
  n: number;
  title: string;
  accent: string;
  category: Category;
  date: string;
  excerpt: string;
  body: string[];
};

export const CATEGORIES: Category[] = ['Dev release', 'Announcement', 'Presale', 'Security'];

export const UPDATES: Update[] = [
  {
    id: 123, n: 123, title: 'Explorer designs,', accent: 'first pass', category: 'Dev release', date: '2026-09-14',
    excerpt: 'The transaction explorer has its first screens: search by hash or wallet, a block view, and the fee breakdown per transfer.',
    body: [
      'The explorer is the last piece of the PayFi stack that had no face. This week it got one: a search that takes a hash, a wallet or an order number, a block view that reads left to right, and a fee panel that shows every leg of a transfer on one line.',
      'Design is in review with the PayFi team. Engineering starts on the search and block views next sprint; the fee panel waits for the settlement API, which lands with release 125.',
      'If you want to follow along, the Figma file is linked from the Updates channel in Discord.',
    ],
  },
  {
    id: 122, n: 122, title: 'Pay with crypto', accent: 'anywhere and everywhere', category: 'Announcement', date: '2026-09-07',
    excerpt: 'The Remittix card is confirmed for launch: a virtual card funded from your balance, accepted wherever cards are.',
    body: [
      'The card program has cleared its issuer review. At launch, every verified account can open a virtual card funded straight from its $RTX or stablecoin balance, with the conversion made at the moment of spend.',
      'Physical cards follow in the first quarter after listing. Fees are flat and published up front: no FX mark-up, no monthly charge, a fixed cost per ATM withdrawal.',
    ],
  },
  {
    id: 121, n: 121, title: 'Cross-border bank transfers', accent: 'using crypto', category: 'Dev release', date: '2026-08-31',
    excerpt: 'Send to a bank account in another country from a wallet, with one flat fee and same-day settlement in most corridors.',
    body: [
      'Cross-border transfers are live on testnet. You pick the destination country and enter a local account number; Remittix handles the rails, the FX and the compliance checks, and the recipient sees an ordinary bank transfer.',
      'The first corridors are the UK, the EU, Nigeria and the Philippines. Settlement is same-day in all four in testing, with the fee quoted before you confirm.',
    ],
  },
  {
    id: 120, n: 120, title: 'Pay any fiat bank account', accent: 'using crypto', category: 'Dev release', date: '2026-08-24',
    excerpt: 'Domestic bank payouts from a wallet: IBAN or account number in, a normal bank transfer out.',
    body: [
      'The domestic payout flow is complete. Enter an IBAN or an account number and sort code, pick the amount in crypto or in the local currency, and the transfer lands as a normal bank payment with your reference on it.',
      'Payouts are batched every fifteen minutes on testnet; production will settle on the receiving bank\'s schedule.',
    ],
  },
  {
    id: 119, n: 119, title: 'Fiat rails', accent: 'for crypto businesses', category: 'Dev release', date: '2026-08-17',
    excerpt: 'Businesses can settle invoices in 30+ currencies straight from a wallet, with the FX rate locked at send.',
    body: [
      'Business accounts get their own rails this release: bulk payouts from a CSV, an approval step for payments over a threshold you set, and an FX rate that is locked the moment a payment is sent rather than when it clears.',
      'Thirty-one currencies are supported at launch. Statements export as CSV and as a PDF your accountant will recognise.',
    ],
  },
  {
    id: 118, n: 118, title: 'Presale dashboard', accent: 'goes live', category: 'Presale', date: '2026-08-10',
    excerpt: 'Your balance, the stage ladder, referrals and live orders in one place, on desktop and phone.',
    body: [
      'The dashboard you are reading this on shipped today. It shows your $RTX balance and what it is worth at listing, the stage ladder with the price at every step, your referral earnings, and every purchase across the presale as it clears.',
      'It works on a phone with a bar under the thumb for the four things people do most. Tell us what is missing in the Updates channel.',
    ],
  },
  {
    id: 117, n: 117, title: 'Security audit', accent: 'completed', category: 'Security', date: '2026-08-03',
    excerpt: 'The token and presale contracts passed their audit with no critical or high findings; the report is public.',
    body: [
      'The audit of the $RTX token contract and the presale contract is complete. There were no critical or high-severity findings; two medium findings were fixed and re-verified before the report was signed off.',
      'The full report is linked from the Audits section of the site. Contract addresses are unchanged.',
    ],
  },
  {
    id: 116, n: 116, title: 'Referral programme:', accent: '15% in USDT', category: 'Presale', date: '2026-07-27',
    excerpt: 'Share your link and earn 15% of everything your friends buy, paid in USDT and claimable from the dashboard.',
    body: [
      'Referrals are live. Every account has a link; anyone who buys through it earns you 15% of their purchase in USDT, claimable from the dashboard as soon as their purchase clears.',
      'There is no cap and no lock-up on referral earnings.',
    ],
  },
  {
    id: 115, n: 115, title: 'Stage 11', accent: 'sold out', category: 'Presale', date: '2026-07-20',
    excerpt: 'Stage 11 closed four days early. Stage 12 opened at $0.18, the last stage before the $0.25 listing.',
    body: [
      'Stage 11 sold out on Thursday, four days ahead of its schedule. Stage 12 is open at $0.18 and is the final stage; the token lists at $0.25.',
    ],
  },
  {
    id: 114, n: 114, title: 'Wallet connect', accent: 'on mobile', category: 'Dev release', date: '2026-07-13',
    excerpt: 'Connect a mobile wallet to the presale with a tap instead of a QR code and a desktop.',
    body: [
      'Mobile wallets connect directly now. Open the presale on your phone, tap Connect, and your wallet app takes over; no QR code and no second device.',
    ],
  },
  {
    id: 113, n: 113, title: 'Card payments', accent: 'now accepted', category: 'Presale', date: '2026-07-06',
    excerpt: 'Buy $RTX with a Visa or Mastercard alongside ETH, BTC, USDT, USDC, SOL and BNB.',
    body: [
      'Card payments are open on the presale. Visa and Mastercard are accepted in all supported regions, and a card purchase clears into your balance the same way a crypto one does.',
    ],
  },
  {
    id: 112, n: 112, title: 'Roadmap update', accent: 'for Q4', category: 'Announcement', date: '2026-06-29',
    excerpt: 'Listing, the card launch and the PayFi beta are the three dates that matter this quarter.',
    body: [
      'Three dates for the quarter: the $RTX listing when stage 12 closes, the virtual card launch two weeks after, and the PayFi beta for business accounts in the last week of the quarter.',
    ],
  },
];

export const PAGE_SIZE = 8;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** "14 Sep 2026" for rows, "September 2026" for group headers. */
export function fmtDate(iso: string, style: 'row' | 'month' = 'row') {
  const [y, m, d] = iso.split('-').map(Number);
  if (style === 'month') return `${MONTHS[m - 1]} ${y}`;
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

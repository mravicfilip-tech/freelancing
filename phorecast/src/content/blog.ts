/* The blog's posts: every article on /blog and /blog/<slug>, in one place.
   ---------------------------------------------------------------------------
   TODO(client): the six posts below are PLACEHOLDER COPY, written so the two
   pages can be built and reviewed with realistic lengths. They make no product
   claims (fees, regulation, payouts) and should be replaced with the client's
   own articles before launch.

   ADDING A POST is one object in POSTS:

     slug      the URL segment, /blog/<slug>. Lowercase, hyphens, unique.
     title     the h1 and the card title.
     excerpt   one or two sentences for the card and the page's lede.
     category  one of CATEGORIES; the index page filters on it.
     date      ISO 'YYYY-MM-DD', the publication date. Posts sort newest first.
     author    the byline.
     cover     OPTIONAL. An imported image (`import img from '../assets/…'`).
               Without one the card and the post show the branded placeholder
               cover (BlogCover in components/blog/BlogCover.tsx).
     body      the article, as blocks: 'h2' starts a section (and becomes an
               entry in the post's "On this page" list), 'p' is a paragraph,
               'ul' is a bulleted list. Plain text only, by design: no
               markdown, no HTML, so a post cannot break the page.

   The read time is worked out from the body (readMinutes below), so it cannot
   drift from the text.

   COPY RULES the client has set for the whole site apply here too: no long
   dashes in sentences and no bold sentences. */

export const CATEGORIES = ['Announcements', 'Learn', 'Guides', 'Markets'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Block =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  date: string;
  author: string;
  cover?: string;
  body: Block[];
}

const TEAM = 'Phorcast Team';

const POSTS: Post[] = [
  {
    slug: 'introducing-phorcast',
    title: 'Introducing Phorcast: trade the outcome, not the asset',
    excerpt:
      'Why we built a prediction market for real-world events, and what you can do on it from day one.',
    category: 'Announcements',
    date: '2026-09-22',
    author: TEAM,
    body: [
      { type: 'p', text: 'Most ways of acting on a view about the world are indirect. You think a company will beat its earnings, so you buy the stock and hope the market agrees for the same reason. You think a central bank will hold rates, and there is no simple way to say so at all. Phorcast was built to make that view the thing you trade.' },
      { type: 'h2', text: 'What Phorcast is' },
      { type: 'p', text: 'Phorcast is a prediction market. Every market asks a question with a clear answer, such as whether an index closes above a level on a given day. You buy YES or NO, and the price of each side moves as other traders change their minds.' },
      { type: 'p', text: 'Live markets, portfolio tracking, analytics and one-step crypto deposits sit in one place, so following a market and acting on it happen on the same screen.' },
      { type: 'h2', text: 'What you can trade' },
      { type: 'ul', items: ['Crypto, stocks and indices', 'Forex and commodities', 'Sports and other real-world events'] },
      { type: 'h2', text: 'What comes next' },
      { type: 'p', text: 'We will use this blog for product updates, explainers for anyone new to prediction markets, and a regular look at the markets people are watching. If there is something you would like us to cover, tell us on X, Discord or Telegram.' },
    ],
  },
  {
    slug: 'what-is-a-prediction-market',
    title: 'What is a prediction market?',
    excerpt:
      'A plain explanation of how prediction markets work, who sets the prices and why they are useful even if you never trade.',
    category: 'Learn',
    date: '2026-09-18',
    author: TEAM,
    body: [
      { type: 'p', text: 'A prediction market is a place to buy and sell positions on the outcome of an event. Each market asks one question. When the event happens, positions on the correct answer are worth the full amount and positions on the other side are worth nothing.' },
      { type: 'h2', text: 'Questions with a clear answer' },
      { type: 'p', text: 'A good market question leaves no room for argument once the event is over. It names what will happen, by when, and which source settles it. That is what lets thousands of people trade the same question and agree on the result.' },
      { type: 'h2', text: 'Prices set by traders' },
      { type: 'p', text: 'Nobody at Phorcast decides what a position costs. The price is simply where buyers and sellers meet. If more people believe YES, they bid the YES price up, and the NO price falls to match.' },
      { type: 'h2', text: 'Why the price is useful' },
      { type: 'p', text: 'Because each side settles at a fixed amount, the price of YES can be read as the crowd’s estimate of how likely the event is. A price of 70 cents means traders, taken together, think the outcome is about 70% likely. You can follow that number without ever placing a trade.' },
    ],
  },
  {
    slug: 'yes-or-no-reading-market-prices',
    title: 'YES or NO: how a market price becomes a probability',
    excerpt:
      'The price of a position is also a forecast. Here is how to read it, and what it means for what you could win or lose.',
    category: 'Learn',
    date: '2026-09-15',
    author: TEAM,
    body: [
      { type: 'p', text: 'Every market on Phorcast has two sides, and their prices always add up to the full settlement value. That single rule explains most of what you see on a market page.' },
      { type: 'h2', text: 'Two sides, one total' },
      { type: 'p', text: 'If YES costs 62 cents, NO costs about 38. Buying YES at 62 means you pay 62 to receive the full amount if the event happens, and nothing if it does not. The NO buyer takes the opposite position.' },
      { type: 'h2', text: 'Reading the price as a forecast' },
      { type: 'p', text: 'A price of 62 says traders put the chance of YES at roughly 62%. When news arrives, the price moves, and you can watch the market’s view change in real time.' },
      { type: 'h2', text: 'What you risk and what you can win' },
      { type: 'ul', items: ['The most you can lose on a position is what you paid for it.', 'The most you can win is the full settlement value minus what you paid.', 'Cheaper positions pay more when they win, because the market thinks they are less likely to.'] },
    ],
  },
  {
    slug: 'selling-before-resolution',
    title: 'Selling early: taking profit before an event resolves',
    excerpt:
      'You do not have to wait for the result. How selling a position early works, and when traders choose to do it.',
    category: 'Guides',
    date: '2026-09-10',
    author: TEAM,
    body: [
      { type: 'p', text: 'Buying a position is only half of trading on Phorcast. Until a market resolves, you can sell what you hold at the current price, just as you would sell a stock.' },
      { type: 'h2', text: 'How it works' },
      { type: 'p', text: 'Say you bought YES at 40 cents and news pushes the price to 65. You can sell now and keep the difference, whatever the final result turns out to be.' },
      { type: 'h2', text: 'Why traders sell early' },
      { type: 'ul', items: ['To lock in a gain after the price has moved their way.', 'To cut a loss when new information changes their view.', 'To free up funds for a market they like better.'] },
      { type: 'h2', text: 'Holding to the end' },
      { type: 'p', text: 'If you are confident in your view, you can also hold until the event resolves. The position then settles at the full amount or at zero. Both are valid choices, and many traders do a little of each.' },
    ],
  },
  {
    slug: 'how-markets-resolve',
    title: 'How markets resolve, and who decides the result',
    excerpt:
      'Every market names its source before trading starts. What resolution means, and what happens to your position afterwards.',
    category: 'Guides',
    date: '2026-09-04',
    author: TEAM,
    body: [
      { type: 'p', text: 'Resolution is the moment a market’s question gets its answer. Knowing how it works before you trade removes most of the surprises.' },
      { type: 'h2', text: 'The rules come first' },
      { type: 'p', text: 'Each market states its question, its deadline and the source that settles it before any trading happens. Those rules do not change while the market is open.' },
      { type: 'h2', text: 'When the event happens' },
      { type: 'p', text: 'Once the result is known from the named source, the market closes and settles. Positions on the correct side are paid the full amount and the other side expires at zero.' },
      { type: 'h2', text: 'Before you trade' },
      { type: 'ul', items: ['Read the question and the deadline carefully.', 'Check which source decides the result.', 'Make sure your view is about the exact question asked, not a similar one.'] },
    ],
  },
  {
    slug: 'prediction-markets-vs-betting-vs-stocks',
    title: 'Prediction markets, betting and stocks: what is the difference?',
    excerpt:
      'They can look alike from a distance. How a prediction market compares with a sportsbook and with buying shares.',
    category: 'Markets',
    date: '2026-08-28',
    author: TEAM,
    body: [
      { type: 'p', text: 'Prediction markets borrow ideas from both betting and investing, which is why they are easy to confuse with either. The differences matter once you start trading.' },
      { type: 'h2', text: 'Compared with betting' },
      { type: 'p', text: 'With a bookmaker, the odds are set by the house and you trade against it. On a prediction market, prices come from other traders, and you can sell your position before the event instead of waiting for the result.' },
      { type: 'h2', text: 'Compared with stocks' },
      { type: 'p', text: 'A share has no end date and its value depends on many things at once. A prediction market position is tied to one question with a fixed deadline, so what you are betting on is always clear.' },
      { type: 'h2', text: 'What they share' },
      { type: 'ul', items: ['Prices move with news and opinion.', 'You can buy, hold or sell at any time before the market closes.', 'Understanding the risk before you trade matters more than anything else.'] },
    ],
  },
];

/** Every post, newest first. */
export const posts: readonly Post[] = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

/** One post by its slug, or undefined for a URL that names none. */
export const postBySlug = (slug: string): Post | undefined => posts.find((p) => p.slug === slug);

/** Up to `n` other posts, the same category first, for "More articles". */
export function relatedPosts(post: Post, n = 3): Post[] {
  const others = posts.filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, n);
}

/** Minutes to read, at 200 words a minute, never less than one. */
export function readMinutes(post: Post): number {
  const words = post.body
    .flatMap((b) => (b.type === 'ul' ? b.items : [b.text]))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "Sep 22, 2026". Parsed as UTC so the date never shifts with the reader's timezone. */
export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

/** The id a section heading gets, for the "On this page" links. */
export const sectionId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

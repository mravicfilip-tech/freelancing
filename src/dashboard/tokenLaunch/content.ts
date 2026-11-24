/**
 * Token Launch Strategy Call: the founders' live session with the community, where they present
 * the token launch plan and take questions. The same session the landing page's popup announces
 * (remittix-website, FigmaHero/launch/content.ts), cut to what the dashboard card shows.
 *
 * The date and time are confirmed (Thursday 26 November, 19:00 UTC); the questions, their askers
 * and the launch words are still placeholders. The real details go in here and nowhere else.
 */
export const LAUNCH = {
  title: 'Token Launch Strategy Call',
  badge: 'Live AMA',
  day: 'Thu',
  date: '26 Nov 2026',
  dateShort: '26 Nov',
  time: '19:00 UTC',
  copy: 'The founders present the RTX token launch plan, then answer your questions in a live AMA.',
  cta: 'Reserve your seat',
  /** questions the community has sent in: who asked (placeholder Unsplash portraits, see
   *  public/launch/avatars/CREDITS.txt), what, and the net votes (below zero shows red) */
  questions: [
    { who: '0x7a41…3f2b', photo: '/launch/avatars/q1.jpg', q: 'When does RTX list, and where first?', votes: 212 },
    { who: 'rtx_maxi', photo: '/launch/avatars/q2.jpg', q: 'How does vesting work for presale buyers?', votes: 168 },
    { who: '0xc0de…91a4', photo: '/launch/avatars/q3.jpg', q: 'What happens to the Golden Ticket bonus?', votes: 97 },
    { who: 'luna.eth', photo: '/launch/avatars/q4.jpg', q: 'Is there a buyback after launch?', votes: -14 },
  ],
  /** launch words that rise out of the recording as the playhead passes (placeholder) */
  words: ['Listing', 'Exchanges', 'Vesting', 'Allocation', 'Liquidity', 'Roadmap', 'TGE', 'AMA'],
} as const;

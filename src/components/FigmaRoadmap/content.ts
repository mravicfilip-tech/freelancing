/**
 * Roadmap copy, transcribed from the live "Explore Our RoadMap" section: seven levels, five
 * milestones each, with the ticks the live cards carry — levels 1 to 4 complete, level 5 part
 * done, 6 and 7 ahead. Two source lines end without a full stop; they are punctuated here.
 *
 * The level names and blurbs are ours: the live cards are numbered only, and the layouts that
 * show a name or a line of prose need one. `short` is the same milestone in a few words, for the
 * directions that carry it as a chip or a single line — the sentence is the copy of record.
 */

export type LevelStatus = 'done' | 'live' | 'next';

export type Milestone = {
  /** The milestone as the live section words it. */
  text: string;
  /** The same milestone in three or four words, for the chip and column layouts. */
  short: string;
  /** Ticked on the live card. */
  done: boolean;
};

export type Level = {
  /** `01`–`07`, shown as the column, node and tab number. */
  n: string;
  /** One word, in the page's voice. */
  name: string;
  /** Where the level stands, in two or three words. */
  marker: string;
  /** One sentence, under 140 characters, for the layouts that show prose. */
  blurb: string;
  items: Milestone[];
  status: LevelStatus;
};

const m = (text: string, short: string, done: boolean): Milestone => ({ text, short, done });

export const LEVELS: Level[] = [
  {
    n: '01',
    name: 'Foundation',
    marker: 'Complete',
    blurb: 'The vision, the team and the audited contract, in place before the presale opened.',
    status: 'done',
    items: [
      m('Define the project’s vision and key milestones.', 'Vision and milestones', true),
      m('Formation of core team.', 'Core team formed', true),
      m('Smart contract deployment and Audit.', 'Contract audited', true),
      m('Launch presale website.', 'Presale website live', true),
      m('Initiate stage 1 marketing strategy.', 'Stage 1 marketing', true),
    ],
  },
  {
    n: '02',
    name: 'Visibility',
    marker: 'Complete',
    blurb: 'Listed where holders look, partners signed, and the first wallet put in testers’ hands.',
    status: 'done',
    items: [
      m('Pre-list Remittix on CMC and CG.', 'CMC and CG pre-listing', true),
      m('Release influencer marketing campaign.', 'Influencer campaign', true),
      m('Form strategic partnerships with institutions.', 'Institution partners', true),
      m('Hit $18m softcap.', '$18M softcap hit', true),
      m('Beta Release of Remittix wallet.', 'Wallet beta released', true),
    ],
  },
  {
    n: '03',
    name: 'Wallet',
    marker: 'Complete',
    blurb: 'The full wallet released, the testnet opened to the community, the ecosystem finished off.',
    status: 'done',
    items: [
      m('Release full version of Wallet.', 'Full wallet released', true),
      m('Deploy testnet and ask the community to provide feedback.', 'Testnet deployed', true),
      m('Complete final development stages of ecosystem.', 'Ecosystem completed', true),
      m('Prepare for a broad scale global marketing campaign.', 'Global campaign prep', true),
      m('Launch ambassador program.', 'Ambassador program', true),
    ],
  },
  {
    n: '04',
    name: 'Platform',
    marker: 'Complete',
    blurb: 'Crypto in, local currency out: the PayFi platform built, opened to testers, and joined by Markets.',
    status: 'done',
    items: [
      m('Complete development of the Remittix crypto-to-fiat Pay-Fi platform.', 'PayFi platform built', true),
      m('Open the platform to community members for live testing and feedback.', 'Community testing', true),
      m('Introduce Remittix Markets as a new trading layer within the RTX ecosystem.', 'Markets introduced', true),
      m('Begin airdrop registration and expand community participation.', 'Airdrop registration', true),
      m('Continue global marketing ahead of the official ecosystem launch.', 'Pre-launch marketing', true),
    ],
  },
  {
    n: '05',
    name: 'Markets',
    marker: 'In progress',
    blurb: 'Markets goes live and Earn arrives; $32M in the presale reveals the RTX launch date.',
    status: 'live',
    items: [
      m('Reveal the official RTX launch date after the $32 million presale milestone.', 'Launch date revealed', false),
      m('Introduce Remittix Earn and reveal new RTX income potential.', 'Remittix Earn introduced', false),
      m('Launch Remittix Markets and activate trading across RTX ecosystem.', 'Markets trading live', true),
      m('Release further product demonstrations and ecosystem walkthroughs.', 'Product demonstrations', true),
      m('Expand community incentives and promotional campaigns across Markets, Earn and PayFi.', 'Community incentives', false),
    ],
  },
  {
    n: '06',
    name: 'Prelaunch',
    marker: 'Next',
    blurb: 'One utility model across PayFi, Markets and Earn, with the wallet and the exchanges lined up behind it.',
    status: 'next',
    items: [
      m('Reveal the complete RTX utility model across PayFi, Markets and Earn.', 'RTX utility model', false),
      m('Upgrade the Remittix Wallet and integrate all ecosystem products.', 'Wallet integrations', false),
      m('Launch a major global pre-launch marketing campaign.', 'Global campaign', false),
      m('Confirm launch arrangements with centralised and decentralised exchanges.', 'Exchanges confirmed', false),
      m('Prepare the community for airdrop, trading and Pay-Fi platform access.', 'Community prepared', false),
    ],
  },
  {
    n: '07',
    name: 'Launch',
    marker: 'Final level',
    blurb: 'The presale closes, RTX trades on Uniswap and the confirmed exchanges, and the platform opens to everyone.',
    status: 'next',
    items: [
      m('Conclude the RTX presale at the hard cap or on the confirmed closing date.', 'Presale concludes', false),
      m('Launch RTX trading on Uniswap and lock the initial liquidity pool.', 'Uniswap listing', false),
      m('Launch RTX on confirmed centralised exchanges.', 'CEX listings', false),
      m('Complete the full public launch of the Remittix crypto-to-fiat platform.', 'Public launch', false),
      m('Continue exchange expansion, product development and global user growth.', 'Expansion and growth', false),
    ],
  },
];

/** Raise gates, for the meter under direction 5. The softcap and the milestone are the live
 *  section's own figures; the running total is a placeholder until the client confirms it. */
export const GATES = [
  { at: 18, label: 'Softcap' },
  { at: 24, label: 'PayFi live' },
  { at: 32, label: 'Launch date' },
] as const;

export const RAISED = 31.2;
export const TARGET = 32;

export const STATUS_LABEL: Record<LevelStatus, string> = {
  done: 'Complete',
  live: 'Current level',
  next: 'Ahead',
};

/** `3/5` for the tab on a card, and the rail's fill. */
export const doneCount = (level: Level) => level.items.filter((i) => i.done).length;

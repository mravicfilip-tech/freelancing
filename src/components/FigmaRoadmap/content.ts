/**
 * Roadmap copy, transcribed from the live "Explore Our RoadMap" carousel: seven levels of five
 * milestones, with the ticks each live card carries — levels 1 to 4 complete, level 5 two of five,
 * 6 and 7 untouched. That is what makes level 5 the one in progress. Two source lines end without
 * a full stop; they are punctuated here.
 *
 * The level names and blurbs are ours: the live cards are numbered only. `short` is the same
 * milestone in a few words, for anywhere the sentence will not fit.
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
  /** The line above this level's card (2718:2736). Nothing renders until the copy is supplied. */
  label?: string;
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
      m('Define the project\'s vision and key milestones.', 'Vision and milestones', true),
      m('Formation of core team.', 'Core team formed', true),
      m('Smart contract deployment and Audit.', 'Contract audited', true),
      m('Launch presale website.', 'Presale site live', true),
      m('Initiate stage 1 marketing strategy.', 'Stage 1 marketing', true),
    ],
  },
  {
    n: '02',
    name: 'Softcap',
    marker: 'Complete',
    blurb: 'Listed, partnered and past the $18m softcap, with the wallet in beta.',
    status: 'done',
    items: [
      m('Pre-list Remittix on CMC and CG.', 'CMC and CG pre-listing', true),
      m('Release influencer marketing campaign.', 'Influencer campaign', true),
      m('Form strategic partnerships with institutions.', 'Institutional partners', true),
      m('Hit $18m softcap.', '$18m softcap hit', true),
      m('Beta Release of Remittix wallet.', 'Wallet beta', true),
    ],
  },
  {
    n: '03',
    name: 'Wallet',
    marker: 'Complete',
    blurb: 'The wallet ships in full, the testnet opens to the community, and the ecosystem finishes.',
    status: 'done',
    items: [
      m('Release full version of Wallet.', 'Wallet released', true),
      m('Deploy testnet and ask the community to provide feedback.', 'Testnet feedback', true),
      m('Complete final development stages of ecosystem.', 'Ecosystem complete', true),
      m('Prepare for a broad scale global marketing campaign.', 'Global campaign prepared', true),
      m('Launch ambassador program.', 'Ambassador program', true),
    ],
  },
  {
    n: '04',
    name: 'PayFi',
    marker: 'Complete',
    blurb: 'The crypto-to-fiat platform is built, opened to live testing, and Markets is introduced.',
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
    blurb: 'Markets is trading and the walkthroughs are out; the launch date waits on the $32m milestone.',
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
    blurb: 'One utility model across PayFi, Markets and Earn, with the wallet and the exchanges behind it.',
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
    blurb: 'The presale closes, RTX trades on Uniswap and the confirmed exchanges, and the platform opens.',
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

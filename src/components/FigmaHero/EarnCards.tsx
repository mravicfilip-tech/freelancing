import type { EarnVariant } from './earnVariant';
import './EarnCards.css';

/**
 * The two cards the Earn testers slide lays over the dashboard, in three versions (`?earn=1|2|3`).
 * Each is a fragment of a real product's bento, taken over one to one in form and carrying RTX
 * Earn's content; the figures are the Earn app's own (remittix-earn, `earn/pools.ts`).
 *
 * 1 — Medusa's "Sales channels" table becomes the pools, and its Payment → Cart graph a deposit.
 * 2 — Medusa's order menu (with its named pointer) becomes a position's menu, and its activity what
 *     has happened to that position.
 * 3 — the Performance card becomes the fixed rate, its bars the term, and the Security card
 *     whitelisted payouts.
 *
 * Every card is drawn finished, so a reader with reduced motion gets the whole picture standing
 * still; EarnSlide's session sets each one's start state and plays it.
 */

const P = {
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
  card: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18',
  bank: 'M3 9.5 12 4l9 5.5zM5 10v7M9.7 10v7M14.3 10v7M19 10v7M3 20h18',
  check: 'M5 12.5 9.5 17 19 7',
  up: 'M7 17 17 7M8.5 7H17v8.5',
  down: 'M7 7l10 10M17 8.5V17H8.5',
  claim: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  roll: 'M19.5 11A7.5 7.5 0 0 0 5.6 7.4M5 4v4h4M4.5 13a7.5 7.5 0 0 0 13.9 3.6M19 20v-4h-4',
  topUp: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 8.5v7M8.5 12h7',
  swap: 'M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3',
  exit: 'M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 8l-4 4 4 4M5 12h10',
  wallet: 'M18 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M20 8h-5a2 2 0 0 0 0 4h5zM4 7h14',
  shield: 'M12 3l7 3v5.5c0 4.3-2.9 8.1-7 9.5-4.1-1.4-7-5.2-7-9.5V6z',
};

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={`ev-icon${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ------------------------------------------------------------------ 1 — Medusa: pools and a deposit */

const POOLS = [
  { name: 'Remittix', apy: '17.4%', up: true, tvl: '$8,100,000.00', market: 'USDC on Base', chain: 'base', more: 7 },
  { name: 'Maple', apy: '5.9%', up: false, tvl: '$310,000,000.00', market: 'USDC on Ethereum', chain: 'ethereum', more: 1 },
  { name: 'Morpho', apy: '4.1%', up: true, tvl: '$432,300,000.00', market: 'USDC on Base', chain: 'base', more: 1 },
] as const;

function PoolsTable() {
  return (
    <div className="ev-card ev-table">
      <div className="ev-tableHead">
        <span className="ev-box">
          <Icon d={P.layers} />
        </span>
        Pools
      </div>
      <div className="ev-tableCols">
        <span>Pool</span>
        <span>Markets</span>
      </div>
      {POOLS.map((pool, i) => (
        <div key={pool.name} className={`ev-tableRow${i === 0 ? ' ev-tableRow--ours' : ''}`}>
          <span className="ev-cell">
            <span className="ev-cellTop">
              {pool.name}
              <span className={`ev-delta ev-delta--${pool.up ? 'up' : 'down'}`}>
                <Icon d={pool.up ? P.up : P.down} />
                {pool.apy}
              </span>
            </span>
            <span className="ev-cellSub">{pool.tvl}</span>
          </span>
          <span className="ev-cell ev-cell--market">
            <span className="ev-thumb">
              <img src={`/figma/earn/${pool.chain}.svg`} alt="" width={24} height={24} />
            </span>
            <span className="ev-cellText">
              <span className="ev-cellTop">{pool.market}</span>
              <span className="ev-cellSub">+ {pool.more} more</span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function DepositFlow() {
  return (
    <div className="ev-card ev-flow">
      {/* The graph's wiring, in the card's own units (200 × 186). */}
      <svg className="ev-wires" viewBox="0 0 200 186" aria-hidden="true">
        <path d="M100 0v26M0 42h22M178 42h22M100 106v34M100 170v16" />
        {[
          [100, 26],
          [14, 42],
          [24, 42],
          [176, 42],
          [186, 42],
          [100, 110],
          [100, 136],
          [100, 174],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" />
        ))}
      </svg>
      <div className="ev-node ev-node--deposit">
        <div className="ev-nodeHead">
          <span className="ev-box">
            <Icon d={P.card} />
          </span>
          Deposit
          <span className="ev-dot" />
        </div>
        <div className="ev-nodeList">
          {['usdc', 'usdt'].map((token) => (
            <span key={token} className="ev-nodeItem">
              <img src={`/figma/earn/${token}.svg`} alt="" width={24} height={24} />
              {token.toUpperCase()}
              <Icon d={P.check} className="ev-tick" />
            </span>
          ))}
        </div>
      </div>
      <span className="ev-pulse" />
      <div className="ev-node ev-node--pool">
        <div className="ev-nodeHead">
          <span className="ev-box">
            <Icon d={P.bank} />
          </span>
          Remittix pool
          <span className="ev-dot ev-dot--pool" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 2 — Medusa: a position */

const ACTIONS = [
  { name: 'Claim yield', d: P.claim, key: 'claim' },
  { name: 'Roll over', d: P.roll },
  { name: 'Top up', d: P.topUp },
  { name: 'Change payout wallet', d: P.swap },
] as const;

function PositionMenu() {
  return (
    <div className="ev-card ev-menuCard">
      <div className="ev-chips">
        <span className="ev-chip ev-chip--state">
          <i />
          Active
        </span>
        <span className="ev-chip">Edit position</span>
        <span className="ev-chip ev-chip--more">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="ev-menu">
        {ACTIONS.map((a) => (
          <span key={a.name} className={`ev-act${'key' in a ? ` ev-act--${a.key}` : ''}`}>
            <Icon d={a.d} />
            {a.name}
          </span>
        ))}
        <span className="ev-menuRule" />
        <span className="ev-act">
          <Icon d={P.exit} />
          Withdraw early
        </span>
      </div>
    </div>
  );
}

const EVENTS = [
  { state: 'done', title: 'Deposit confirmed', when: '8 hours ago', what: '5,000 USDC into Remittix, 12 months', by: 'AK' },
  { state: 'wait', title: 'Awaits settlement', when: '1 day ago', what: 'Withdrawal from Maple, 24-hour settlement' },
  { state: 'review', title: 'Awaits review', when: '1 day ago', what: 'New payout address on Base' },
] as const;

function Activity() {
  return (
    <div className="ev-feed">
      {/* The event the session's claim adds; folded away until then. */}
      <div className="ev-event ev-event--new" data-state="done">
        <div className="ev-eventIn">
          <span className="ev-eventTop">
            <span className="ev-status" />
            <b>Yield claimed</b>
            <span className="ev-when">Just now</span>
          </span>
          <span className="ev-what">+413.14 USDC to 0x4f2a…d6b2</span>
        </div>
      </div>
      {EVENTS.map((e) => (
        <div key={e.title} className="ev-event" data-state={e.state}>
          <div className="ev-eventIn">
            <span className="ev-eventTop">
              <span className="ev-status" />
              <b>{e.title}</b>
              {'by' in e && <span className="ev-by">{e.by}</span>}
              <span className="ev-when">{e.when}</span>
            </span>
            <span className="ev-what">{e.what}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ 3 — Performance and Security */

const BARS = 20;
const ELAPSED = 17;

function FixedYield() {
  return (
    <div className="ev-card ev-term">
      <b className="ev-termTitle">Fixed yield</b>
      <p className="ev-termCopy">Lock USDC for 12 months at a rate that can’t move. Yield accrues every day.</p>
      <div className="ev-metric">
        <span className="ev-metricValue">
          17.4<small>%</small>
        </span>
        <span className="ev-badge">+870 USDC</span>
      </div>
      <div className="ev-bars">
        {Array.from({ length: BARS }, (_, i) => (
          <i key={i} data-left={i >= ELAPSED || undefined} />
        ))}
      </div>
    </div>
  );
}

/* The wiring under the three nodes, in the illustration's own units (207 × 84): bundles off both
   edges, and between the nodes the traces step up and down around the centre, mirrored. */
const LEFT_TRACES = [
  'M0 38h19M0 42h19M0 46h19',
  'M36 42H104',
  'M50 37h8q4 0 4-4v-3q0-4 4-4h38',
  'M50 47h8q4 0 4 4v3q0 4 4 4h38',
  'M45 33h10q2 0 2-2v-9q0-4 4-4h43',
  'M45 51h10q2 0 2 2v9q0 4 4 4h43',
];
const RIGHT_TRACES = [
  'M207 38h-19M207 42h-19M207 46h-19',
  'M171 42H103',
  'M157 37h-8q-4 0-4-4v-3q0-4-4-4h-38',
  'M157 47h-8q-4 0-4 4v3q0 4-4 4h-38',
  'M162 33h-10q-2 0-2-2v-9q0-4-4-4h-43',
  'M162 51h-10q-2 0-2 2v9q0 4-4 4h-43',
];

function SafePayouts() {
  return (
    <div className="ev-card ev-safe">
      <b className="ev-termTitle">Safe payouts</b>
      <p className="ev-termCopy">Yield only goes to an address that passed review and a 24-hour cooldown.</p>
      <div className="ev-circuit">
        <span className="ev-halo" />
        <svg viewBox="0 0 207 84" aria-hidden="true">
          {[...LEFT_TRACES, ...RIGHT_TRACES].map((d) => (
            <path key={d} d={d} />
          ))}
          <path className="ev-comet" d="M36 42H171" />
        </svg>
        <span className="ev-orb ev-orb--pool">
          <Icon d={P.bank} />
        </span>
        <span className="ev-orb ev-orb--shield">
          <Icon d={P.shield} />
          <span className="ev-seal">
            <Icon d={P.check} />
          </span>
        </span>
        <span className="ev-orb ev-orb--wallet">
          <Icon d={P.wallet} />
        </span>
      </div>
    </div>
  );
}

export function EarnCards({ variant }: { variant: EarnVariant }) {
  if (variant === '2')
    return (
      <>
        <PositionMenu />
        <Activity />
      </>
    );
  if (variant === '3')
    return (
      <>
        <SafePayouts />
        <FixedYield />
      </>
    );
  return (
    <>
      <DepositFlow />
      <PoolsTable />
    </>
  );
}

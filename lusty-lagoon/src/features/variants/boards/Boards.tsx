import { Coins, Crown, FishSimple, Headset, Lightning, Plus, Question, SquaresFour, UserPlus, Wallet } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';
import { formatAmount } from '../../../lib/format';
import { BalancePill, KitButton, NavItem, Panel, PromoMini, SectionLabel } from '../kit/parts';
import { kitPick } from '../kit/pick';

// Round 4 boards for micro detail picks, per the studio doctrine. Each option has its own URL,
// /variants/buttons?btn=N and /variants/sidebar?nav=N, and variants.mjs lays them on one board by
// the #board element. Filip answers with a number. These pages leave once both picks are in.

const BASE_BUTTON = { name: 'Base', note: 'Round 3, the purple primary and the gold Checkout, what the options replace', contrast: 'white on purple' };
const SYSTEMS = [
  { name: 'Flat', note: 'Solid orange, 12 radius, sentence case, dark label', contrast: '7.0 to 1' },
  { name: 'Pill', note: 'Two close orange stops, a full pill, dark label', contrast: '6.4 to 1 at the darkest stop' },
  { name: 'Caps', note: 'Solid orange, 8 radius, a lighter edge, Bai Jamjuree capitals with wide tracking', contrast: '7.0 to 1' },
  { name: 'Icon tile', note: 'Solid orange, a darker orange square with an arrow at the trailing end', contrast: '7.0 to 1' },
  { name: 'Ember', note: 'Deep burnt orange, a warm edge, white label, the quiet luxury one', contrast: '5.5 to 1 at the label' },
];

export function ButtonBoard() {
  useLocation(); // re-render when the switcher changes ?btn
  const n = kitPick('btn');
  const s = n === 0 ? BASE_BUTTON : SYSTEMS[n - 1];
  return (
    <main className="k-page min-h-screen p-12 pb-[120px]">
      <div id="board" className="mx-auto flex w-[1264px] flex-col gap-6 p-8">
        <header className="flex items-baseline justify-between">
          <h1 className="text-28 font-extrabold tracking-[-0.01em] text-ink">
            {n === 0 ? s.name : `${n}. ${s.name}`}
          </h1>
          <p className="text-14 text-[rgb(var(--k-muted))]">
            {s.note}. Label {s.contrast}.
          </p>
        </header>

        <Panel className="flex flex-col gap-6 p-8">
          <SectionLabel>Primary, three sizes and every state</SectionLabel>
          <div className="flex flex-wrap items-center gap-4">
            <KitButton tone="primary" size="lg">
              <Plus weight="bold" className="h-5 w-5" aria-hidden />
              Deposit
            </KitButton>
            <KitButton tone="primary" size="md">
              Play now
            </KitButton>
            <KitButton tone="primary" size="sm">
              Claim
            </KitButton>
            <KitButton tone="primary" size="md" loading>
              Checking out
            </KitButton>
            <KitButton tone="primary" size="md" disabled>
              Checkout
            </KitButton>
          </div>
          <SectionLabel>Beside it, the secondary and the quiet button</SectionLabel>
          <div className="flex flex-wrap items-center gap-4">
            <KitButton tone="purple" size="md">
              Withdraw
            </KitButton>
            <KitButton tone="dark" size="md">
              View all
            </KitButton>
            <KitButton tone="primary" size="md">
              Join the giveaway
            </KitButton>
          </div>
        </Panel>

        <div className="grid grid-cols-[1fr_380px] gap-6">
          <Panel className="flex flex-col justify-between gap-6 p-8">
            <SectionLabel>In the top bar</SectionLabel>
            <div className="flex items-center justify-center rounded-[16px] border border-white/[0.06] bg-[rgb(var(--ll-page))] py-6">
              <BalancePill amount={formatAmount(2492)} balance={2492} currency="USDT" onDeposit={() => undefined} depositLabel="Deposit" />
            </div>
            <SectionLabel>On the hero</SectionLabel>
            <div className="k-hero-purple flex items-end justify-between rounded-[20px] p-8">
              <p className="font-display text-40 font-bold uppercase leading-[40px] text-ink">
                Where luck
                <br />
                meets lust.
              </p>
              <div className="flex gap-3">
                <KitButton tone="dark" size="lg">
                  How it works
                </KitButton>
                <KitButton tone="primary" size="lg">
                  Play Sugar Rush
                </KitButton>
              </div>
            </div>
          </Panel>
          <Panel lit className="flex flex-col gap-4 p-6">
            <SectionLabel>In a money card</SectionLabel>
            <div className="k-well flex h-[52px] items-center justify-between rounded-[14px] px-4">
              <span className="num text-16 font-bold text-ink">$ 25</span>
              <span className="text-14 text-[rgb(var(--k-muted))]">USD</span>
            </div>
            <dl className="flex flex-col gap-2 text-14">
              <div className="flex justify-between">
                <dt className="text-[rgb(var(--k-muted))]">You get</dt>
                <dd className="num font-semibold text-ink">24.37 USDT</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgb(var(--k-muted))]">Fee</dt>
                <dd className="num font-semibold text-ink">0.63 USD</dd>
              </div>
            </dl>
            <KitButton tone="gold" size="lg" className="mt-auto w-full">
              Checkout 25.00 USD
            </KitButton>
          </Panel>
        </div>
      </div>
    </main>
  );
}

const BASE_ROW = { name: 'Base', note: 'Round 3, the purple wash with a faint edge, the one Filip said needs more work' };
const TREATMENTS = [
  { name: 'Raised with a light edge', note: 'The row lifts one step and takes a 1px white edge' },
  { name: 'Accent bar', note: 'The row lifts one step and a 3px accent bar marks its left end' },
  { name: 'Accent edge', note: 'The fill stays, a 1px accent edge goes all round' },
  { name: 'Soft light', note: 'A purple light from the left inside the row, no edge' },
];

export function SidebarBoard() {
  useLocation(); // re-render when the switcher changes ?nav
  const n = kitPick('nav');
  const t = n === 0 ? BASE_ROW : TREATMENTS[n - 1];
  return (
    <main className="k-page min-h-screen p-12 pb-[120px]">
      <div id="board" className="flex w-[624px] gap-6 p-8">
        <aside className="flex w-[240px] shrink-0 flex-col gap-4 rounded-[20px] border border-white/[0.06] bg-[rgb(var(--k-panel))] p-3">
          <div className="grid grid-cols-2 gap-2">
            <PromoMini hue="purple" label={['Daily', 'chest']} art="/art/lobby/giveaway-chest.webp" onClick={() => undefined} />
            <PromoMini hue="blue" label={['Rank', 'road']} art="/brand/rank-bronze.png" artClass="h-[44px]" onClick={() => undefined} />
            <PromoMini hue="gold" label={['Hot', 'streak']} art="/art/landing/pillar-gems-b.webp" artClass="h-[60px]" onClick={() => undefined} />
            <PromoMini hue="green" label={['Refer', 'friends']} art="/art/money/refer-megaphone.webp" artClass="h-[64px] top-[60%]" onClick={() => undefined} />
          </div>
          <nav aria-label="Games" className="flex flex-col gap-2">
            <SectionLabel>Games</SectionLabel>
            <NavItem icon={<SquaresFour weight="fill" />} label="Lobby" active onClick={() => undefined} badge={<span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">42</span>} />
            <NavItem icon={<Coins weight="fill" />} label="Slots" onClick={() => undefined} badge={<span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">21</span>} />
            <NavItem icon={<Lightning weight="fill" />} label="Megaways" onClick={() => undefined} badge={<span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">9</span>} />
            <NavItem icon={<Crown weight="fill" />} label="Hold and win" onClick={() => undefined} badge={<span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">6</span>} />
            <NavItem icon={<FishSimple weight="fill" />} label="Fish games" onClick={() => undefined} badge={<span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">2</span>} />
          </nav>
          <nav aria-label="Others" className="flex flex-col gap-2">
            <SectionLabel>Others</SectionLabel>
            <NavItem icon={<Wallet weight="fill" />} label="Wallet" onClick={() => undefined} />
            <NavItem icon={<Headset weight="fill" />} label="Send to agent" onClick={() => undefined} />
            <NavItem icon={<UserPlus weight="fill" />} label="Refer a friend" onClick={() => undefined} />
            <NavItem icon={<Question weight="fill" />} label="FAQ" onClick={() => undefined} />
          </nav>
        </aside>
        <div className="flex flex-col gap-2 pt-2">
          <h1 className="text-28 font-extrabold tracking-[-0.01em] text-ink">
            {n === 0 ? t.name : `${n}. ${t.name}`}
          </h1>
          <p className="text-14 text-[rgb(var(--k-muted))]">{t.note}.</p>
          <p className="mt-4 text-14 text-[rgb(var(--k-muted))]">Promo tiles, the same on every option. A soft hue edge, one hue light from the right, the art scales on hover.</p>
          <Link to="/variants/1" className="mt-4 text-14 font-semibold text-[#C9A2FF] underline-offset-4 hover:underline">
            See it on variant 1
          </Link>
        </div>
      </div>
    </main>
  );
}

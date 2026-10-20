import { forwardRef, type MouseEvent, type ReactNode, type Ref } from 'react';
import { Link } from 'react-router-dom';
import { CaretRight, Gear, Medal, SignOut, Timer, Trophy, UserPlus, Wallet } from '@phosphor-icons/react';
import { ACCOUNT } from '../../../../data/wallet';
import { GIVEAWAY } from '../../../lobby/data';
import { formatAmount, formatPoints } from '../../../../lib/format';
import { cn } from '../../../../lib/cn';
import { DAILY_CHEST, ONLINE_NOW, RACE, useCountdown } from '../../shared/data';
import { Chest } from '../Chest';
import { CoinIcon, Key, Live } from '../ui';

// What the phone panels hold beyond the shared v1 parts. The Rewards panel (the Daily chest and the
// Hot streak giveaway), the account panel, the weekly race row that leads the menu, the chat's header
// controls and the two reward chips of iteration 3. All of it in v1's own surfaces, type and colour
// glyphs in tinted squares.

/** The chat's online count and Rules, set in the panel's header, since the chat's own header is hidden there. */
export function ChatActions({ onRules }: { onRules: () => void }) {
  return (
    <>
      <span className="n1-well flex h-8 shrink-0 items-center gap-2 rounded-[10px] px-[10px] text-12 font-extrabold text-ink">
        <Live />
        <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span>
        <span className="sr-only">players online</span>
      </span>
      <button type="button" onClick={onRules} className="n1-ring h-11 shrink-0 rounded-[12px] bg-[rgb(var(--n-purple)/0.18)] px-3 text-14 font-extrabold text-[rgb(var(--n-lilac))] shadow-[inset_0_0_0_1px_rgb(190_166_255/0.16)] transition-colors hover:bg-[rgb(var(--n-purple)/0.28)]">
        Rules
      </button>
    </>
  );
}

/** The Hot streak giveaway as a card, the sidebar's promo card with the draw's terms and its own key. */
export const GiveawayCard = forwardRef<HTMLElement, { joined: boolean; onJoin: () => void }>(function GiveawayCard({ joined, onJoin }, ref) {
  return (
    <section ref={ref} tabIndex={-1} aria-labelledby="n1m-give" className="n1-card-promo n1-ring mt-8 rounded-[16px] p-4 pt-[20px]">
      {/* The Hot streak slot machine breaks out of the card's top right, the art of its sidebar tile, so
          the panel does not show the chest twice. 531 by 900, drawn at 128 tall. */}
      <img src="/art/landing/slot-machine.webp" alt="" className="pointer-events-none absolute -top-[36px] right-4 h-[128px] w-auto select-none drop-shadow-[0_10px_18px_rgb(10_4_30/0.55)]" />
      <p className="n1-label text-[rgb(var(--n-lilac))]">Draw {GIVEAWAY.ends.replace(' at midnight', '')}</p>
      <h3 id="n1m-give" className="mt-2 max-w-[180px] font-display text-20 font-bold leading-[22px] tracking-[-0.01em] text-ink">
        Hot streak giveaway
      </h3>
      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-12 font-semibold text-[rgb(var(--n-muted))]">Prize pool</span>
          <span className="num flex items-center gap-2 text-20 font-extrabold leading-6 text-ink">
            <CoinIcon id="btc" size={20} />
            {GIVEAWAY.pool} BTC
          </span>
        </span>
        <span className="num pb-[2px] text-12 font-semibold text-[rgb(var(--n-muted))]">{joined ? 'You have 1 entry' : '10 winners'}</span>
      </div>
      <ul className="mt-4 flex list-disc flex-col gap-1 pl-[20px] text-14 text-[rgb(var(--n-muted))]">
        <li>Every ${GIVEAWAY.entryEvery} you play this week is one entry.</li>
        <li>Ten winners share the pool, paid to your wallet in BTC.</li>
      </ul>
      {joined ? (
        <p role="status" className="mt-4 rounded-[12px] border border-[#3DDC84]/40 bg-[#3DDC84]/10 p-3 text-14 font-semibold text-ink">
          You are in. Good luck for {GIVEAWAY.ends}.
        </p>
      ) : (
        <Key tone="orange" size={48} onClick={onJoin} className="mt-4 w-full">
          Join the draw
        </Key>
      )}
    </section>
  );
});

/** The weekly race in one row, the top bar's race chip on the desktop. It leads the menu panel. */
export function RaceRow({ onRace }: { onRace: () => void }) {
  const t = useCountdown(RACE.endsInSeconds);
  return (
    <section aria-labelledby="n1m-race" data-icon="trophy" className="k-hov-icon n1-raised flex items-center gap-3 rounded-[16px] p-2 pl-3">
      <span className="n1-keysq flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink">
        <Trophy weight="fill" className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-none">
        <span id="n1m-race" className="text-14 font-extrabold text-ink">
          Weekly race
        </span>
        <span className="num mt-1 truncate text-12 font-bold text-[rgb(var(--n-muted))]">
          <span className="text-ink">{formatAmount(RACE.pool, 0)} USDT</span> · {t.d}d {t.pad(t.h)}h {t.pad(t.m)}m
        </span>
      </span>
      <Key tone="purple" size={48} onClick={onRace} className="h-11 shrink-0 px-4 text-14">
        Join
      </Key>
    </section>
  );
}

/** One row of the account panel, a colour glyph in a tinted square, the label and a chevron. */
function Row({ icon, hue, label, to, onClick }: { icon: ReactNode; hue: string; label: string; to?: string; onClick?: () => void }) {
  const cls = 'n1-ring group flex h-[48px] items-center gap-3 rounded-[10px] px-2 text-14 font-semibold text-ink transition-colors hover:bg-white/[0.05]';
  const inner = (
    <>
      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] [&>svg]:h-4 [&>svg]:w-4" style={{ color: `rgb(${hue})`, background: `rgb(${hue} / 0.14)` }}>
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      <span data-icon="arrow" className="k-hov-icon flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/[0.06] text-[rgb(var(--n-muted))] transition-colors group-hover:bg-white/[0.12] group-hover:text-ink">
        <CaretRight weight="bold" className="h-[12px] w-[12px]" aria-hidden />
      </span>
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

const rule = <span aria-hidden className="mx-2 h-px bg-white/[0.06]" />;

/** The account panel. Who is signed in, the rank road, the account rows and Log out. */
export function AccountBody({ onRank }: { onRank: () => void }) {
  const r = ACCOUNT.rank;
  const pct = Math.round((r.points / r.nextAt) * 100);
  return (
    <div className="flex flex-col gap-4">
      <div className="n1-raised flex flex-col gap-4 rounded-[16px] p-4">
        <div className="flex items-center gap-3">
          <img src="/art/avatars/john.webp" alt="" className="h-[48px] w-12 rounded-[12px] object-cover" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-16 font-extrabold text-ink">{ACCOUNT.name}</span>
            <span className="mt-1 flex items-center gap-1 text-12 font-bold text-[rgb(var(--n-bronze))]">
              <img src="/brand/rank-bronze.png" alt="" className="h-4 w-4" />
              {r.name}
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-12 font-bold">
            <span className="text-[rgb(var(--n-muted))]">
              Next, <span className="text-[rgb(var(--n-silver))]">{r.next}</span>
            </span>
            <span className="num text-[rgb(var(--n-muted))]">
              {formatPoints(r.points)} of {formatPoints(r.nextAt)}
            </span>
          </div>
          <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress to ${r.next}`} className="block h-[8px] w-full overflow-hidden rounded-full bg-white/[0.1]">
            <span className="block h-full rounded-full bg-[rgb(var(--n-purple))]" style={{ width: `${pct}%` }} />
          </span>
        </div>
      </div>
      <nav aria-label="Account" className="n1-group flex flex-col rounded-[16px] p-2">
        <Row to="/account" icon={<Gear weight="fill" />} hue="190 166 255" label="Account settings" />
        {rule}
        <Row to="/wallet/deposit" icon={<Wallet weight="fill" />} hue="92 200 255" label="Wallet" />
        {rule}
        <Row onClick={onRank} icon={<Medal weight="fill" />} hue="211 139 111" label="Rank road" />
        {rule}
        <Row to="/refer" icon={<UserPlus weight="fill" />} hue="255 143 194" label="Refer a friend" />
      </nav>
      <Link to="/login" className="n1-ring flex h-[48px] items-center gap-3 rounded-[12px] px-4 text-14 font-semibold text-[rgb(var(--n-muted))] transition-colors hover:bg-white/[0.05] hover:text-ink">
        <SignOut weight="bold" className="h-5 w-5" aria-hidden />
        Log out
      </Link>
    </div>
  );
}

/** The Daily chest and the giveaway under one title, the Rewards panel. */
export function RewardsBody({ loading, joined, onJoin, giveRef }: { loading: boolean; joined: boolean; onJoin: () => void; giveRef: Ref<HTMLElement> }) {
  return (
    <div className="flex flex-col">
      <Chest loading={loading} />
      <GiveawayCard ref={giveRef} joined={joined} onJoin={onJoin} />
    </div>
  );
}

/** Iteration 3. The Daily chest and the giveaway as two chips under the top bar, the sidebar's promo tiles. */
export function RewardChips({ onChest, onGiveaway, open }: { onChest: (e: MouseEvent<HTMLButtonElement>) => void; onGiveaway: (e: MouseEvent<HTMLButtonElement>) => void; open: boolean }) {
  const { left, hms } = useCountdown(DAILY_CHEST.readyInSeconds);
  const chip = 'n1-promo n1-ring group flex h-[56px] min-w-0 overflow-hidden rounded-[14px] text-left';
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={onChest} aria-haspopup="dialog" aria-expanded={open} className={cn(chip, 'n1-hue-ember')}>
        <span className="relative z-10 flex min-w-0 flex-col justify-center pl-3">
          <span className="truncate text-14 font-extrabold leading-[17px] text-ink">Daily chest</span>
          <span className="num mt-[2px] flex items-center gap-1 text-12 font-bold text-ink/80">
            <Timer weight="fill" className="h-[12px] w-[12px]" aria-hidden />
            {left === 0 ? 'Ready' : hms}
          </span>
        </span>
        <img src="/art/lobby/giveaway-chest.webp" alt="" className="n1-zoom pointer-events-none absolute -bottom-[8px] -right-[10px] h-[64px] max-w-none select-none drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)]" />
      </button>
      <button type="button" onClick={onGiveaway} aria-haspopup="dialog" aria-expanded={open} className={cn(chip, 'n1-hue-purple')}>
        <span className="relative z-10 flex min-w-0 flex-col justify-center pl-3">
          <span className="truncate text-14 font-extrabold leading-[17px] text-ink">Hot streak</span>
          <span className="num mt-[2px] flex items-center gap-1 text-12 font-bold text-ink/80">
            <CoinIcon id="btc" size={12} />
            {GIVEAWAY.pool} BTC
          </span>
        </span>
        <img src="/art/landing/slot-machine.webp" alt="" className="n1-zoom pointer-events-none absolute -bottom-[14px] right-0 h-[72px] max-w-none select-none drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)]" />
      </button>
    </div>
  );
}


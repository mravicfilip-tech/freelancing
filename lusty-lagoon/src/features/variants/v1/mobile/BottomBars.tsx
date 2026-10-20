import type { MouseEvent, ReactNode } from 'react';
import { Plus } from '@phosphor-icons/react';
import { cn } from '../../../../lib/cn';
import { HoverFx } from '../../kit/hover';

// The three bottom menus, one per phone iteration. Every slot is a button at least 44px square with
// its icon over a 12px label. Lobby is the page itself, so it carries aria-current. A slot that
// opens a panel says so with aria-haspopup and lights while its panel is open.
//   TabBar     iteration 1, a fixed five slot bar
//   DepositBar iteration 2, the raised orange Deposit in the middle slot
//   Dock       iteration 3, a glass pill inset from the edges that hides on scroll down

export type Slot = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  /** The slot opens a panel. */
  popup?: boolean;
  /** Lit, its panel is open, or for Lobby, no panel is. */
  on?: boolean;
  /** The page itself, Lobby. */
  current?: boolean;
};

function SlotButton({ s }: { s: Slot }) {
  return (
    <button
      type="button"
      onClick={s.onClick}
      aria-haspopup={s.popup ? 'dialog' : undefined}
      aria-expanded={s.popup ? !!s.on : undefined}
      aria-current={s.current ? 'page' : undefined}
      data-icon="pop"
      data-on={s.on ? '' : undefined}
      className="k-hov-icon n1-ring n1m-slot"
    >
      <span aria-hidden className="n1m-slot-icon">
        {s.icon}
      </span>
      <span className="n1m-slot-label">{s.label}</span>
    </button>
  );
}

export function TabBar({ slots }: { slots: Slot[] }) {
  return (
    <nav aria-label="Main" className="n1m-tabbar">
      {slots.map((s) => (
        <SlotButton key={s.id} s={s} />
      ))}
    </nav>
  );
}

/** Two slots, the raised Deposit, two slots. The Deposit is the one orange key, with the sheen hover. */
export function DepositBar({ left, right, onDeposit }: { left: Slot[]; right: Slot[]; onDeposit: () => void }) {
  return (
    <nav aria-label="Main" className="n1m-tabbar n1m-tabbar-depo">
      {left.map((s) => (
        <SlotButton key={s.id} s={s} />
      ))}
      <button type="button" onClick={onDeposit} data-icon="plus" className="k-hov-icon n1m-depo">
        <span aria-hidden className="n1-key n1-key-orange k-hov n1m-depo-key">
          <HoverFx />
          <Plus weight="bold" className="h-6 w-6" />
        </span>
        <span className="n1m-slot-label">Deposit</span>
      </button>
      {right.map((s) => (
        <SlotButton key={s.id} s={s} />
      ))}
    </nav>
  );
}

export function Dock({ slots, shown }: { slots: Slot[]; shown: boolean }) {
  return (
    <nav aria-label="Main" className={cn('n1m-dock', !shown && 'n1m-dock-away')}>
      {slots.map((s) => (
        <SlotButton key={s.id} s={s} />
      ))}
    </nav>
  );
}

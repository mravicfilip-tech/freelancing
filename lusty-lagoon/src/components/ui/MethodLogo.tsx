import type { ReactNode } from 'react';
import { Bank } from '@phosphor-icons/react';
import { siPaypal, siVisa } from 'simple-icons';
import type { CashMethodId, Selection } from '../../data/wallet';
import { coinById } from '../../data/wallet';
import { cn } from '../../lib/cn';

type Size = 'sm' | 'md';

function Glyph({ path, hex, size }: { path: string; hex: string; size: Size }) {
  return (
    <svg viewBox="0 0 24 24" className={size === 'sm' ? 'h-4 w-6' : 'h-5 w-8'} aria-hidden>
      <path d={path} fill={`#${hex}`} />
    </svg>
  );
}

const CASH: Record<CashMethodId, (size: Size) => ReactNode> = {
  visa: (size) => <Glyph path={siVisa.path} hex={siVisa.hex} size={size} />,
  paypal: (size) => <Glyph path={siPaypal.path} hex={siPaypal.hex} size={size} />,
  mastercard: (size) => (
    <img src="/brand/mastercard.svg" alt="" className={cn('object-contain', size === 'sm' ? 'h-4 w-6' : 'h-5 w-8')} />
  ),
  wire: (size) => <Bank weight="fill" className={cn('text-on-gold', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} aria-hidden />,
};

// Card, wallet and bank logos sit on a white tile, the way a checkout shows them, so their own
// colours read on the dark ground. Coins show as their flat round logo.
export function MethodLogo({ selection, size = 'md', className }: { selection: Selection; size?: Size; className?: string }) {
  if (selection.kind === 'coin') {
    const coin = coinById(selection.coinId);
    const px = size === 'sm' ? 24 : 32;
    // A faint ring keeps dark logos, such as XRP, visible on the dark panels.
    return <img src={coin.icon} alt="" width={px} height={px} className={cn('shrink-0 rounded-full ring-1 ring-ink/20', className)} />;
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-white',
        size === 'sm' ? 'h-6 w-8' : 'h-8 w-12',
        className,
      )}
    >
      {CASH[selection.methodId](size)}
    </span>
  );
}

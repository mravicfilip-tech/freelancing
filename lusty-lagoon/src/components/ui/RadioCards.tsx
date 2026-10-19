import * as RG from '@radix-ui/react-radio-group';
import { Check } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

// A selected card shows a 2px accent border, a raised fill and a check mark, so selection never
// depends on a colour shift alone. The border is always 2px, so selecting moves nothing.
export const RadioCards = RG.Root;

type ItemProps = RG.RadioGroupItemProps & { children: ReactNode };

export function RadioCard({ className, children, ...rest }: ItemProps) {
  return (
    <RG.Item
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl border-2 border-line bg-panel p-4 text-left transition-colors duration-150',
        'hover:border-field hover:bg-raised',
        'data-[state=checked]:border-accent data-[state=checked]:bg-raised',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-panel',
        className,
      )}
      {...rest}
    >
      {children}
      <span
        aria-hidden
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-field transition-colors group-data-[state=checked]:border-accent group-data-[state=checked]:bg-accent"
      >
        <RG.Indicator>
          <Check weight="bold" size={16} className="text-page" />
        </RG.Indicator>
      </span>
    </RG.Item>
  );
}

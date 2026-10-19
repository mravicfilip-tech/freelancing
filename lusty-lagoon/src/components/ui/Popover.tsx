import * as P from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverClose = P.Close;

export function PopoverContent({ children, className, align = 'end' }: { children: ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={8} className={cn('z-20 rounded-xl border border-line bg-raised shadow-3 outline-none', className)}>
        {children}
      </P.Content>
    </P.Portal>
  );
}

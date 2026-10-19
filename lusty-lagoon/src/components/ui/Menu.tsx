import * as M from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const Menu = M.Root;
export const MenuTrigger = M.Trigger;

export function MenuContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <M.Portal>
      <M.Content align="end" sideOffset={8} className={cn('z-20 min-w-[var(--bl-sidebar-open)] rounded-xl border border-line bg-raised p-1 shadow-3', className)}>
        {children}
      </M.Content>
    </M.Portal>
  );
}

export function MenuItem({ children, onSelect, danger }: { children: ReactNode; onSelect?: () => void; danger?: boolean }) {
  return (
    <M.Item
      onSelect={onSelect}
      className={cn('flex h-10 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-14 font-medium outline-none data-[highlighted]:bg-panel', danger ? 'text-danger' : 'text-ink')}
    >
      {children}
    </M.Item>
  );
}

export function MenuSeparator() {
  return <M.Separator className="my-1 h-[var(--bl-border-1)] bg-line" />;
}

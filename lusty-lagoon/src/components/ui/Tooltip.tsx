import * as RT from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

export const TooltipProvider = RT.Provider;

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <RT.Root delayDuration={200}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          sideOffset={6}
          className="z-60 max-w-xs rounded-lg border border-line bg-raised px-3 py-2 text-14 text-ink shadow-2"
        >
          {content}
          <RT.Arrow className="fill-raised" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}

import * as D from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

// A modal on the raised surface with a dimmed page behind it. Escape and the close button both
// close it, and focus returns to what opened it.
export function DialogContent({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-40 bg-page/80" />
      <D.Content className={cn('fixed left-1/2 top-1/2 z-40 flex w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col gap-6 rounded-2xl border border-line bg-panel p-6 shadow-3 outline-none', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <D.Title className="font-display text-24 font-semibold text-ink">{title}</D.Title>
            {description ? <D.Description className="text-16 text-ink2">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink2 hover:bg-raised hover:text-ink">
            <X className="h-5 w-5" aria-hidden />
          </D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}

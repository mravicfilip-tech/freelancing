import * as A from '@radix-ui/react-accordion';
import { CaretDown } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

// Flat rows split by a hairline. No per-row fill, no gradient, per the taste log.
export const Accordion = A.Root;

export function AccordionItem({ value, title, children, className }: { value: string; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <A.Item value={value} className={cn('border-b border-line last:border-b-0', className)}>
      <A.Header asChild>
        <h3>
          <A.Trigger className="group flex w-full items-center justify-between gap-6 py-4 text-left text-16 font-semibold text-ink transition-colors hover:text-accent">
            {title}
            <CaretDown className="h-5 w-5 shrink-0 text-ink2 transition-transform duration-150 group-data-[state=open]:rotate-180" aria-hidden />
          </A.Trigger>
        </h3>
      </A.Header>
      <A.Content className="pb-4 pr-12 text-16 text-ink2">{children}</A.Content>
    </A.Item>
  );
}

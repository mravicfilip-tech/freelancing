import type { ReactNode } from 'react';
import * as S from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';

// A Radix select in the floor's shape, for the finder bar. CS2's Price and High to Low controls, a
// sunken box at radius 4 with a small grey caps label over the value, and a menu panel with one
// clipped corner and a check on the pick.
export function BoxSelect({ label, icon, options, value, onValueChange, className }: { label: string; icon: ReactNode; options: { value: string; label: string; hint?: string }[]; value: string; onValueChange: (v: string) => void; className?: string }) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger
        aria-label={label}
        className={cn(
          'v4-well group flex h-10 items-center gap-3 rounded-[4px] border border-white/[0.07] pl-3 pr-3 text-left outline-none transition-colors duration-200 hover:border-white/[0.14] focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:border-white/[0.14]',
          className,
        )}
      >
        <span aria-hidden className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[rgb(var(--v4-label))] [&>svg]:h-[18px] [&>svg]:w-[18px]">
          {icon}
        </span>
        <span className="text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--v4-label))]">{label}</span>
        <span className="min-w-0 flex-1 truncate text-14 font-semibold text-ink">
          <S.Value />
        </span>
        <S.Icon>
          <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--v4-muted))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={8} align="end" className="v4-cut z-30 min-w-[var(--radix-select-trigger-width)] overflow-hidden bg-[rgb(var(--v4-panel))] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]">
          <S.Viewport className="max-h-[360px]">
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="flex h-10 cursor-pointer select-none items-center gap-3 rounded-[3px] px-3 text-14 font-semibold text-[rgb(var(--v4-muted))] outline-none data-[highlighted]:bg-white/[0.06] data-[state=checked]:text-ink data-[highlighted]:text-ink"
              >
                <S.ItemText>{o.label}</S.ItemText>
                {o.hint && <span className="num ml-auto text-12 font-bold text-[rgb(var(--v4-label))]">{o.hint}</span>}
                <S.ItemIndicator className={cn(!o.hint && 'ml-auto')}>
                  <Check weight="bold" className="h-4 w-4 text-[#C9A2FF]" aria-hidden />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}

import type { ReactNode } from 'react';
import * as S from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';

// The Select part in the kit's boxed style, for the finder bar. The same Radix select underneath,
// a dark box with a leading icon on the outside and a deep panel menu with a check on the pick.
export function BoxSelect({ label, icon, options, value, onValueChange, className }: { label: string; icon: ReactNode; options: { value: string; label: string; hint?: string }[]; value: string; onValueChange: (v: string) => void; className?: string }) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger
        aria-label={label}
        className={cn(
          'flex h-11 items-center gap-2 rounded-[12px] bg-[rgb(var(--k-item))] pl-3 pr-3 text-left text-14 font-bold text-ink outline-none transition-colors hover:bg-[rgb(var(--k-item-hover))] focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:bg-[rgb(var(--k-item-hover))] [&>svg]:shrink-0',
          className,
        )}
      >
        <span aria-hidden className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[rgb(var(--k-muted))] [&>svg]:h-[18px] [&>svg]:w-[18px]">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">
          <S.Value />
        </span>
        <S.Icon>
          <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--k-muted))]" aria-hidden />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={8} align="end" className="z-30 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[16px] border border-white/5 bg-[rgb(var(--k-panel))] p-2 shadow-2">
          <S.Viewport className="max-h-[360px]">
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="flex h-10 cursor-pointer select-none items-center gap-3 rounded-[10px] px-3 text-14 font-semibold text-[rgb(var(--k-muted))] outline-none data-[highlighted]:bg-[rgb(var(--k-item))] data-[state=checked]:text-ink data-[highlighted]:text-ink"
              >
                <S.ItemText>{o.label}</S.ItemText>
                {o.hint && <span className="num ml-auto text-12 text-[rgb(var(--k-dim))]">{o.hint}</span>}
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

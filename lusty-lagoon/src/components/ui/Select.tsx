import * as S from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';
import { useId } from 'react';
import { cn } from '../../lib/cn';

export type Option = { value: string; label: string };

// Looks like a Field. The menu is a raised layer with a 1px edge and shadow level 2.
export function Select({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Choose',
  hint,
  className,
}: {
  label: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-14 font-medium text-ink2">
        {label}
      </label>
      <S.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
        <S.Trigger
          id={id}
          className="flex h-11 items-center justify-between gap-2 rounded-lg border border-field bg-sunken px-4 text-left text-16 text-ink data-[placeholder]:text-ink3 focus-visible:border-accent"
        >
          <S.Value placeholder={placeholder} />
          <S.Icon>
            <CaretDown className="h-5 w-5 text-ink2" aria-hidden />
          </S.Icon>
        </S.Trigger>
        <S.Portal>
          <S.Content position="popper" sideOffset={4} className="z-20 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line bg-raised p-1 shadow-2">
            <S.Viewport>
              {options.map((o) => (
                <S.Item
                  key={o.value}
                  value={o.value}
                  className="flex h-10 cursor-pointer select-none items-center justify-between gap-3 rounded px-3 text-16 text-ink outline-none data-[highlighted]:bg-panel"
                >
                  <S.ItemText>{o.label}</S.ItemText>
                  <S.ItemIndicator>
                    <Check weight="bold" className="h-4 w-4 text-accent" aria-hidden />
                  </S.ItemIndicator>
                </S.Item>
              ))}
            </S.Viewport>
          </S.Content>
        </S.Portal>
      </S.Root>
      {hint && <p className="text-14 text-ink3">{hint}</p>}
    </div>
  );
}

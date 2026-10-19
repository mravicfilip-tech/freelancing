import * as C from '@radix-ui/react-checkbox';
import { Check } from '@phosphor-icons/react';
import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Checkbox({ label, error, className, ...rest }: C.CheckboxProps & { label: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start gap-3">
        <C.Root
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 bg-sunken transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent',
            error ? 'border-danger' : 'border-field',
          )}
          {...rest}
        >
          <C.Indicator>
            <Check weight="bold" size={16} className="text-page" />
          </C.Indicator>
        </C.Root>
        <label htmlFor={id} className="text-14 text-ink2">
          {label}
        </label>
      </div>
      {error && <p className="pl-8 text-14 text-danger">{error}</p>}
    </div>
  );
}

import * as S from '@radix-ui/react-switch';
import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

// A 48 by 24 track with a 20px thumb. On is accent, off is raised with a field edge.
export function Switch({ label, description, className, ...rest }: S.SwitchProps & { label: string; description?: ReactNode }) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-6', className)}>
      <label htmlFor={id} className="flex flex-col gap-1">
        <span className="text-16 font-medium text-ink">{label}</span>
        {description && <span className="text-14 text-ink2">{description}</span>}
      </label>
      <S.Root
        id={id}
        className="relative inline-flex h-6 w-12 shrink-0 items-center rounded-full border border-field bg-raised p-0.5 transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent"
        {...rest}
      >
        <S.Thumb className="block h-5 w-5 rounded-full bg-ink2 transition-transform duration-150 data-[state=checked]:translate-x-6 data-[state=checked]:bg-page" />
      </S.Root>
    </div>
  );
}

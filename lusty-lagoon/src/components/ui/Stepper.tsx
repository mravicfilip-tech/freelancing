import { Check } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { cn } from '../../lib/cn';

// Numbered steps. Done steps show a check, the current one is accent, later ones are muted.
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Steps" className="flex items-center gap-3">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <Fragment key={label}>
            {i > 0 && <li aria-hidden className={cn('h-[var(--bl-border-1)] flex-1', i <= current ? 'bg-accent' : 'bg-line')} />}
            <li aria-current={state === 'current' ? 'step' : undefined} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-14 font-semibold',
                  state === 'done' && 'bg-accent text-page',
                  state === 'current' && 'border-2 border-accent text-ink',
                  state === 'todo' && 'border-2 border-line text-ink3',
                )}
              >
                {state === 'done' ? <Check weight="bold" size={16} aria-hidden /> : i + 1}
              </span>
              <span className={cn('text-14 font-medium', state === 'todo' ? 'text-ink3' : 'text-ink')}>
                {label}
                {state === 'done' && <span className="sr-only">, done</span>}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

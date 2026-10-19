import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

// Label above, hint or error below. An error carries an icon and words, never colour alone.
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, prefix, suffix, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const noteId = `${inputId}-note`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="text-14 font-medium text-ink2">
        {label}
      </label>
      <div
        className={cn(
          'flex h-11 items-center gap-2 rounded-lg border bg-sunken px-4 transition-colors focus-within:border-accent',
          error ? 'border-danger' : 'border-field',
        )}
      >
        {prefix && <span className="text-16 text-ink3">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? noteId : undefined}
          className="num h-full min-w-0 flex-1 bg-transparent text-16 text-ink outline-none placeholder:text-ink3"
          {...rest}
        />
        {suffix}
      </div>
      {error ? (
        <p id={noteId} className="flex items-start gap-2 text-14 text-danger">
          <WarningCircle weight="bold" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={noteId} className="text-14 text-ink3">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

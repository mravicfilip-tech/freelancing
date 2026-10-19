import { forwardRef, useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { Field } from './Field';

type Props = Omit<React.ComponentProps<typeof Field>, 'type' | 'suffix'>;

export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField(props, ref) {
  const [shown, setShown] = useState(false);
  return (
    <Field
      ref={ref}
      type={shown ? 'text' : 'password'}
      {...props}
      suffix={
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="-mr-2 flex h-8 w-8 items-center justify-center rounded-lg text-ink2 hover:bg-raised hover:text-ink"
        >
          {shown ? <EyeSlash className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      }
    />
  );
});

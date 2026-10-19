import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

// One button for the landing page and the product. Flat fills, one hover step, one pressed step.
// Primary is gold and appears once per view. Secondary is tonal purple. Tertiary is text only.
const button = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-sans font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gold text-on-gold hover:bg-gold-hover active:bg-gold-press',
        secondary: 'border border-tonal-line bg-tonal text-ink hover:bg-tonal-hover active:bg-tonal',
        tertiary: 'text-accent hover:bg-raised hover:text-ink active:bg-panel',
        quiet: 'text-ink2 hover:bg-raised hover:text-ink active:bg-panel',
      },
      size: {
        sm: 'h-8 px-3 text-14',
        md: 'h-10 px-4 text-14',
        lg: 'h-11 px-6 text-16',
        icon: 'h-10 w-10 text-16',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { asChild?: boolean; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild, loading, children, disabled, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(button({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <CircleNotch className="h-5 w-5 animate-spin" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

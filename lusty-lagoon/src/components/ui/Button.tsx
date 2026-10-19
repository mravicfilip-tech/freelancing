import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

// One button for the landing page and the product, in the Figma's shapes. Gold is primary and purple
// is secondary (note 7). Each keeps one soft tone; the Figma's sunburst, gloss and bevel are gone.
// Hover lifts the fill one step, press takes it back.
const button = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-sans font-semibold transition-[filter,background-color,color] duration-150 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border border-cta-gold-line bg-[linear-gradient(180deg,rgb(var(--ll-cta-gold-top)),rgb(var(--ll-cta-gold-bottom)))] text-on-gold hover:brightness-105 active:brightness-95',
        secondary:
          'border border-ink/50 bg-[linear-gradient(180deg,rgb(var(--ll-cta-purple-top)),rgb(var(--ll-cta-purple-bottom)))] text-ink hover:brightness-110 active:brightness-95',
        tertiary: 'text-accent hover:bg-raised hover:text-ink active:bg-panel',
        quiet: 'text-ink2 hover:bg-raised hover:text-ink active:bg-panel',
      },
      size: {
        sm: 'h-8 px-3 text-14',
        md: 'h-10 px-4 text-14',
        lg: 'h-11 px-6 text-16',
        icon: 'h-10 w-10 text-16',
        // The Figma's call to action, 58 tall with an 18 radius, label in capitals.
        cta: 'h-[58px] rounded-[18px] px-8 text-16 uppercase tracking-[-0.02em]',
        // The sidebar card's smaller call to action, 52 tall.
        'cta-sm': 'h-[52px] rounded-[18px] px-6 text-16 uppercase tracking-[-0.02em]',
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

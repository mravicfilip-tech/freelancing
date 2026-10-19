import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

// The wordmark's type treatment, for the logo and display headlines. Bai Jamjuree Bold in capitals,
// the Figma's banded white and ice blue fill, and a hard brand purple copy set a few pixels below it. The Figma sets
// that copy a size larger, which reads as a purple rim round each letter, drawn here as a stroke.
// The Figma's soft drop shadows are dropped.
export function BrandText({ children, drop, rim = 0, className, style }: { children: ReactNode; drop: number; rim?: number; className?: string; style?: CSSProperties }) {
  return (
    <span className={cn('relative inline-block font-display font-bold uppercase', className)} style={style}>
      <span
        aria-hidden
        className="absolute inset-0 text-brand"
        style={{ transform: `translateY(${drop}px)`, WebkitTextStroke: rim ? `${rim * 2}px rgb(var(--ll-brand))` : undefined }}
      >
        {children}
      </span>
      <span className="relative block bg-[linear-gradient(180deg,#FFF_26%,#E1F5FE_32%,#E1F5FE_48%,#FFF_59%,#B6E3F6_75%)] bg-clip-text text-transparent">{children}</span>
    </span>
  );
}

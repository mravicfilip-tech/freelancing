import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';

// Small parts the Mascot stage shares. Type stays on the variant's ramp, 12 14 16 20 28 40 64.

/** True when a shot asked the page to hold still. */
export function useStill() {
  return useMemo(() => new URLSearchParams(window.location.search).has('still'), []);
}

/** True from 1920 wide, the same break as the w1920 classes. */
export function useWide() {
  const q = '(min-width: 1920px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

/** A handle the way the feeds write it, @peki82. */
export const handle = (name: string) => `@${name.replace(/\s|\./g, '').toLowerCase()}`;

/** A section title, a coloured icon in a small round well and the title in the variant's one heading
 * style, Bai Jamjuree 700 in sentence case, the same as the hero headline and the originals cards. */
export function SectionTitle({ id, icon, children, sub }: { id?: string; icon: ReactNode; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span aria-hidden className="m2-box flex h-10 w-10 shrink-0 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <h2 id={id} className="truncate font-display text-20 font-bold leading-6 tracking-[-0.01em] text-ink">
          {children}
        </h2>
        {sub && <p className="truncate text-12 font-semibold text-[rgb(var(--m2-ink3))]">{sub}</p>}
      </div>
    </div>
  );
}

/** A player picture, or their initials on a purple disc when there is none. */
export function Face({ src, initials, size = 24, className }: { src?: string; initials?: string; size?: 20 | 24 | 32 | 40; className?: string }) {
  const box = { 20: 'h-5 w-5', 24: 'h-6 w-6', 32: 'h-8 w-8', 40: 'h-10 w-10' }[size];
  if (src) return <img src={src} alt="" className={cn(box, 'shrink-0 rounded-full object-cover', className)} />;
  return <span className={cn(box, 'flex shrink-0 items-center justify-center rounded-full bg-[#4A2C80] text-12 font-bold leading-none text-ink', className)}>{initials}</span>;
}

/** A loading block in the real shape, with a slow shimmer. */
export function Skel({ className }: { className?: string }) {
  return <span aria-hidden className={cn('m2-shimmer block', className)} />;
}

/** Empty and error states. An icon, one line, one sentence, at most one action. */
export function StateNote({ icon, title, body, action, className }: { icon: ReactNode; title: string; body: string; action?: ReactNode; className?: string }) {
  return (
    <div role="status" className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <span aria-hidden className="m2-box flex h-[48px] w-[48px] items-center justify-center rounded-full [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </span>
      <p className="text-16 font-bold text-ink">{title}</p>
      <p className="max-w-[420px] text-14 text-[rgb(var(--m2-ink2))]">{body}</p>
      {action}
    </div>
  );
}

/** A modal in the variant's own surface. Escape and the close button close it, focus returns. */
export function StageDialog({ open, onOpenChange, title, description, art, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; art?: ReactNode; children: ReactNode }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-[rgb(6_5_10/0.78)] backdrop-blur-[2px]" />
        <D.Content className="m2-box fixed left-1/2 top-1/2 z-40 flex w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-hidden rounded-[28px] p-6 text-ink shadow-[0_32px_64px_rgb(0_0_0/0.5)] outline-none">
          {art}
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <D.Title className="text-20 font-extrabold leading-6 tracking-[-0.01em]">{title}</D.Title>
              {description ? <D.Description className="text-14 text-[rgb(var(--m2-ink2))]">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            <D.Close aria-label="Close" className="m2-box m2-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--m2-ink2))] outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
              <X weight="bold" className="h-4 w-4" aria-hidden />
            </D.Close>
          </div>
          <div className="relative flex flex-col gap-4">{children}</div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

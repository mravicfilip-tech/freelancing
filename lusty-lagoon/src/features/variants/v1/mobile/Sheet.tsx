import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import * as D from '@radix-ui/react-dialog';
import { ArrowLeft, X } from '@phosphor-icons/react';
import { cn } from '../../../../lib/cn';
import { IconSquare } from '../ui';

// One panel for every phone iteration, on Radix Dialog, so Escape, the scrim, the focus trap, the
// return of focus and the body scroll lock come with it. Five kinds.
//   bottom  a sheet from the bottom with a drag handle, a drag down closes it (iteration 1, rewards in 3)
//   top     a sheet from the top for notifications and the account, a drag up closes it (all three)
//   full    the whole screen with a back arrow, sliding in like a pushed page (iteration 2)
//   left    a drawer from the left for the menu (iteration 3)
//   right   a drawer from the right for the chat (iteration 3)

export type SheetKind = 'bottom' | 'top' | 'full' | 'left' | 'right';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Where focus goes when the panel closes, the control that opened it. */
  returnFocus?: () => void;
  /** What takes focus when the panel opens. The panel itself when this gives nothing. */
  initialFocus?: () => HTMLElement | null | undefined;
  kind: SheetKind;
  title: string;
  /** The title stays for assistive tech only, when the content carries its own heading. */
  titleHidden?: boolean;
  icon?: ReactNode;
  /** Controls beside the title, such as the chat's online count and Rules. */
  actions?: ReactNode;
  /** A fixed height for content that fills it, such as the chat. Otherwise the panel fits its content. */
  fill?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/** The edge a sheet leaves by, and which way a drag has to go to close it. */
const DRAG: Record<Exclude<SheetKind, 'full'>, { axis: 'x' | 'y'; sign: 1 | -1 }> = {
  bottom: { axis: 'y', sign: 1 },
  top: { axis: 'y', sign: -1 },
  left: { axis: 'x', sign: -1 },
  right: { axis: 'x', sign: 1 },
};

export function Sheet({ open, onClose, returnFocus, initialFocus, kind, title, titleHidden, icon, actions, fill, className, bodyClassName, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ from: number; at: number; d: number; id: number } | null>(null);
  const dir = kind === 'full' ? null : DRAG[kind];

  const move = (d: number) => {
    const el = panel.current;
    if (!el || !dir) return;
    const px = d * dir.sign;
    el.style.transform = dir.axis === 'x' ? `translateX(${px}px)` : `translateY(${px}px)`;
  };
  const down = (e: ReactPointerEvent<HTMLElement>) => {
    if (!dir || e.button !== 0 || (e.target as HTMLElement).closest('button, a, input, [role="tab"]')) return;
    drag.current = { from: dir.axis === 'x' ? e.clientX : e.clientY, at: performance.now(), d: 0, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panel.current) panel.current.style.transition = 'none';
  };
  const drift = (e: ReactPointerEvent<HTMLElement>) => {
    const s = drag.current;
    if (!s || !dir || s.id !== e.pointerId) return;
    s.d = Math.max(0, ((dir.axis === 'x' ? e.clientX : e.clientY) - s.from) * dir.sign);
    move(s.d);
  };
  const up = () => {
    const s = drag.current;
    const el = panel.current;
    drag.current = null;
    if (!s || !el || !dir) return;
    const size = dir.axis === 'x' ? el.offsetWidth : el.offsetHeight;
    const fast = s.d / Math.max(1, performance.now() - s.at) > 0.6;
    el.style.transition = '';
    if (s.d > size * 0.25 || (fast && s.d > 24)) {
      // Glide the rest of the way out from where the finger let go, then close.
      move(size + 24);
      window.setTimeout(onClose, 180);
    } else {
      el.style.transform = '';
    }
  };
  const handle = dir ? { onPointerDown: down, onPointerMove: drift, onPointerUp: up, onPointerCancel: up } : {};

  const close = (
    <IconSquare label={kind === 'full' ? 'Back' : 'Close'} onClick={onClose} size={44} className="n1m-close">
      {kind === 'full' ? <ArrowLeft weight="bold" className="h-5 w-5" aria-hidden /> : <X weight="bold" className="h-5 w-5" aria-hidden />}
    </IconSquare>
  );

  return (
    <D.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <D.Portal>
        <D.Overlay className={cn('n1m-scrim', kind === 'full' && 'n1m-scrim-none')} />
        <D.Content
          ref={panel}
          aria-describedby={undefined}
          data-kind={kind}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            const el = initialFocus?.();
            if (el) el.focus();
            else panel.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(e) => {
            if (!returnFocus) return;
            e.preventDefault();
            returnFocus();
          }}
          className={cn('n1 n1m-sheet', fill && 'n1m-fill', className)}
        >
          {kind === 'bottom' && (
            <div className="n1m-grab" {...handle}>
              <span aria-hidden className="n1m-grip" />
            </div>
          )}
          {/* The header drags the panel too, so the handle is never the only place to grab. */}
          <header className={cn('n1m-head', titleHidden && 'n1m-head-bare')} {...handle}>
            {kind === 'full' && close}
            {titleHidden ? (
              <D.Title className="sr-only">{title}</D.Title>
            ) : (
              <D.Title className="flex min-w-0 flex-1 items-center gap-2 font-display text-20 font-bold tracking-[-0.01em] text-ink">
                {icon}
                <span className="truncate">{title}</span>
              </D.Title>
            )}
            {titleHidden && <span className="flex-1" />}
            {actions}
            {kind !== 'full' && close}
          </header>
          <div className={cn('n1m-body', bodyClassName)}>{children}</div>
          {kind === 'top' && (
            <div className="n1m-grab n1m-grab-end" {...handle}>
              <span aria-hidden className="n1m-grip" />
            </div>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

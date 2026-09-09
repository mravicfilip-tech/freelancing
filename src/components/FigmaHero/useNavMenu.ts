import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Open/closed state for the nav's phone menu, with the behaviour a sheet that covers the page is
 * expected to have: Escape and a click outside close it, the page behind it stops scrolling, Tab
 * cycles inside it rather than wandering into the hidden page, focus moves into the sheet when it
 * opens and returns to the trigger when it closes, and it closes on a link so tapping a section
 * does not leave the sheet covering it. The sheet only exists below the breakpoint that hides the
 * nav's own links, so it also closes if the viewport grows past that — otherwise the state would
 * survive invisibly and the trigger would come back already open.
 */
export function useNavMenu(query = '(max-width: 1100px)') {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  /** Set while closing so focus returns to the trigger only when the user closed it themselves. */
  const restoring = useRef(false);

  const close = useCallback((restoreFocus = true) => {
    restoring.current = restoreFocus;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      if (restoring.current) {
        restoring.current = false;
        trigger.current?.focus();
      }
      return;
    }
    // The first link, so a keyboard lands inside the sheet rather than after it.
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();

    // Hold the page still behind the sheet, and hold its width still too: on a classic-scrollbar
    // platform the lock takes the scrollbar away, and without the gutter back every section jumps
    // sideways as the sheet opens. (The bar and the sheet are laid out against the initial
    // containing block, which also widens, so those two still shift by the scrollbar's width for
    // as long as the sheet is open. Reserving the gutter page-wide would fix that but costs a dead
    // strip on every platform whose scrollbars are overlays, which is the worse trade.)
    const { body } = document;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const overflow = body.style.overflow;
    const pad = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // The language list is a layer of its own inside the sheet and closes itself on Escape.
        // Taking the sheet down with it would answer one press twice.
        if (panel.current?.querySelector('.lp[data-open="true"]')) return;
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      // Keep the tab ring inside the sheet and its trigger: everything else is behind a scrim.
      const stops = [
        ...(panel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ].filter((el) => el.offsetParent !== null);
      if (!stops.length) return;
      const ring = trigger.current ? [trigger.current, ...stops] : stops;
      const first = ring[0];
      const last = ring[ring.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // Focus can end up on the body — closing the language list drops it there — and from there
      // a plain Tab walked straight out to the page behind the scrim.
      const outside = !active || !ring.includes(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !trigger.current?.contains(t)) close(false);
    };
    const mq = window.matchMedia(query);
    const onWidth = () => {
      if (!mq.matches) close(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    mq.addEventListener('change', onWidth);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      mq.removeEventListener('change', onWidth);
      body.style.overflow = overflow;
      body.style.paddingRight = pad;
    };
  }, [open, close, query]);

  return { open, setOpen, close, trigger, panel };
}

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Open/closed state for the nav's phone menu, with the behaviour a menu is expected to have:
 * Escape and a click outside close it, focus moves into the panel when it opens and returns to the
 * trigger when it closes, and it closes on a link so tapping a section does not leave the panel
 * covering it. The panel only exists below the breakpoint that hides the nav's own links, so it
 * also closes if the viewport grows past that — otherwise the state would survive invisibly and
 * the trigger would come back already open.
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
    // The first link, so a keyboard lands inside the panel rather than after it.
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
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
    };
  }, [open, close, query]);

  return { open, setOpen, close, trigger, panel };
}

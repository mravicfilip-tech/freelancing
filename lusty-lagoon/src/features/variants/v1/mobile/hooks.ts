import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Hooks the phone shell shares. The phone is anything under 768px wide, read with matchMedia so the
// desktop markup is never rendered on a phone.

const PHONE = '(max-width: 767.98px)';

/** True under 768px wide. It follows the window as it is resized or turned. */
export function usePhone() {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  useEffect(() => {
    const m = window.matchMedia(PHONE);
    const on = () => setPhone(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return phone;
}

/**
 * The page's dialogs open without a Radix trigger, so on close Radix has nowhere to send focus and it
 * falls to the page, out of the panel underneath. This wraps a dialog's setter. It keeps the control
 * that opened the dialog and focuses it again once the dialog has gone, unless something else took
 * focus. Off, it hands the setter back as is, so the desktop keeps its behaviour.
 */
export function useFocusReturn(on: boolean) {
  const from = useRef<HTMLElement | null>(null);
  return useCallback(
    <T,>(set: (v: T) => void) =>
      (v: T) => {
        if (on && v) from.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (on && !v) {
          const el = from.current;
          from.current = null;
          window.setTimeout(() => {
            if (el?.isConnected && (!document.activeElement || document.activeElement === document.body)) el.focus({ preventScroll: true });
          }, 40);
        }
        set(v);
      },
    [on],
  );
}

export type Iteration = 1 | 2 | 3;

/** The phone iteration from ?m=1, ?m=2 or ?m=3. Anything else is 1. */
export function useIteration(): Iteration {
  const { search } = useLocation();
  return useMemo(() => {
    const m = new URLSearchParams(search).get('m');
    return m === '2' ? 2 : m === '3' ? 3 : 1;
  }, [search]);
}

/**
 * The floating dock hides while the page scrolls down and comes back on the way up, near the top and
 * at the very end of the page. ?still keeps it in place for shots.
 */
export function useDockShown(still: boolean) {
  const [shown, setShown] = useState(true);
  const last = useRef(0);
  useEffect(() => {
    if (still) return;
    last.current = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const end = y + window.innerHeight >= document.documentElement.scrollHeight - 24;
      if (y < 80 || end) setShown(true);
      else if (y > last.current + 8) setShown(false);
      else if (y < last.current - 8) setShown(true);
      if (Math.abs(y - last.current) > 8 || y < 80) last.current = y;
    };
    const on = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [still]);
  return shown;
}

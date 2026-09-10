import { useEffect, useState } from 'react';

/**
 * The state the fixed nav is in: condensed once the page has scrolled past `threshold`, and
 * whether a scroll is happening right now.
 *
 * The second one exists because the bar draws itself back to full width on hover, and it spans
 * the top of a fixed viewport — so a pointer left anywhere near the top of the screen is over it.
 * Scrolling with the pointer up there (which is where it is, having just used the nav) held the
 * bar open the whole way down the page: it read as the condense being late, when it had in fact
 * been overruled. While the wheel is turning the hover is ignored; a moment after it stops, a
 * deliberate hover brings the bar back as designed.
 */
export function useNavCondense(threshold = 48, settle = 220) {
  const [condensed, setCondensed] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    let idle = 0;
    const read = () => {
      setCondensed(window.scrollY > threshold);
      setScrolling(true);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setScrolling(false), settle);
    };
    setCondensed(window.scrollY > threshold);
    window.addEventListener('scroll', read, { passive: true });
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener('scroll', read);
    };
  }, [threshold, settle]);

  return { condensed, scrolling };
}

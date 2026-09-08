import { useEffect, useState } from 'react';

/**
 * True once the page has scrolled past `threshold`. The nav is fixed, so this is what turns it
 * from the full bar into the short one; the reads are cheap and the state only flips on the
 * crossing, so React re-renders twice per page rather than once per scroll event.
 */
export function useNavCondense(threshold = 48) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const read = () => setCondensed(window.scrollY > threshold);
    read();
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, [threshold]);

  return condensed;
}

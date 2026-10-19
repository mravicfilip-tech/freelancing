import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './hover.css';

/** The four primary hovers on the round 7 board, by ?hover=. Default until Filip picks. */
export const HOVER_PICKS = ['1', '2', '3', '4'] as const;
const HOVER_DEFAULT = '1';
const KEY = 'll-hover';

/** The light layer inside a primary key. Put it first inside any button that carries .k-hov. */
export function HoverFx() {
  return <span aria-hidden className="k-hov-fx" />;
}

/** Sets <html data-hover> from ?hover=, remembered for the tab so the switcher keeps it across variants. */
export function useHoverPick() {
  const { search } = useLocation();
  useEffect(() => {
    const asked = new URLSearchParams(search).get('hover');
    let pick = HOVER_DEFAULT;
    try {
      if (asked && (HOVER_PICKS as readonly string[]).includes(asked)) sessionStorage.setItem(KEY, asked);
      pick = sessionStorage.getItem(KEY) ?? HOVER_DEFAULT;
    } catch {
      if (asked && (HOVER_PICKS as readonly string[]).includes(asked)) pick = asked;
    }
    document.documentElement.dataset.hover = pick;
  }, [search]);
}

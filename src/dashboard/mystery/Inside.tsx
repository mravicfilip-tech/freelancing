import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from '../icons';
import { PrizeCard } from './PrizeCard';
import { FxRow } from './FxRow';
import { PRIZES } from './data';

/**
 * Every prize a box can hold, rarest first. On a screen wide enough the ten
 * cards grow to fill the row (the card is drawn at fixed Figma coordinates,
 * so it scales as a whole); narrower, they stay at size and the row scrolls.
 */
const N = PRIZES.length;
const GAP = 12;
const CARD = 160;

export function Inside() {
  const row = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const inner = e.contentRect.width;
      const z = (inner - GAP * (N - 1)) / (CARD * N);
      el.style.setProperty('--z', String(Math.max(1, z)));
      setFits(el.scrollWidth <= el.clientWidth + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const step = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 172 * 3, behavior: 'smooth' });
  return (
    <section className={`card inside${fits ? ' inside--fits' : ''}`} aria-labelledby="inside-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="inside-title">What's inside</h2>
          <p className="orders__sub">Ten prizes; the odds are per box</p>
        </div>
        <div className="inside__nav">
          <button type="button" className="chip-btn inside__step" onClick={() => step(-1)} aria-label="Scroll back"><ChevronRight className="icon-16 pager__prev" /></button>
          <button type="button" className="chip-btn inside__step" onClick={() => step(1)} aria-label="Scroll on"><ChevronRight className="icon-16" /></button>
        </div>
      </header>
      <FxRow className="inside__wrap">
        <div className="inside__row" ref={row}>
          {PRIZES.map((p) => <PrizeCard key={p.id} p={p} />)}
        </div>
      </FxRow>
    </section>
  );
}

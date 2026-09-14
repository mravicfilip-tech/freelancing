import { useRef } from 'react';
import { ChevronRight } from '../icons';
import { PrizeCard } from './PrizeCard';
import { FxRow } from './FxRow';
import { PRIZES } from './data';

/** Every prize a box can hold, in one row that scrolls, rarest first. */
export function Inside() {
  const row = useRef<HTMLDivElement>(null);
  const step = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 172 * 3, behavior: 'smooth' });
  return (
    <section className="card inside" aria-labelledby="inside-title">
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

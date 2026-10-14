import { useCallback, useEffect, useRef, useState } from 'react';
import type { Content } from '../shared/content';
import { Photo } from '../shared/Photo';
import { photoAlt } from '../shared/photos';
import { Arrow } from './art';
import { WORK_FOCAL, sh, t } from './copy';

// Work photos straight after the hero. A snap row of tall cards, the first about twice as wide.
export function Work({ c }: { c: Content }) {
  const x = t(c);
  const rowRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const items = c.work.items;
  const total = String(items.length).padStart(2, '0');

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    let best = 0;
    let bestD = Infinity;
    Array.from(row.children).forEach((el, i) => {
      const d = Math.abs((el as HTMLElement).offsetLeft - row.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft) - row.scrollLeft);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActive(best);
    setAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 2);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const go = (dir: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    const to = Math.max(0, Math.min(items.length - 1, active + dir));
    const el = row.children[to] as HTMLElement;
    row.scrollTo({ left: el.offsetLeft - row.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: 'smooth' });
  };

  return (
    <section id="work" className="wk" aria-labelledby="wk-title">
      <div className="wk__glow" aria-hidden="true" />
      <div className="wk__in">
        <div className="wk__bar mono">
          <span>{c.work.kicker}</span>
          <span>
            {total} {c.work.count}
          </span>
        </div>
        <div className="wk__head">
          <h2 id="wk-title" className="wk__title display">
            {sh(c, c.work.title)}
          </h2>
          <p className="wk__lede mono-body">{c.work.lede}</p>
        </div>
      </div>

      <ul className="wk__row" ref={rowRef} onScroll={measure} tabIndex={0} aria-label={x.workRow}>
        {items.map((it, i) => (
          <li key={it.photo} className="wk__card">
            <Photo
              id={it.photo}
              alt={photoAlt(it.photo, c.lang)}
              className="wk__ph"
              focal={WORK_FOCAL[it.photo]}
              sizes={i === 0 ? '(min-width: 768px) 640px, 300px' : '(min-width: 768px) 320px, 300px'}
            />
            <p className="wk__n mono">
              {String(i + 1).padStart(2, '0')} / {total}
            </p>
            <p className="wk__cap mono">{it.caption}</p>
          </li>
        ))}
      </ul>

      <div className="wk__nav">
        <button type="button" className="sq" onClick={() => go(-1)} disabled={active === 0} aria-label={c.ui.prev}>
          <Arrow dir="left" />
        </button>
        <p className="mono wk__count" aria-live="polite">
          {String(active + 1).padStart(2, '0')} / {total}
        </p>
        <button type="button" className="sq" onClick={() => go(1)} disabled={atEnd || active === items.length - 1} aria-label={c.ui.next}>
          <Arrow dir="right" />
        </button>
      </div>
    </section>
  );
}

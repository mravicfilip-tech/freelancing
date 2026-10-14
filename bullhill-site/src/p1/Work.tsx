import { useCallback, useEffect, useRef, useState } from 'react';
import type { Content } from '../shared/content';
import { Photo } from '../shared/Photo';
import { photoAlt } from '../shared/photos';
import { Arrow } from './art';
import { WORK_FOCAL, sh, t } from './copy';
import { Rise } from './motion/Rise';
import './r3-work.css';

// Work photos straight after the hero. A snap row of notched photo frames, the first about twice as
// wide, starting on the grid's left edge and running off the right so the next card peeks.
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
          <Rise id="wk-title" className="wk__title display">
            {sh(c, c.work.title)}
          </Rise>
          <p className="wk__lede mono-body">{c.work.lede}</p>
        </div>
      </div>

      <ul className="wk__row" ref={rowRef} onScroll={measure} tabIndex={0} aria-label={x.workRow}>
        {items.map((it, i) => (
          <li key={it.photo} className="wk__card">
            <div className="wk__frame">
              <i className="wk__xh wk__xh--tl" aria-hidden="true" />
              <i className="wk__xh wk__xh--tr" aria-hidden="true" />
              <i className="wk__xh wk__xh--bl" aria-hidden="true" />
              <i className="wk__xh wk__xh--br" aria-hidden="true" />
              <div className="wk__clip">
                <Photo
                  id={it.photo}
                  alt={photoAlt(it.photo, c.lang)}
                  className="wk__ph"
                  focal={WORK_FOCAL[it.photo]}
                  sizes={i === 0 ? '(min-width: 768px) 720px, 300px' : '(min-width: 768px) 360px, 300px'}
                />
              </div>
              <span className="wk__skew" aria-hidden="true" />
            </div>
            <p className="wk__cap">
              <span className="wk__n">{String(i + 1).padStart(2, '0')}</span>
              <span>{it.caption}</span>
            </p>
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

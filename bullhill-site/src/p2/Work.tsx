import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Content } from '../shared/content';
import { Photo } from '../shared/Photo';
import { photoAlt, type PhotoId } from '../shared/photos';
import { Icon, Guides } from './icons';

// Card shape per photo, width over height, and where the crop sits so the ducts, the machine and
// the mountains stay in the frame.
const CARD: Record<PhotoId, { r: number; focal: string }> = {
  'route-trench-village': { r: 0.73, focal: '50% 50%' },
  'ducts-fence': { r: 0.75, focal: '50% 62%' },
  'ducts-soil': { r: 0.92, focal: '50% 50%' },
  'excavator-street': { r: 0.68, focal: '50% 46%' },
  'restored-lane': { r: 0.73, focal: '50% 62%' },
  'restored-manhole': { r: 0.95, focal: '50% 60%' },
  'restored-wall': { r: 0.95, focal: '34% 56%' },
  'ducts-trench': { r: 0.95, focal: '40% 55%' },
  'crew-dusk': { r: 0.75, focal: '55% 58%' },
  'road-crew': { r: 0.95, focal: '42% 55%' },
  'restored-path': { r: 0.95, focal: '45% 62%' },
  'restored-fence': { r: 0.75, focal: '45% 62%' },
  'dumper-dusk': { r: 0.75, focal: '45% 62%' },
  'site-setup': { r: 0.95, focal: '45% 60%' },
  'street-barriers': { r: 0.95, focal: '50% 70%' },
};

// The work section, straight after the hero. Seven photos in a row that bleeds off the right edge.
export function Work({ c }: { c: Content }) {
  const row = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const read = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    read();
    el.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      el.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  const go = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.6, behavior: 'smooth' });
  const total = String(c.work.items.length).padStart(2, '0');

  return (
    <section className="p2-work" id="work" aria-labelledby="p2-work-title">
      <Guides />
      <div className="p2-wrap p2-work__head">
        <h2 className="p2-display p2-h2 p2-work__title" id="p2-work-title">{c.work.title}</h2>
        <p className="p2-work__lede">{c.work.lede}</p>
        <div className="p2-work__nav">
          <button type="button" className="p2-work__btn" onClick={() => go(-1)} disabled={edge.start} aria-label={c.ui.prev}>
            <Icon name="arrow-left" />
          </button>
          <button type="button" className="p2-work__btn" onClick={() => go(1)} disabled={edge.end} aria-label={c.ui.next}>
            <Icon name="arrow" />
          </button>
        </div>
      </div>

      <div className="p2-work__scroller" ref={row} role="region" aria-label={c.work.title} tabIndex={0}>
        <ol className="p2-work__row">
          {c.work.items.map((it, i) => (
            <li key={`${it.photo}${i}`} className="p2-work__card" style={{ '--r': CARD[it.photo].r } as CSSProperties}>
              <Photo
                id={it.photo}
                alt={photoAlt(it.photo, c.lang)}
                focal={CARD[it.photo].focal}
                sizes="(min-width: 768px) 420px, 280px"
                className="p2-work__photo"
              />
              <p className="p2-mono p2-work__cap">
                <span>{String(i + 1).padStart(2, '0')} / {total}</span>
                {it.caption}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

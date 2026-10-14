import type { Content } from '../shared/content';
import { Guides } from './icons';
import { pick } from './copy';

const SLOTS = [0, 1, 2, 3, 4, 5];

export function LogoStrip({ c }: { c: Content }) {
  const k = pick(c.lang).logos;
  return (
    <section className="p2-logos" aria-label={k.region}>
      <Guides />
      <div className="p2-wrap">
        <p className="p2-logos__line">{k.line}</p>
      </div>
      <div className="p2-wrap p2-logos__scroller">
        <ul className="p2-logos__row">
          {SLOTS.map((i) => (
            <li key={i} className="p2-logos__slot">
              <span className={`p2-logos__glyph p2-logos__glyph--${i % 3}`} aria-hidden="true" />
              <span>{k.slot}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

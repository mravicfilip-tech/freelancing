import type { Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
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

export function Ethos({ c }: { c: Content }) {
  const shots = [c.services.items[0].shot, c.hero.shot, c.services.items[1].shot, c.services.items[2].shot];
  return (
    <section className="p2-ethos">
      <Guides />
      <div className="p2-wrap">
        <h2 className="p2-display p2-h2 p2-ethos__title">{c.ethos.title}</h2>
      </div>
      <div className="p2-wrap p2-ethos__rowwrap">
        <div className="p2-ethos__row">
          {shots.map((s, i) => (
            <Placeholder key={s.id} shot={s} label={c.ui.photo} index={i + 1} brief={i === 1} className={`p2-ph p2-ethos__ph p2-ethos__ph--${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}


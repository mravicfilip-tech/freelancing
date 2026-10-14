import { useState } from 'react';
import { Tabs } from 'radix-ui';
import type { Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
import { Icon, Guides } from './icons';
import { pick } from './copy';

export function Projects({ c }: { c: Content }) {
  const k = pick(c.lang).projects;
  const items = c.projects.items;
  const [i, setI] = useState(0);
  const n = items.length;
  const at = (j: number) => items[(j + n) % n];
  const cur = at(i);
  const step = (d: number) => setI((i + d + n) % n);

  return (
    <section className="p2-projects" id="projects" aria-label={c.projects.kicker}>
      <Guides />
      <Tabs.Root value={cur.id} onValueChange={(v) => setI(items.findIndex((p) => p.id === v))} className="p2-slider">
        <div className="p2-wrap p2-slider__stripwrap">
          <div className="p2-slider__strip" aria-hidden="true">
            <Placeholder shot={at(i - 1).shot} label={c.ui.photo} brief={false} mark={false} className="p2-ph p2-slider__side p2-slider__side--l" />
            <Placeholder shot={cur.shot} label={c.ui.photo} brief className="p2-ph p2-slider__main" />
            <Placeholder shot={at(i + 1).shot} label={c.ui.photo} brief={false} mark={false} className="p2-ph p2-slider__side p2-slider__side--r" />
          </div>
        </div>

        <div className="p2-wrap p2-slider__body">
          <button type="button" className="p2-round p2-round--l" onClick={() => step(-1)} aria-label={c.ui.prev}>
            <Icon name="arrow-left" />
          </button>
          <button type="button" className="p2-round p2-round--r" onClick={() => step(1)} aria-label={c.ui.next}>
            <Icon name="arrow" />
          </button>

          <div className="p2-slider__center">
            {items.map((p) => (
              <Tabs.Content key={p.id} value={p.id} className="p2-slider__panel">
                <h2 className="p2-display p2-slider__title">{k.headlines[p.id] ?? p.title}</h2>
                <p className="p2-mono p2-slider__meta">
                  <span>{p.length}</span>
                  <i className="p2-sq" aria-hidden="true" />
                  <span>
                    {p.place}, {p.region}
                  </span>
                </p>
              </Tabs.Content>
            ))}
            <a className="p2-btn p2-btn--primary p2-slider__cta" href="#contact">
              {c.ui.send}
              <Icon name="arrow" size={16} />
            </a>
            <Tabs.List className="p2-dots" aria-label={k.group}>
              {items.map((p) => (
                <Tabs.Trigger key={p.id} value={p.id} className="p2-dots__dot" aria-label={`${k.goTo} ${p.place}`} />
              ))}
            </Tabs.List>
          </div>
        </div>
      </Tabs.Root>
    </section>
  );
}

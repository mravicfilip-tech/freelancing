import { useState } from 'react';
import { Tabs } from 'radix-ui';
import type { Content } from '../shared/content';
import { Media } from '../shared/Media';
import { ChevronLeft, ChevronRightLg, Crosshairs, MachineIcon } from './art';
import { t } from './copy';
import { ArrowList, DarkBtn, GreyBtn, Kicker, Tag } from './ui';

/* ---------- matrix, the crew and the fleet on grey ---------- */

export function Matrix({ c }: { c: Content }) {
  return (
    <section id="crew" className="p3-matrix" aria-labelledby="p3-crew-h">
      <Kicker>{c.crew.kicker}</Kicker>
      <div className="p3-matrix__inner">
        <div className="p3-matrix__intro">
          <h2 id="p3-crew-h" className="p3-h2">
            {c.crew.title}
          </h2>
          <p className="p3-matrix__body">{c.crew.body}</p>
          <DarkBtn href="#contact">{c.audiences.contractors.cta}</DarkBtn>
        </div>
        <div className="p3-matrix__grid">
          <ul className="p3-mrow p3-mrow--stats" aria-label={c.stats.kicker}>
            {c.stats.items.map((s) => (
              <li key={s.label} className="p3-cell">
                <Crosshairs />
                <span className="p3-stat">
                  {s.value}
                  {s.unit ? <small>{s.unit}</small> : null}
                </span>
                <span className="p3-cell__label">{s.label}</span>
              </li>
            ))}
          </ul>
          <ul className="p3-mrow p3-mrow--machines" aria-label={c.crew.machinesTitle}>
            {c.crew.machines.map((m, i) => (
              <li key={m.type} className="p3-cell p3-cell--machine">
                <Crosshairs />
                <MachineIcon index={i} />
                <span className="p3-cell__type">{m.type}</span>
                <span className="p3-cell__meta">
                  <span>{m.size}</span>
                  <span>{`×${m.count}`}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="p3-matrix__regions">
            <p className="p3-mono">{c.crew.areaTitle}</p>
            <ul className="p3-regions">
              {c.crew.regions.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- projects, Radix Tabs ---------- */

export function Projects({ c }: { c: Content }) {
  const items = c.projects.items;
  const [value, setValue] = useState(items[0].id);
  const idx = Math.max(0, items.findIndex((p) => p.id === value));
  const n = items.length;
  const go = (d: number) => setValue(items[(idx + d + n) % n].id);
  const num = (i: number) => String(i + 1).padStart(3, '0');
  return (
    <section id="projects" className="p3-projects p3-grid" aria-labelledby="p3-projects-h">
      <p className="p3-mono p3-projects__kicker">{c.projects.kicker}</p>
      <h2 id="p3-projects-h" className="p3-h2 p3-projects__line">
        {t(c, 'projectsLine')}
      </h2>
      <Tabs.Root value={value} onValueChange={setValue} className="p3-tabsroot">
        <div className="p3-tabs__wrap">
          <Tabs.List className="p3-tabs" aria-label={c.projects.kicker}>
            {items.map((p, i) => (
              <Tabs.Trigger key={p.id} value={p.id} className="p3-tab">
                <span className="p3-tab__n">{num(i)}</span>
                <span className="p3-tab__t">{p.title}</span>
                <span className="p3-tab__r">{p.region}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        {items.map((p, i) => (
          <Tabs.Content key={p.id} value={p.id} className="p3-ppanel">
            <div className="p3-pnotch">
              <Media shot={p.shot} lang={c.lang} label={c.ui.photo} index={i + 1} className="p3-pnotch__ph" sizes="(min-width: 1200px) 40vw, (min-width: 768px) 45vw, 90vw" />
            </div>
            <div className="p3-ppanel__text">
              <p className="p3-mono p3-ppanel__count">{`${t(c, 'projectWord')} ${num(i)}/${num(n - 1)}`}</p>
              <h3 className="p3-ppanel__title">{p.title}</h3>
              <p className="p3-mono p3-ppanel__place">{`${p.place}, ${p.region}`}</p>
              <dl className="p3-rows">
                <div>
                  <dt>{c.projects.labels.length}</dt>
                  <dd>{p.length}</dd>
                </div>
                <div>
                  <dt>{c.projects.labels.year}</dt>
                  <dd>{p.year}</dd>
                </div>
                <div>
                  <dt>{c.projects.labels.client}</dt>
                  <dd>{p.client}</dd>
                </div>
                <div>
                  <dt>{c.projects.labels.scope}</dt>
                  <dd>{p.scope}</dd>
                </div>
                {p.connections ? (
                  <div>
                    <dt>{c.projects.labels.connections}</dt>
                    <dd>{p.connections}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="p3-ppanel__speak">
                <span>{t(c, 'speak')}</span>
                <a className="p3-btn p3-btn--grey p3-btn--dotted" href="#contact">
                  <i aria-hidden="true" />
                  {t(c, 'contactUs')}
                </a>
              </div>
            </div>
            <div className="p3-ppanel__nav">
              <button type="button" className="p3-sqbtn" onClick={() => go(-1)} aria-label={c.ui.prev}>
                <ChevronLeft />
              </button>
              <button type="button" className="p3-sqbtn" onClick={() => go(1)} aria-label={c.ui.next}>
                <ChevronRightLg />
              </button>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </section>
  );
}

/* ---------- audiences ---------- */

export function Audiences({ c }: { c: Content }) {
  const cols = [c.audiences.operators, c.audiences.contractors];
  return (
    <section className="p3-aud p3-grid" aria-label={c.audiences.operators.kicker}>
      <div className="p3-aud__grid">
        {cols.map((a) => (
          <article key={a.kicker} className="p3-aud__col">
            <Tag>{a.kicker}</Tag>
            <h2 className="p3-h2 p3-aud__title">{a.title}</h2>
            <p className="p3-aud__body">{a.body}</p>
            <ArrowList
              className="p3-aud__list"
              items={a.points.map((pt) => (
                <>
                  <b>{pt.title}</b>
                  <em>{pt.body}</em>
                </>
              ))}
            />
            <GreyBtn href="#contact" icon="chevron" onLight={false}>
              {a.cta}
            </GreyBtn>
          </article>
        ))}
      </div>
    </section>
  );
}

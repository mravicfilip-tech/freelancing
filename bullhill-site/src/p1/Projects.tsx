import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Content } from '../shared/content';
import { Media } from '../shared/Media';
import { Arrow } from './art';
import { Bracket } from './Bracket';
import { PROJECT_FOCAL, sh, t } from './copy';
import { useInView } from './motion/motion';
import { Rise } from './motion/Rise';
import './motion/sections-a.css';

// One card. Marked in once as it enters, it slides in from the right, then its photo unmasks. Only
// the first four cards are in view together, so only they stagger.
function ProjectCard({ i, on, children }: { i: number; on: boolean; children: ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  useInView(ref);
  return (
    <li ref={ref} className={`pc${on ? ' pc--on' : ''}`} style={{ '--ci': i < 4 ? i : 0 } as CSSProperties}>
      {children}
    </li>
  );
}

export function Projects({ c }: { c: Content }) {
  const x = t(c);
  const rowRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const items = c.projects.items;
  const L = c.projects.labels;

  const startPad = (row: HTMLElement) => parseFloat(getComputedStyle(row).paddingLeft);

  // The row starts on the grid, so the active card is the one nearest the grid's left edge.
  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const pad = startPad(row);
    let best = 0;
    let bestD = Infinity;
    Array.from(row.children).forEach((el, i) => {
      const d = Math.abs((el as HTMLElement).offsetLeft - pad - row.scrollLeft);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) best = row.children.length - 1;
    setActive(best);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const go = (i: number) => {
    const row = rowRef.current;
    const el = row?.children[Math.max(0, Math.min(items.length - 1, i))] as HTMLElement | undefined;
    if (!row || !el) return;
    row.scrollTo({ left: el.offsetLeft - startPad(row), behavior: 'smooth' });
  };

  return (
    <section id="projects" className="proj" aria-labelledby="proj-title">
      <div className="proj__head g">
        <div className="proj__intro">
          <Rise as="p" body className="mono kicker">
            {c.projects.kicker}
          </Rise>
          <Rise id="proj-title" className="proj__title display">
            {sh(c, c.projects.title)}
          </Rise>
        </div>
        <div className="proj__side">
          <Rise as="p" body className="proj__lede mono-body">
            {c.projects.lede}
          </Rise>
          <Bracket href="#contact">{c.ui.send}</Bracket>
        </div>
      </div>

      <ul className="proj__row" ref={rowRef} onScroll={measure} tabIndex={0} aria-label={x.scrollRow}>
        {items.map((p, i) => (
          <ProjectCard key={p.id} i={i} on={i === active}>
            <span className="bk__c bk__c--tl" aria-hidden="true" />
            <span className="bk__c bk__c--tr" aria-hidden="true" />
            <span className="bk__c bk__c--bl" aria-hidden="true" />
            <span className="bk__c bk__c--br" aria-hidden="true" />
            <Media
              shot={p.shot}
              lang={c.lang}
              label={c.ui.photo}
              index={i + 1}
              ratio="4 / 3"
              className="pc__photo"
              sizes="(min-width: 1200px) 372px, (min-width: 768px) 352px, 252px"
              focal={p.shot.photo ? PROJECT_FOCAL[p.shot.photo] : undefined}
            />
            <h3 className="pc__title display">{sh(c, p.title)}</h3>
            <p className="pc__place mono">
              {p.place}, {p.region}
            </p>
            <dl className="pc__rows">
              <div>
                <dt className="mono">{L.length}</dt>
                <dd className="mono">{p.length}</dd>
              </div>
              <div>
                <dt className="mono">{L.year}</dt>
                <dd className="mono">{p.year}</dd>
              </div>
              <div>
                <dt className="mono">{L.client}</dt>
                <dd className="mono">{p.client}</dd>
              </div>
              <div>
                <dt className="mono">{L.scope}</dt>
                <dd className="mono">{p.scope}</dd>
              </div>
              {p.connections && (
                <div>
                  <dt className="mono">{L.connections}</dt>
                  <dd className="mono">{p.connections}</dd>
                </div>
              )}
            </dl>
          </ProjectCard>
        ))}
      </ul>

      <div className="proj__nav">
        <button type="button" className="sq" onClick={() => go(active - 1)} disabled={active === 0} aria-label={c.ui.prev}>
          <Arrow dir="left" />
        </button>
        <p className="mono proj__count" aria-live="polite">
          {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </p>
        <button type="button" className="sq" onClick={() => go(active + 1)} disabled={active === items.length - 1} aria-label={c.ui.next}>
          <Arrow dir="right" />
        </button>
      </div>
    </section>
  );
}

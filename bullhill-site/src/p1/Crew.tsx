import { useRef, type CSSProperties, type ReactNode } from 'react';
import type { Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
import { Bracket } from './Bracket';
import { sh, t } from './copy';
import { Rise } from './motion/Rise';
import { useInView, useScrollVar } from './motion/motion';
import './r3-crew.css';
import './motion/sections-b.css';

// Plus shaped marks at the four corners of the box they sit in. Used by the matrix cells and the FAQ frame.
export function Crosshairs() {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
        <i key={k} className={`cxh cxh--${k}`} aria-hidden="true" />
      ))}
    </>
  );
}

// Line icons for the four machine types, 32px box, 1.5 stroke.
function MachineSvg({ children }: { children: ReactNode }) {
  return (
    <svg className="mx__icon" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function MachineIcon({ index }: { index: number }) {
  if (index === 0)
    return (
      <MachineSvg>
        <rect x="3" y="24" width="18" height="5" rx="2.5" />
        <path d="M6 24 V16 H13 V24" />
        <path d="M13 18 L19 8 L27 12 L25 20" />
        <path d="M25 20 H29 L28 24 H24 Z" />
      </MachineSvg>
    );
  if (index === 1)
    return (
      <MachineSvg>
        <rect x="5" y="25" width="13" height="4" rx="2" />
        <path d="M7 25 V19 H12 V25" />
        <path d="M12 21 L17 13 L24 16 L23 22" />
        <path d="M23 22 H27 L26 25 H22 Z" />
      </MachineSvg>
    );
  if (index === 2)
    return (
      <MachineSvg>
        <path d="M3 22 V10 H19 V22" />
        <path d="M19 13 H24.5 L29 18 V22 H19" />
        <path d="M2 22 H30" />
        <circle cx="9" cy="25" r="3" />
        <circle cx="24" cy="25" r="3" />
      </MachineSvg>
    );
  return (
    <MachineSvg>
      <path d="M4 28 H20 L22 24 H3 Z" />
      <path d="M8 24 V16 H17 V24" />
      <path d="M17 18 L27 7" />
      <path d="M25 6 H29" />
    </MachineSvg>
  );
}

export function Crew({ c }: { c: Content }) {
  const x = t(c);
  const stripRef = useRef<HTMLUListElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // the strip drifts on the scroll, the matrix cells reveal once, 40ms apart
  useScrollVar(stripRef, '--cs', 1, -0.1);
  useInView(gridRef);
  const cell = (n: number) => ({ '--c': n }) as CSSProperties;
  return (
    <section id="crew" className="crew" aria-labelledby="crew-title">
      <div className="g">
        <div className="crew__bar mono">
          <span>{c.crew.kicker}</span>
          <span>{c.contact.area}</span>
          <span>{c.contact.hours}</span>
        </div>
      </div>

      <div className="g crew__main">
        <Rise as="p" at={1.5} body className="crew__intro mono-body">
          {c.crew.body}
        </Rise>
        <Rise id="crew-title" at={1} className="crew__title display">
          {sh(c, c.crew.title)}
        </Rise>

        <ul className="crew__strip" ref={stripRef}>
          {c.crew.people.map((p, i) => (
            <li key={i} className="crew__p">
              <Placeholder shot={p.shot} label={c.ui.photo} index={i + 1} className="crew__ph" brief={false} />
              <p className="crew__name mono">{p.name}</p>
              <p className="crew__role mono">{p.role}</p>
            </li>
          ))}
        </ul>

        <Rise as="p" className="crew__title crew__title--2 display">
          {sh(c, x.crewLine)}
        </Rise>
      </div>

      <div className="mx">
        <div className="g gc mx__in">
          <div className="mx__intro">
            <Rise as="h3" plain id="mx-title" className="mx__title display">
              {sh(c, x.matrixTitle)}
            </Rise>
            <Rise as="p" body className="mx__body">
              {x.matrixBody}
            </Rise>
            <Bracket href="#contact">{c.audiences.contractors.cta}</Bracket>
          </div>

          <div className="mx__grid" ref={gridRef}>
            <ul className="mx__row mx__row--stats" aria-label={c.stats.kicker}>
              {c.stats.items.map((s, i) => (
                <li key={s.label} className="mx__cell" style={cell(i)}>
                  <Crosshairs />
                  <span className="mx__stat display">
                    {s.value}
                    {s.unit && <small>{s.unit}</small>}
                  </span>
                  <span className="mx__label mono">{s.label}</span>
                </li>
              ))}
            </ul>
            {/* the fleet row only shows once BullHill lists machines of its own */}
            {c.crew.machines.length ? (
              <ul className="mx__row mx__row--machines" aria-label={c.crew.machinesTitle}>
                {c.crew.machines.map((m, i) => (
                  <li key={m.type} className="mx__cell mx__cell--machine" style={cell(c.stats.items.length + i)}>
                    <Crosshairs />
                    <MachineIcon index={i} />
                    <span className="mx__type">{m.type}</span>
                    <span className="mx__meta mono">
                      <span>{m.size}</span>
                      <span>{`×${m.count}`}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mx__regions">
              <p className="mono mx__rk">{c.crew.areaTitle}</p>
              <p className="mono mx__rl">{c.crew.regions.join(' / ')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

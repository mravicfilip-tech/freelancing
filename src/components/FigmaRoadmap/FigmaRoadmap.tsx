import { useEffect, useRef, useState } from 'react';
import { GATES, LEVELS, RAISED, STATUS_LABEL, TARGET, doneCount, type Level } from './content';
import { useRoadmapMotion } from './useRoadmapMotion';
import './FigmaRoadmap.css';

export type RoadVariant = 1 | 2 | 3 | 4 | 5;

export const ROAD_VARIANTS = [
  { name: 'Ledger', blurb: 'Six numbered columns on the section rules, milestones cascading across them.' },
  { name: 'Stage', blurb: 'The band turns over to the footer’s black; one rail, the live level lit in lime.' },
  { name: 'Trajectory', blurb: 'One curve on black, the travelled part lit, levels read off it like a chart.' },
  { name: 'Index', blurb: 'One card: the seven levels down the left, the open level’s milestones on the right.' },
  { name: 'Journey', blurb: 'The levels wired into a column beside a meter of the raise against its gates.' },
] as const;

/** The section heading, split into masked lines like every other band's. */
function Head({ lines, intro }: { lines: [string, string]; intro: string }) {
  return (
    <div className="rd__head">
      <h2 id="rd-title" className="rd__title">
        <span className="rd__line">
          <span className="rd__lineInner">{lines[0]}</span>
        </span>
        <span className="rd__line">
          <span className="rd__lineInner rd__titleMuted">{lines[1]}</span>
        </span>
      </h2>
      <p className="rd__intro">{intro}</p>
    </div>
  );
}

const HEAD_LINES: [string, string] = ['Seven levels to launch,', 'four of them behind us.'];
const INTRO =
  'Five milestones to a level. The wallet and the PayFi platform are built and open; Markets is trading; $32M in the presale sets the launch date.';

/* ---------------------------------------------------------------- 1 Ledger */

/** Milestones cascade down and across six numbered columns, each chip overhanging into the next. */
function Ledger() {
  return (
    <div className="rd-ledger">
      <div className="rd-ledger__cols" aria-hidden="true">
        {LEVELS.map((l) => (
          <div className="rd-ledger__col" key={l.n} data-status={l.status}>
            <span className="rd-ledger__n">{l.n}</span>
            <span className="rd-ledger__name">{l.name}</span>
          </div>
        ))}
      </div>
      <ol className="rd-ledger__grid">
        {LEVELS.map((l, i) => (
          /* `display: contents` on desktop, so the chips place themselves on the grid. */
          <li className="rd-ledger__group" key={l.n}>
            <h3 className="rd-ledger__groupHead" data-status={l.status}>
              <span className="rd-digits">{l.n}</span> {l.name}
            </h3>
            {l.items.map((item, j) => (
              <span
                key={item.short}
                className="rd-chip"
                data-status={l.status}
                data-done={item.done || undefined}
                /* Each level starts two rows below the last, so the cascades overlap. */
                style={{
                  gridColumn: `${i + 1} / span ${Math.min(2, LEVELS.length - i)}`,
                  gridRow: i * 2 + j + 1,
                }}
              >
                {item.short}
              </span>
            ))}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ----------------------------------------------------------------- 2 Stage */

/** One rail, a dot per level, and the live level lifted onto a lime panel. */
function Stage() {
  return (
    <ol className="rd-stage">
      {LEVELS.map((l) => (
        <li className="rd-stage__col" key={l.n} data-status={l.status}>
          {l.status === 'live' && (
            <div className="rd-stage__lit">
              <p className="rd-stage__kicker">{STATUS_LABEL.live}</p>
              <p className="rd-stage__litBody">{l.blurb}</p>
            </div>
          )}
          <span className="rd-stage__dot" aria-hidden="true" />
          <p className="rd-stage__n">
            Level <span className="rd-digits">{l.n}</span>
          </p>
          <h3 className="rd-stage__name">{l.name}</h3>
          <ul className="rd-stage__items">
            {l.items.map((item) => (
              <li key={item.short} data-done={item.done || undefined}>
                {item.short}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------ 3 Trajectory */

const VIEW = { w: 1200, h: 460 } as const;
const CURVE = 'M 10 400 C 240 400, 300 90, 560 90 S 900 400, 1190 240';

/** The point on the path at a given x, so the nodes sit on an even horizontal rhythm. */
function pointAtX(path: SVGPathElement, x: number, total: number) {
  let lo = 0;
  let hi = total;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).x < x) lo = mid;
    else hi = mid;
  }
  return path.getPointAtLength((lo + hi) / 2);
}

/** The levels read off one curve, the travelled part lit, the live node glowing. */
function Trajectory() {
  const pathRef = useRef<SVGPathElement>(null);
  const [pts, setPts] = useState<{ x: number; y: number; steep: boolean }[]>([]);
  const [len, setLen] = useState(0);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const first = 70;
    const step = (VIEW.w - 150 - first) / (LEVELS.length - 1);
    setLen(total);
    setPts(LEVELS.map((_, i) => {
      const x = first + i * step;
      const p = pointAtX(path, x, total);
      const q = pointAtX(path, Math.min(VIEW.w, x + 24), total);
      // On a steep stretch a label set to the right would be crossed by the curve.
      return { x, y: p.y, steep: Math.abs(q.y - p.y) > Math.abs(q.x - p.x) };
    }));
  }, []);

  const liveIndex = LEVELS.findIndex((l) => l.status === 'live');
  const travelled = len ? (len * (liveIndex + 0.6)) / LEVELS.length : 0;

  return (
    <div className="rd-traj">
      <svg className="rd-traj__svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="presentation">
        <defs>
          <filter id="rd-traj-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <path ref={pathRef} className="rd-traj__base" d={CURVE} />
        {len > 0 && (
          <>
            <path
              className="rd-traj__lit rd-traj__lit--halo"
              d={CURVE}
              filter="url(#rd-traj-glow)"
              strokeDasharray={`${travelled} ${len}`}
            />
            <path className="rd-traj__lit" d={CURVE} strokeDasharray={`${travelled} ${len}`} />
          </>
        )}
        {pts.map((p, i) => {
          const l = LEVELS[i];
          /* The label hangs on the side of the node with room, never over the curve; every other
             one sits a tier further out, so seven of them never meet across the page. */
          const above = p.y > VIEW.h * 0.5;
          const tier = (i % 2) * 56;
          const top = above ? p.y - 118 - tier : p.y + 56 + tier;
          const left = i === LEVELS.length - 1 || (above && p.steep);
          const x = left ? p.x - 16 : p.x + 14;
          return (
            <g className="rd-traj__node" key={l.n} data-status={l.status} data-side={left ? 'left' : 'right'}>
              <line x1={p.x} y1={p.y} x2={p.x} y2={above ? top - 6 : top + 64} />
              <circle cx={p.x} cy={p.y} r={l.status === 'live' ? 7 : 4.5} />
              <text x={x} y={top} className="rd-traj__kicker">{`Level ${l.n}`}</text>
              <text x={x} y={top + 34} className="rd-traj__name">
                {l.name}
              </text>
              <text x={x} y={top + 58} className="rd-traj__marker">
                {l.marker}
              </text>
            </g>
          );
        })}
      </svg>
      {/* The same levels in reading order: behind the curve on a desktop, the section on a phone. */}
      <ol className="rd-traj__list">
        {LEVELS.map((l) => (
          <li key={l.n} data-status={l.status}>
            <p className="rd-traj__listN">
              Level <span className="rd-digits">{l.n}</span> — {STATUS_LABEL[l.status]}
            </p>
            <h3 className="rd-traj__listName">{l.name}</h3>
            <p className="rd-traj__listBlurb">{l.blurb}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ----------------------------------------------------------------- 4 Index */

/** The tick a milestone carries: indigo once it is done, an open ring until then. */
function Tick({ done }: { done: boolean }) {
  return (
    <span className="rd-idx__tick" data-done={done || undefined} aria-hidden="true">
      <svg viewBox="0 0 20 20" width="20" height="20">
        {done ? (
          <path
            d="M4.5 10.4 8.4 14.2 15.5 6.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <circle cx="10" cy="10" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        )}
      </svg>
    </span>
  );
}

/**
 * The levels as an index: the seven of them down the left of one card, the open level's milestones
 * on the right. Same shape as the ecosystem card — accordion and copy on the left, a washed panel
 * on the right — so the roadmap reads as another view of the same object rather than a new device.
 */
function Index() {
  const [active, setActive] = useState(() => LEVELS.findIndex((l) => l.status === 'live'));
  const level = LEVELS[active];
  const complete = LEVELS.filter((l) => l.status === 'done').length;

  return (
    <div className="rd-idx">
      <div className="rd-idx__copy">
        <div className="rd-idx__copyHead">
          <span className="rd-idx__eyebrow">Levels</span>
          <span className="rd-idx__tally">
            <b className="rd-digits">{String(complete).padStart(2, '0')}</b> of{' '}
            <b className="rd-digits">{String(LEVELS.length).padStart(2, '0')}</b> complete
          </span>
        </div>

        <ul className="rd-idx__list" role="tablist" aria-label="Roadmap levels">
          {LEVELS.map((l, i) => (
            <li key={l.n} className={`rd-idx__item${i === active ? ' rd-idx__item--on' : ''}`} data-status={l.status}>
              <i className="rd-idx__accent">
                <i />
              </i>
              <button
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls="rd-idx-panel"
                className="rd-idx__head"
                onClick={() => setActive(i)}
              >
                <span className="rd-idx__n rd-digits">{l.n}</span>
                <span className="rd-idx__title">{l.name}</span>
                <span className="rd-idx__count rd-digits">
                  {doneCount(l)}/{l.items.length}
                </span>
              </button>
              <div className="rd-idx__body">
                <p>{l.blurb}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rd-idx__panel" id="rd-idx-panel" role="tabpanel" key={level.n}>
        <div className="rd-idx__panelHead">
          <span className="rd-idx__eyebrow">Level {level.n}</span>
          <span className="rd-idx__marker" data-status={level.status}>
            {level.marker}
          </span>
        </div>
        <h3 className="rd-idx__panelTitle">{level.name}</h3>
        <ol className="rd-idx__miles">
          {level.items.map((item, j) => (
            <li key={item.short} data-done={item.done || undefined} style={{ '--j': j } as React.CSSProperties}>
              <Tick done={item.done} />
              {item.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- 5 Journey */

function Meter() {
  const pct = Math.min(100, (RAISED / TARGET) * 100);
  return (
    <div className="rd-meter" role="img" aria-label={`$${RAISED}M raised of a $${TARGET}M target.`}>
      <div className="rd-meter__scale">
        <span className="rd-meter__fill" style={{ height: `${pct}%` }} />
        <span className="rd-meter__glow" style={{ bottom: `${pct}%` }} aria-hidden="true" />
        {GATES.map((g) => (
          <span
            className="rd-meter__gate"
            key={g.at}
            style={{ bottom: `${(g.at / TARGET) * 100}%` }}
            data-passed={RAISED >= g.at || undefined}
          >
            <i />
            <em>{g.label}</em>
          </span>
        ))}
      </div>
      <p className="rd-meter__read">
        <strong className="rd-digits">${RAISED}M</strong>
        <span>
          raised of <span className="rd-digits">${TARGET}M</span>
        </span>
      </p>
    </div>
  );
}

/** The levels as wired pills, read bottom to top, with the raise meter beside them. */
function Journey() {
  const stack = [...LEVELS].reverse();
  return (
    <div className="rd-journey">
      <ol className="rd-wire">
        {stack.map((l: Level) => (
          <li className="rd-wire__row" key={l.n} data-status={l.status}>
            <span className="rd-wire__pill">
              <span className="rd-wire__n rd-digits">{l.n}</span>
              {l.name}
            </span>
            <span className="rd-wire__marker">{l.marker}</span>
          </li>
        ))}
      </ol>
      <Meter />
    </div>
  );
}

const BODIES = { 1: Ledger, 2: Stage, 3: Trajectory, 4: Index, 5: Journey } as const;

/**
 * Roadmap band. Five directions over the same six levels; `?road=1..5` picks one, and
 * `?road-picker` opens the review page. The band takes the section shell every other band
 * uses — 1560 rails, masked heading lines, an entrance keyed off ScrollTrigger.
 */
export function FigmaRoadmap({ variant = 1 }: { variant?: RoadVariant }) {
  const root = useRef<HTMLElement>(null);
  useRoadmapMotion(root, variant);
  const Body = BODIES[variant] ?? Ledger;
  const dark = variant === 2 || variant === 3;

  return (
    <section
      ref={root}
      className="rd"
      id="roadmap"
      data-variant={variant}
      data-tone={dark ? 'dark' : 'light'}
      data-motion="pending"
      aria-labelledby="rd-title"
      /* The column layouts take their track count from the data, not a number in the stylesheet. */
      style={{ '--rd-cols': LEVELS.length } as React.CSSProperties}
    >
      <div className="rd__frame">
        <Head lines={HEAD_LINES} intro={INTRO} />
        <Body />
      </div>
    </section>
  );
}

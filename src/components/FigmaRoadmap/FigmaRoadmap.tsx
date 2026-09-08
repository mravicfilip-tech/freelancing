import { useEffect, useRef, useState } from 'react';
import { GATES, LEVELS, RAISED, STATUS_LABEL, TARGET, type Level } from './content';
import { useRoadmapMotion } from './useRoadmapMotion';
import './FigmaRoadmap.css';

export type RoadVariant = 1 | 2 | 3 | 4 | 5;

export const ROAD_VARIANTS = [
  { name: 'Ledger', blurb: 'Six numbered columns on the section rules, milestones cascading across them.' },
  { name: 'Stage', blurb: 'The band turns over to the footer’s black; one rail, the live level lit in lime.' },
  { name: 'Trajectory', blurb: 'One curve on black, the travelled part lit, levels read off it like a chart.' },
  { name: 'Index', blurb: 'A drawer of tabbed cards on the reviews band; the open one shows its milestones.' },
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

const HEAD_LINES: [string, string] = ['Six levels to launch,', 'four of them behind us.'];
const INTRO =
  'Every level opens on something shipped or a raise closed — a wallet in the store, money in a bank account, the listing date set.';

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
                key={item}
                className="rd-chip"
                data-status={l.status}
                /* Each level starts two rows below the last, so the cascades overlap. */
                style={{
                  gridColumn: `${i + 1} / span ${Math.min(2, LEVELS.length - i)}`,
                  gridRow: i * 2 + j + 1,
                }}
              >
                {item}
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
              <li key={item}>{item}</li>
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
          /* The label hangs on the side of the node with room, never over the curve. */
          const above = p.y > VIEW.h * 0.5;
          const top = above ? p.y - 118 : p.y + 56;
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

/** A drawer of tabbed cards. One level is open at a time; the rest stay legible as tabs. */
function Index() {
  const [open, setOpen] = useState(() => LEVELS.findIndex((l) => l.status === 'live'));
  return (
    <div className="rd-drawer">
      {LEVELS.map((l, i) => (
        <div
          className="rd-card"
          key={l.n}
          data-status={l.status}
          data-open={i === open || undefined}
          /* The stack tapers and the tabs step across, the way an index drawer reads. */
          style={{ '--i': i, '--tab-x': `${8 + i * 13}%` } as React.CSSProperties}
        >
          <h3 className="rd-card__head">
            <button type="button" aria-expanded={i === open} onClick={() => setOpen(i)}>
              <span className="rd-card__tab">
                <span className="rd-digits">{l.n}</span>
                <em className="rd-digits">{l.items.length}</em>
              </span>
              <span className="rd-card__name">{l.name}</span>
              <span className="rd-card__marker">{l.marker}</span>
            </button>
          </h3>
          <div className="rd-card__body" hidden={i !== open}>
            <p className="rd-card__blurb">{l.blurb}</p>
            <ul className="rd-card__items">
              {l.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <p className="rd-drawer__base">
        <span>Remittix roadmap</span>
      </p>
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
    >
      <div className="rd__frame">
        <Head lines={HEAD_LINES} intro={INTRO} />
        <Body />
      </div>
    </section>
  );
}

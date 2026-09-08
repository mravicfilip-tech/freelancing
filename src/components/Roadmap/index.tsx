import { useEffect, useRef, useState } from 'react';
import { GATES, LEVELS, RAISED, STATUS_LABEL, TARGET, type Level } from './content';
import './Roadmap.css';

export const ROADMAP_IDS = ['1', '2', '3', '4', '5'] as const;
export type RoadmapId = (typeof ROADMAP_IDS)[number];

export const ROADMAPS: { id: RoadmapId; label: string; blurb: string }[] = [
  { id: '1', label: 'Ledger', blurb: 'Six numbered columns, milestones staggered across them' },
  { id: '2', label: 'Stage', blurb: 'Dark rail, the current level lifted into a lit panel' },
  { id: '3', label: 'Trajectory', blurb: 'One curve, milestones read off it like a chart' },
  { id: '4', label: 'Index', blurb: 'A drawer of tabs; the open one shows its level' },
  { id: '5', label: 'Journey', blurb: 'Wired pills beside the raise meter' },
];

const heading = 'The road to launch';
const standfirst =
  'Six levels, four of them behind us. Each one opens on a shipped product or a closed raise, not a date on a slide.';

/* ---------------------------------------------------------------- 1 Ledger */

/** Milestones staggered down and across the six numbered columns, pills overhanging into the next. */
function RoadmapLedger() {
  return (
    <section className="rm rm--ledger" id="roadmap">
      <header className="rm__head">
        <h2 className="rm__title">{heading}</h2>
        <p className="rm__standfirst">{standfirst}</p>
      </header>
      <div className="rm-ledger">
        <div className="rm-ledger__cols" aria-hidden="true">
          {LEVELS.map((l) => (
            <div className="rm-ledger__col" key={l.n} data-status={l.status}>
              <span className="rm-ledger__n">{l.n}</span>
              <span className="rm-ledger__name">{l.name}</span>
            </div>
          ))}
        </div>
        <ol className="rm-ledger__grid">
          {LEVELS.map((l, i) => (
            /* `display: contents` on desktop, so the pills place themselves on the grid. */
            <li className="rm-ledger__group" key={l.n}>
              <h3 className="rm-ledger__grouphead" data-status={l.status}>
                {l.n} {l.name}
              </h3>
              {l.items.map((item, j) => (
                <span
                  key={item}
                  className="rm-pill"
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
    </section>
  );
}

/* ----------------------------------------------------------------- 2 Stage */

/** Dark. One rail, a dot per level, and the live level lifted into a lit panel. */
function RoadmapStage() {
  return (
    <section className="rm rm--dark rm--stage" id="roadmap">
      <header className="rm__head">
        <h2 className="rm__title">{heading}</h2>
        <p className="rm__standfirst">{standfirst}</p>
      </header>
      <ol className="rm-stage">
        {LEVELS.map((l) => (
          <li className="rm-stage__col" key={l.n} data-status={l.status}>
            {l.status === 'live' && (
              <div className="rm-stage__lit">
                <p className="rm-stage__kicker">{STATUS_LABEL.live}</p>
                <p className="rm-stage__litbody">{l.blurb}</p>
              </div>
            )}
            <span className="rm-stage__dot" aria-hidden="true" />
            <p className="rm-stage__n">Level {l.n}</p>
            <h3 className="rm-stage__name">{l.name}</h3>
            <ul className="rm-stage__items">
              {l.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
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

/** Dark. The levels are read off one curve, the travelled part lit, the live node glowing. */
function RoadmapTrajectory() {
  const pathRef = useRef<SVGPathElement>(null);
  const [pts, setPts] = useState<{ x: number; y: number; at: number }[]>([]);
  const [len, setLen] = useState(0);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const first = 70;
    const step = (VIEW.w - 150 - first) / (LEVELS.length - 1);
    setLen(total);
    setPts(
      LEVELS.map((_, i) => {
        const x = first + i * step;
        const p = pointAtX(path, x, total);
        return { x, y: p.y, at: 0 };
      }),
    );
  }, []);

  const liveIndex = LEVELS.findIndex((l) => l.status === 'live');
  const travelled = len ? (len * (liveIndex + 0.6)) / LEVELS.length : 0;

  return (
    <section className="rm rm--dark rm--trajectory" id="roadmap">
      <header className="rm__head">
        <h2 className="rm__title">{heading}</h2>
        <p className="rm__standfirst">{standfirst}</p>
      </header>
      <div className="rm-traj">
        <svg className="rm-traj__svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="presentation">
          <defs>
            <filter id="rm-traj-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>
          <path ref={pathRef} className="rm-traj__base" d={CURVE} />
          {len > 0 && (
            <>
              <path
                className="rm-traj__lit rm-traj__lit--halo"
                d={CURVE}
                filter="url(#rm-traj-glow)"
                strokeDasharray={`${travelled} ${len}`}
              />
              <path className="rm-traj__lit" d={CURVE} strokeDasharray={`${travelled} ${len}`} />
            </>
          )}
          {pts.map((p, i) => {
            const l = LEVELS[i];
            /* The label hangs on the side of the node with room, never over the curve. */
            const above = p.y > VIEW.h * 0.5;
            const top = above ? p.y - 118 : p.y + 56;
            const last = i === LEVELS.length - 1;
            const x = last ? p.x - 16 : p.x + 14;
            return (
              <g
                className="rm-traj__node"
                key={l.n}
                data-status={l.status}
                data-side={last ? 'left' : 'right'}
              >
                <line x1={p.x} y1={p.y} x2={p.x} y2={above ? top - 6 : top + 64} />
                <circle cx={p.x} cy={p.y} r={l.status === 'live' ? 7 : 4.5} />
                <text x={x} y={top}>{`Level ${l.n}`}</text>
                <text x={x} y={top + 32} className="rm-traj__name">
                  {l.name}
                </text>
                <text x={x} y={top + 56} className="rm-traj__marker">
                  {l.marker}
                </text>
              </g>
            );
          })}
        </svg>
        {/* The same levels in reading order: hidden behind the curve, the whole section on mobile. */}
        <ol className="rm-traj__list">
          {LEVELS.map((l) => (
            <li key={l.n} data-status={l.status}>
              <p className="rm-traj__listn">
                Level {l.n} — {STATUS_LABEL[l.status]}
              </p>
              <h3 className="rm-traj__listname">{l.name}</h3>
              <p className="rm-traj__listblurb">{l.blurb}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- 4 Index */

/** A drawer of tabs. One level is open at a time; the rest stay legible as tabs. */
function RoadmapIndex() {
  const [open, setOpen] = useState(() => LEVELS.findIndex((l) => l.status === 'live'));
  return (
    <section className="rm rm--index" id="roadmap">
      <header className="rm__head">
        <h2 className="rm__title">{heading}</h2>
        <p className="rm__standfirst">{standfirst}</p>
      </header>
      <div className="rm-drawer">
        {LEVELS.map((l, i) => (
          <div
            className="rm-card"
            key={l.n}
            data-status={l.status}
            data-open={i === open || undefined}
            /* The stack tapers and the tabs step across, the way an index drawer reads. */
            style={{ '--i': i, '--tab-x': `${8 + i * 13}%` } as React.CSSProperties}
          >
            <h3 className="rm-card__head">
              <button type="button" aria-expanded={i === open} onClick={() => setOpen(i)}>
                <span className="rm-card__tab">
                  {l.n}
                  <em>{l.items.length}</em>
                </span>
                <span className="rm-card__name">{l.name}</span>
                <span className="rm-card__marker">{l.marker}</span>
              </button>
            </h3>
            <div className="rm-card__body" hidden={i !== open}>
              <p className="rm-card__blurb">{l.blurb}</p>
              <ul className="rm-card__items">
                {l.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        <p className="rm-drawer__base">
          <span>Remittix roadmap</span>
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- 5 Journey */

function Meter() {
  const pct = Math.min(100, (RAISED / TARGET) * 100);
  return (
    <div className="rm-meter" role="img" aria-label={`$${RAISED}M raised of a $${TARGET}M target.`}>
      <div className="rm-meter__scale">
        <span className="rm-meter__fill" style={{ height: `${pct}%` }} />
        <span className="rm-meter__glow" style={{ bottom: `${pct}%` }} aria-hidden="true" />
        {GATES.map((g) => (
          <span
            className="rm-meter__gate"
            key={g.at}
            style={{ bottom: `${(g.at / TARGET) * 100}%` }}
            data-passed={RAISED >= g.at || undefined}
          >
            <i />
            <em>{g.label}</em>
          </span>
        ))}
      </div>
      <p className="rm-meter__read">
        <strong>${RAISED}M</strong>
        <span>raised of ${TARGET}M</span>
      </p>
    </div>
  );
}

/** The levels as wired pills, read bottom to top, with the raise meter beside them. */
function RoadmapJourney() {
  const stack = [...LEVELS].reverse();
  return (
    <section className="rm rm--journey" id="roadmap">
      <div className="rm-journey">
        <header className="rm__head rm__head--tight">
          <h2 className="rm__title">
            Where we are
            <br />
            on the road.
          </h2>
          <p className="rm__standfirst">{standfirst}</p>
        </header>
        <ol className="rm-wire">
          {stack.map((l: Level) => (
            <li className="rm-wire__row" key={l.n} data-status={l.status}>
              <span className="rm-wire__pill">
                <span className="rm-wire__n">{l.n}</span>
                {l.name}
              </span>
              <span className="rm-wire__marker">{l.marker}</span>
            </li>
          ))}
        </ol>
        <Meter />
      </div>
    </section>
  );
}

const BY_ID: Record<RoadmapId, () => React.JSX.Element> = {
  '1': RoadmapLedger,
  '2': RoadmapStage,
  '3': RoadmapTrajectory,
  '4': RoadmapIndex,
  '5': RoadmapJourney,
};

export function Roadmap({ variant }: { variant: RoadmapId }) {
  const View = BY_ID[variant] ?? RoadmapLedger;
  return <View />;
}

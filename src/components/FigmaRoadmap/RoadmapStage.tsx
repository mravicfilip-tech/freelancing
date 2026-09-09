import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LEVELS, type Level } from './content';
import { useStageMotion } from './useStageMotion';
import './RoadmapStage.css';

/* Exported from Figma "Remittix Redesign" › 2717:2477. The checks and the marker are the file's
   own assets, in public/figma/. */
const CHECK_DONE = '/figma/check-done.svg';
const CHECK_TODO = '/figma/check-todo.svg';
const MARKER = '/figma/roadmap-marker.svg';

const STAGE_LABEL: Record<Level['status'], string> = {
  done: 'Stage Complete',
  live: 'Stage In Progress...',
  next: 'Stage Ahead',
};

function Card({ level, active }: { level: Level; active: boolean }) {
  return (
    <article className="rs__card" id={`rs-card-${level.n}`} data-active={active || undefined} aria-labelledby={`rs-card-h-${level.n}`}>
      <h3 className="rs__sr" id={`rs-card-h-${level.n}`}>
        Level {Number(level.n)} — {level.name}
      </h3>
      {level.items.map((item) => (
        <div className="rs__item" key={item.short}>
          <img src={item.done ? CHECK_DONE : CHECK_TODO} alt="" width={14} height={14} />
          <p>{item.text}</p>
        </div>
      ))}
    </article>
  );
}

/**
 * Roadmap — Figma 2717:2477. The seven levels stand on the left against dashed leaders, a lit
 * marker rides the centre rail to the level in play, and the level cards run through a clipped
 * stage on the right with the open one centred between its dimmed neighbours.
 */
export function RoadmapStage() {
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(() => Math.max(0, LEVELS.findIndex((l) => l.status === 'live')));
  const [markerY, setMarkerY] = useState<number | null>(null);
  const [shift, setShift] = useState(0);
  const [labelY, setLabelY] = useState<number | null>(null);

  useStageMotion(root);

  /* The marker sits on the active level's centre line, and the stack slides so that level's card
     is centred in the stage — both measured, so the two columns cannot drift apart. */
  useLayoutEffect(() => {
    const measure = () => {
      const row = list.current?.children[active] as HTMLElement | undefined;
      if (row) setMarkerY(row.offsetTop + row.offsetHeight / 2);
      const view = viewport.current;
      const card = stack.current?.children[active] as HTMLElement | undefined;
      if (view && card) {
        // Centre the open card in the clipped stage, and stand the label on its top edge.
        const middle = view.clientHeight / 2;
        setShift(middle - (card.offsetTop + card.offsetHeight / 2));
        setLabelY(middle - card.offsetHeight / 2 - 20);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    if (stack.current) ro.observe(stack.current);
    if (viewport.current) ro.observe(viewport.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [active]);

  // On a phone the level list scrolls; keep the level in play in view without moving the page.
  useEffect(() => {
    const el = list.current;
    const row = el?.children[active] as HTMLElement | undefined;
    if (!el || !row || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: row.offsetLeft - (el.clientWidth - row.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);

  // Fonts land after first paint and change the row heights the marker is measured from.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      const row = list.current?.children[active] as HTMLElement | undefined;
      if (row) setMarkerY(row.offsetTop + row.offsetHeight / 2);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  const level = LEVELS[active];

  return (
    <section ref={root} className="rs" id="roadmap" data-node-id="2717:2477" data-motion="pending" aria-labelledby="rs-title">
      <div className="rs__frame">
        <h2 id="rs-title" className="rs__title" data-node-id="2717:2488">
          <span className="rs__line">
            <span className="rs__lineInner">
              Explore Our <span className="rs__titleInk">Roadmap</span>
            </span>
          </span>
        </h2>

        <div className="rs__stage" data-node-id="2717:2490">
          <ol className="rs__levels" ref={list}>
            {LEVELS.map((l, i) => (
              <li className="rs__level" key={l.n} data-active={i === active || undefined}>
                <button
                  type="button"
                  aria-current={i === active ? 'step' : undefined}
                  aria-controls={`rs-card-${l.n}`}
                  onClick={() => setActive(i)}
                >
                  <i className="rs__leader" aria-hidden="true" />
                  <span className="rs__levelName">Level {Number(l.n)}</span>
                  <span className="rs__sr"> — {l.name}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="rs__rail" aria-hidden="true">
            <span className="rs__railLine" />
            <img
              className="rs__marker"
              src={MARKER}
              alt=""
              width={24}
              height={24}
              style={markerY === null ? { opacity: 0 } : { top: markerY }}
            />
          </div>

          <div className="rs__cards" ref={viewport}>
            <p
              className="rs__stageLabel"
              data-node-id="2718:2736"
              style={labelY === null ? undefined : { top: labelY }}
            >
              {STAGE_LABEL[level.status]}
            </p>
            <div className="rs__stack" ref={stack} style={{ transform: `translateY(${shift}px)` }}>
              {LEVELS.map((l, i) => (
                <Card key={l.n} level={l} active={i === active} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

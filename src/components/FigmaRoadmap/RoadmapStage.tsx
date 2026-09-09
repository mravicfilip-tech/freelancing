import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LEVELS, type Level } from './content';
import { useStageMotion } from './useStageMotion';
import './RoadmapStage.css';

/** How long each level holds before the band moves on. */
const STEP_MS = 3600;

/* Exported from Figma "Remittix Redesign" › 2717:2477. The checks and the marker are the file's
   own assets, in public/figma/. */
const CHECK_DONE = '/figma/check-done.svg';
const CHECK_TODO = '/figma/check-todo.svg';
const MARKER = '/figma/roadmap-marker.svg';

/** The row's centre line in the rail's own coordinates — `offsetTop` would be measured from
 *  `.rs__stage`, whose 48px padding the rail's box already starts past. */
const rowCentreOnRail = (row: HTMLElement, rail: HTMLElement) => {
  const r = row.getBoundingClientRect();
  return r.top + r.height / 2 - rail.getBoundingClientRect().top;
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
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [shift, setShift] = useState(0);
  const [markerY, setMarkerY] = useState<number | null>(null);

  useStageMotion(root);

  /* The band walks its own levels, 1 to 7 and round again, but only while it is on screen and
     only until someone picks a level themselves — after that it is theirs. */
  const [auto, setAuto] = useState(true);
  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };
  useEffect(() => {
    const el = root.current;
    if (!el || !auto) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearInterval(timer);
        if (e.isIntersecting) timer = window.setInterval(() => setActive((i) => (i + 1) % LEVELS.length), STEP_MS);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
    };
  }, [auto]);

  /* The marker sits on the active level's centre line, and the stack slides so that level's card
     is centred in the stage — both measured, so the two columns cannot drift apart. */
  useLayoutEffect(() => {
    const measure = () => {
      // the marker rides to the open level's centre line (2718:2841)
      const row = list.current?.children[active] as HTMLElement | undefined;
      if (row && rail.current) setMarkerY(rowCentreOnRail(row, rail.current));
      const view = viewport.current;
      // The open card, not its wrapper — the live one is grouped with its label.
      const card = stack.current?.querySelectorAll<HTMLElement>('.rs__card')[active];
      if (view && card) {
        // Centre the open card in the clipped stage; its label rides above it in flow.
        setShift(view.clientHeight / 2 - (card.offsetTop + card.offsetHeight / 2));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    if (stack.current) ro.observe(stack.current);
    if (viewport.current) ro.observe(viewport.current);
    if (rail.current) ro.observe(rail.current);
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
          <div className="rs__index">
            <ol className="rs__levels" ref={list}>
            {LEVELS.map((l, i) => (
              <li className="rs__level" key={l.n} data-active={i === active || undefined}>
                <button
                  type="button"
                  aria-current={i === active ? 'step' : undefined}
                  aria-controls={`rs-card-${l.n}`}
                  onClick={() => pick(i)}
                >
                  <i className="rs__leader" aria-hidden="true" />
                  <span className="rs__levelName">Level {Number(l.n)}</span>
                  <span className="rs__sr"> — {l.name}</span>
                </button>
              </li>
              ))}
            </ol>
          </div>

          <div className="rs__rail" ref={rail} aria-hidden="true">
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
            <div className="rs__stack" ref={stack} style={{ transform: `translateY(${shift}px)` }}>
              {/* A level's label rides above its own card; levels without one render the card alone. */}
              {LEVELS.map((l, i) =>
                l.label ? (
                  <div className="rs__group" key={l.n} data-node-id="2718:2830">
                    <p className="rs__stageLabel" data-node-id="2718:2736">
                      {l.label}
                    </p>
                    <Card level={l} active={i === active} />
                  </div>
                ) : (
                  <Card key={l.n} level={l} active={i === active} />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

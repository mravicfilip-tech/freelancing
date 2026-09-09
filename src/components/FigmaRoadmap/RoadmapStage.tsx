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

/** Where a level stands, from its own ticks — all done, some done, none yet. */
const stageOf = (l: Level) => (l.items.every((i) => i.done) ? 'done' : l.items.some((i) => i.done) ? 'live' : 'ahead');

/**
 * The two layouts are different objects, not one reflowed — so the component picks between them.
 * The switch is at 900 rather than the usual 720: below it the stage's two columns leave the cards
 * a 325px lane, where five milestones wrap to three lines each against a column of level names
 * trailing empty leaders. The timeline is the better object well before a phone.
 */
const NARROW = '(max-width: 900px)';
function usePhone() {
  const [phone, setPhone] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}

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
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>([]);
  const phone = usePhone();

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
    if (phone) return;
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
  }, [active, phone]);

  /* Every level keeps its own panel, so opening one and closing another is a move rather than a
     swap — a panel mounted fresh on each step has no height to leave from and can only snap. Each
     is given its measured height instead of `auto`, which is what a height can be tweened from;
     the levels vary by over 160px, and that is a jolt every time the band moves on by itself. */
  useLayoutEffect(() => {
    if (!phone) return;
    const measure = () => {
      const next = panels.current.map((el) => {
        if (!el) return 0;
        const held = el.style.height;
        el.style.height = 'auto';
        const h = el.offsetHeight;
        el.style.height = held;
        return h;
      });
      setHeights((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (const el of panels.current) if (el?.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [phone]);

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

        {phone ? (
          /* A phone gets a timeline, not two columns: a spine down the left with a node per
             level, and the level in play opening its own card directly under its row — so the
             level and what it holds are one object rather than a list and a card far below it. */
          <div className="rs__stage rs__stage--tl" data-node-id="2717:2490">
            <ol className="rs__tl">
              {LEVELS.map((l, i) => (
                <li className="rs__tlItem" key={l.n} data-state={stageOf(l)} data-active={i === active || undefined}>
                  <button type="button" aria-expanded={i === active} aria-controls={`rs-card-${l.n}`} onClick={() => pick(i)}>
                    <span className="rs__tlName">Level {Number(l.n)}</span>
                    <span className="rs__sr"> — {l.name}</span>
                    <span className="rs__tlLabel">{l.label}</span>
                  </button>
                  <div
                    className="rs__tlPanel"
                    ref={(el) => {
                      panels.current[i] = el;
                    }}
                    inert={i !== active || undefined}
                    style={{ height: i === active ? heights[i] : 0 }}
                  >
                    <Card level={l} active={i === active} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
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
                style={markerY === null ? { opacity: 0 } : { transform: `translateY(${markerY}px)` }}
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
        )}
      </div>
    </section>
  );
}

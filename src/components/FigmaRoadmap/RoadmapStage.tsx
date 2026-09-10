import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LEVELS, type Level } from './content';
import { useStageMotion } from './useStageMotion';
import './RoadmapStage.css';

/** How long each level holds before the band moves on. Seven levels, so this is the whole band's
 *  pace: at 3600 a full pass took 25 seconds and read as waiting rather than moving. */
const STEP_MS = 2600;

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

/* Memoised: a step changes `active` on two cards, and React should not reconcile the other five —
   35 milestone rows rebuilt inside a 620ms transition is the block that made it stutter. */
const Card = memo(function Card({ level, active }: { level: Level; active: boolean }) {
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
});

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
  const marker = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState(0);
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
     is centred in the stage — both measured, so the two columns cannot drift apart.

     The measuring happens once, not once per step. Every card is now the same shape, so the
     column's geometry does not change when the band moves; reading it on each step only forced a
     full layout of a 3400px stack inside the very transition it was driving. It is re-read when
     something can actually have changed it — a resize, a font landing, the list reflowing.

     The two results are written straight to their nodes rather than held in state: as state they
     cost a second render and a second forced layout per step, and nothing else reads them. */
  const geometry = useRef<{ rows: number[]; cards: number[] }>({ rows: [], cards: [] });
  /* The measure effect outlives any one step, so it must not read `active` from the render it was
     created in — a resize firing after the band has moved would otherwise re-apply level one's
     target and yank the stack back mid-slide. */
  const activeRef = useRef(active);
  activeRef.current = active;

  /** Put the marker on a level's centre line and slide that level's card to the stage's middle. */
  const place = (i: number) => {
    const { rows, cards } = geometry.current;
    if (rows[i] !== undefined && marker.current) {
      marker.current.style.transform = `translateY(${rows[i]}px)`;
      marker.current.style.opacity = '1';
    }
    if (cards[i] !== undefined && stack.current) stack.current.style.transform = `translateY(${cards[i]}px)`;
  };

  useLayoutEffect(() => {
    if (phone) return;
    const measure = () => {
      const listEl = list.current;
      const railEl = rail.current;
      const view = viewport.current;
      const cardEls = stack.current?.querySelectorAll<HTMLElement>('.rs__card');
      if (!listEl || !railEl || !view || !cardEls) return;
      geometry.current = {
        // the marker rides to each level's centre line (2718:2841)
        rows: [...listEl.children].map((row) => rowCentreOnRail(row as HTMLElement, railEl)),
        // and the stack slides so that level's card is centred in the clipped stage
        cards: [...cardEls].map((card) => view.clientHeight / 2 - (card.offsetTop + card.offsetHeight / 2)),
      };
      place(activeRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (const el of [list.current, stack.current, viewport.current, rail.current]) if (el) ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [phone]);

  /* A step only reads what was already measured — no layout, no second render. */
  useLayoutEffect(() => {
    if (!phone) place(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, phone]);

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
          /* A phone gets the levels running across, not down: seven of them stacked vertically is a
             list you scroll past rather than a road you travel, and the card that belongs to the
             one in play ends up far below the row that named it. Across, the whole run is one
             object you can see the shape of — where it has been, where it is, how much is left —
             and what the level holds sits directly under it. */
          <div className="rs__stage rs__stage--h" data-node-id="2717:2490">
            <ol className="rs__hRail" role="tablist" aria-label="Roadmap levels">
              {LEVELS.map((l, i) => (
                <li className="rs__hItem" key={l.n} data-state={stageOf(l)} data-active={i === active || undefined}>
                  <button
                    type="button"
                    role="tab"
                    id={`rs-tab-${l.n}`}
                    aria-selected={i === active}
                    aria-controls={`rs-card-${l.n}`}
                    tabIndex={i === active ? 0 : -1}
                    onClick={() => pick(i)}
                  >
                    <i className="rs__hDot">{Number(l.n)}</i>
                    <span className="rs__sr">Level {Number(l.n)} — {l.name}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="rs__hNow">
              <b>Level {Number(LEVELS[active].n)}</b>
              <span>{LEVELS[active].label}</span>
            </p>
            <div className="rs__hPanel" role="tabpanel" aria-labelledby={`rs-tab-${LEVELS[active].n}`}>
              <Card level={LEVELS[active]} active />
            </div>
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
              {/* held invisible until the first measurement places it, so it never flashes at 0 */}
              <img className="rs__marker" ref={marker} src={MARKER} alt="" width={24} height={24} style={{ opacity: 0 }} />
            </div>

            <div className="rs__cards" ref={viewport}>
              <div className="rs__stack" ref={stack}>
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

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../theme';
import './EarnSlide.css';

/**
 * The hero's fourth slide: RTX Earn is looking for testers.
 *
 * Two depths. At the back, the product: the Earn app's Pools dashboard in a window, captured from
 * the app (mravicfilip-tech/remittix-earn, at 960 × 640 and 2x in each theme, kept in
 * public/figma/earn). In front of it, three cards built in HTML so they stay sharp and can move —
 * the yield the wallet has accrued, the seats on the beta and the test run — each laid over an edge
 * of the window so the stack reads as one object with depth rather than a grid of equals.
 *
 * The story runs across the front two: each beat a tester takes a seat and one flow in the test
 * run passes. Four seats fill; the fifth stays open and keeps asking — that one is the reader's.
 *
 * The markup is the finished state (yield accrued, every seat taken but the last, every test
 * passed), so a reader with reduced motion gets the whole picture at rest. The animation sets its
 * own start state and puts the markup back when the slide is left.
 */

const YIELD = 413.14;
const TESTS = ['Deposit', 'Track yield', 'Claim payout', 'Withdraw'] as const;
const TESTERS = ['AK', 'MJ', 'LS', 'DR'] as const;

const usd = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = (n: number) => String(n).padStart(2, '0');
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Thirty days of accrued yield: it only ever climbs, by more on some days than others and faster as
 * the deposits grow. Drawn once into a 300 × 100 box as a smooth curve through the points
 * (Catmull-Rom, as cubic Béziers), stopping short of the right edge so the day's point has room.
 */
const DAILY = [1.2, 0.4, 0.9, 2.1, 0.6, 0.3, 1.5, 1, 0.5, 2.4, 0.8, 0.4, 1.1, 1.9, 0.7, 0.6, 1.4, 2.2, 0.9, 0.5, 1.6, 1.2, 0.8, 2.6, 1.1, 0.9, 1.8, 1.4, 2, 2.8];
const CHART = (() => {
  const W = 284;
  let v = 0;
  const totals = DAILY.map((d) => (v += d));
  const xy = totals.map((t, i) => [(i / (totals.length - 1)) * W, 94 - (t / v) * 80] as [number, number]);
  let d = `M${xy[0][0]} ${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[Math.max(0, i - 1)], p1 = xy[i], p2 = xy[i + 1], p3 = xy[Math.min(xy.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  const end = xy[xy.length - 1];
  // The fill carries on past the day's point to the card's edge, level, so it never ends in a wall.
  return { line: d, area: `${d} L300 ${end[1]} L300 100 L0 100 Z`, tip: { x: (end[0] / 300) * 100, y: end[1] } };
})();

export function EarnSlide({ active }: { active: boolean }) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  /* The capture is the heaviest thing on the slide, and nobody sees it until the fourth slide, so it
     is not requested with the page: it mounts the first time the slide is shown, or once the page
     has settled, whichever comes first. */
  const [load, setLoad] = useState(false);
  useEffect(() => {
    if (active) setLoad(true);
  }, [active]);
  useEffect(() => {
    const id = window.setTimeout(() => setLoad(true), 5000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!active || !load || !root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const q = <T extends Element>(s: string) => root.querySelector<T>(s);
    const qa = <T extends Element>(s: string) => Array.from(root.querySelectorAll<T>(s));
    const yieldEl = q<HTMLElement>('.eb__yield');
    const countEl = q<HTMLElement>('.eb__count');
    const tests = qa<HTMLElement>('.eb__test');
    const shot = q<HTMLImageElement>('.el__shot');

    let cancelled = false;
    let revert: (() => void) | null = null;

    // GSAP is only loaded when the slide is first shown, so it never delays the hero's first paint.
    // The window waits for its picture, so it never arrives empty.
    Promise.all([import('gsap'), shot?.decode().catch(() => undefined)]).then(([{ gsap }]) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const win = q<HTMLElement>('.el__window')!;
        const screen = q<HTMLElement>('.el__screen')!;
        const cards = qa<HTMLElement>('.eb__tile');
        const plot = q<SVGSVGElement>('.eb__chart svg')!;
        const area = q<SVGPathElement>('.eb__area')!;
        const tip = q<HTMLElement>('.eb__tip')!;
        const avatars = qa<HTMLElement>('.eb__avatar');
        const progress = q<HTMLElement>('.eb__progress i')!;
        const setTest = (i: number, state: 'idle' | 'running' | 'passed') => tests[i]?.setAttribute('data-state', state);

        // The start of the story: nothing accrued, nobody seated, nothing tested.
        gsap.set(avatars, { scale: 0, opacity: 0 });
        gsap.set(progress, { scaleX: 0 });
        tests.forEach((_, i) => setTest(i, 'idle'));
        if (countEl) countEl.textContent = pad(0);
        if (yieldEl) yieldEl.textContent = usd(0);

        // ---- Entry: the dashboard rises and paints, then the cards land on it from their own sides ----
        const entry = gsap.timeline({ onComplete: () => void loops() });
        entry.from(win, { y: 24, scale: 0.97, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0);
        entry.fromTo(screen, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'power2.inOut', clearProps: 'clipPath' }, 0.25);
        cards.forEach((card, i) => {
          const from = card.dataset.from === 'left' ? { x: -28 } : card.dataset.from === 'right' ? { x: 28 } : { y: 28 };
          entry.from(card, { ...from, scale: 0.94, opacity: 0, duration: 0.75, ease: 'power3.out' }, 0.55 + i * 0.12);
        });
        /* The line is drawn at a fixed width whatever the chart's shape (non-scaling stroke), which
           puts its dashes in screen units — so it is uncovered left to right rather than dashed in. */
        entry.fromTo(plot, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power2.inOut', clearProps: 'clipPath' }, 0.8);
        entry.from(area, { opacity: 0, duration: 0.9, ease: 'power1.out' }, 1.2);
        entry.from(tip, { scale: 0, opacity: 0, duration: 0.4, ease: 'back.out(2.4)' }, 1.9);
        entry.add(() => {
          const o = { v: 0 };
          gsap.to(o, { v: YIELD, duration: 1.5, ease: 'power2.out', onUpdate: () => void (yieldEl && (yieldEl.textContent = usd(o.v))) });
        }, 0.8);

        const loops = () => {
          // The front layer floats a little off the page, each card on its own breath.
          cards.forEach((card) => {
            gsap.to(card, { y: rand(-7, -4), duration: rand(2.6, 3.6), delay: rand(0, 0.8), yoyo: true, repeat: -1, ease: 'sine.inOut' });
          });

          // Yield accrues while the slide is up: the figure creeps on its own clock, cent by cent.
          let earned = YIELD;
          const accrue = () => {
            earned += rand(0.01, 0.04);
            if (yieldEl) yieldEl.textContent = usd(earned);
            gsap.fromTo(tip, { '--ring': 0 }, { '--ring': 1, duration: 1, ease: 'power1.out' });
            gsap.delayedCall(rand(1, 1.5), accrue);
          };
          accrue();

          // One beat per tester: they take a seat, and the flow they were given runs and passes.
          const STEP = 1.5;
          const round = () => {
            const tl = gsap.timeline({ onComplete: round });
            TESTS.forEach((_, i) => {
              const at = i * STEP;
              tl.to(avatars[i], { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' }, at);
              tl.add(() => setTest(i, 'running'), at + 0.25);
              tl.add(() => {
                setTest(i, 'passed');
                if (countEl) countEl.textContent = pad(i + 1);
              }, at + 1.05);
              tl.to(progress, { scaleX: (i + 1) / TESTS.length, duration: 0.5, ease: 'power2.out' }, at + 1.05);
            });
            // Hold on the full house, then clear the board for the next round of testers.
            const end = TESTS.length * STEP + 1.6;
            tl.to([...avatars].reverse(), { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in', stagger: 0.05 }, end);
            tl.to(progress, { scaleX: 0, duration: 0.5, ease: 'power2.inOut' }, end);
            tl.add(() => {
              tests.forEach((_, i) => setTest(i, 'idle'));
              if (countEl) countEl.textContent = pad(0);
            }, end + 0.2);
            tl.to({}, { duration: 0.5 }, end + 0.4);
          };
          round();
        };
      }, root);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
      // The loops wrote text and states outside GSAP's control; put the design back.
      if (yieldEl) yieldEl.textContent = usd(YIELD);
      if (countEl) countEl.textContent = pad(TESTS.length);
      tests.forEach((t) => t.setAttribute('data-state', 'passed'));
    };
  }, [active, load]);

  return (
    <div ref={ref} className="earnSlide" aria-hidden="true">
      <div className="el">
        {/* ---- Back: the dashboard ---- */}
        <div className="el__window">
          <div className="el__bar">
            <span className="el__dots">
              <i />
              <i />
              <i />
            </span>
            <span className="el__address">
              RTX Earn <b>Beta</b>
            </span>
          </div>
          <div className="el__screen">
            {load && (
              <img className="el__shot" src={`/figma/earn/pools-${theme}@2x.webp`} alt="" width={960} height={640} decoding="async" />
            )}
          </div>
        </div>

        {/* ---- Front: the yield, on the one dark card ---- */}
        <div className="eb__tile eb__tile--yield" data-from="left">
          <div className="eb__head">
            <p className="eb__label">Total accrued yield</p>
            <span className="eb__live">
              <i />
              Live
            </span>
          </div>
          <p className="eb__big eb__big--yield">
            +$<span className="eb__yield">{usd(YIELD)}</span>
          </p>
          <p className="eb__sub">Across 5 open positions</p>
          <div className="eb__chart">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="eb-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--eb-indigo)" stopOpacity="0.22" />
                  <stop offset="1" stopColor="var(--eb-indigo)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 55, 80].map((y) => (
                <line key={y} className="eb__rule" x1="0" x2="300" y1={y} y2={y} />
              ))}
              <path className="eb__area" d={CHART.area} fill="url(#eb-area)" />
              <path className="eb__line" d={CHART.line} />
            </svg>
            <span className="eb__tip" style={{ left: `${CHART.tip.x}%`, top: `${CHART.tip.y}%` }} />
          </div>
        </div>

        {/* ---- Front: the seats on the beta ---- */}
        <div className="eb__tile eb__tile--seats" data-from="right">
          <p className="eb__label">Beta testers</p>
          <p className="eb__seatsLead">Your seat is open.</p>
          <span className="eb__seats">
            {TESTERS.map((initials, i) => (
              <span key={initials} className="eb__seat">
                <span className="eb__avatar" data-tone={i}>
                  {initials}
                </span>
              </span>
            ))}
            <span className="eb__seat eb__seat--open">You</span>
          </span>
        </div>

        {/* ---- Front: the test run ---- */}
        <div className="eb__tile eb__tile--tests" data-from="below">
          <div className="eb__head">
            <p className="eb__label">Test run</p>
            <span className="eb__counter">
              <span className="eb__count">{pad(TESTS.length)}</span>/{pad(TESTS.length)}
            </span>
          </div>
          <ul className="eb__tests">
            {TESTS.map((name) => (
              <li key={name} className="eb__test" data-state="passed">
                <span className="eb__box">
                  <svg viewBox="0 0 14 14">
                    <path d="M14 3.57088L5.8688 11.7021C5.52708 12.0438 4.97306 12.0438 4.63135 11.7021L0 7.07075L1.23744 5.83332L5.25006 9.84596L12.7626 2.33345L14 3.57088Z" />
                  </svg>
                </span>
                {name}
              </li>
            ))}
          </ul>
          <span className="eb__progress">
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}

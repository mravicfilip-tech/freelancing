import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../theme';
import './EarnSlide.css';

/**
 * The hero's fourth slide: RTX Earn is looking for testers.
 *
 * One scene, played as a test session on the real product. At the back is the Remittix presale
 * dashboard in a window, captured from production (rtxdash.vercel.app at 1200 × 860, 1.25x, in each
 * theme) together with three of its own states — an amount picked, card payment chosen, the promo
 * code copied — so when the session touches the dashboard, the dashboard answers with its own UI
 * rather than with something drawn to look like it. In front, at two heights, the session's
 * instruments: the yield card, nearest and largest, and the test log.
 *
 * Every movement has a cause. The pointer picks $500, switches to card, copies the promo code, and
 * the log passes each step as the dashboard changes under it. Then it leaves the window for the
 * yield card and reads the chart day by day, and the last step passes. With the run green a tester
 * joins the beta; the board clears and the next run starts. Nothing bobs, pulses or loops on a
 * clock of its own except the yield, which accrues.
 *
 * The markup is the finished run, so a reader with reduced motion gets the whole picture at rest;
 * the animation sets its own start state and puts the markup back when the slide is left.
 */

const YIELD = 413.14;
const STEPS = [
  { name: 'Pick $500', took: '0.4s' },
  { name: 'Pay by card', took: '0.7s' },
  { name: 'Copy promo', took: '0.3s' },
  { name: 'Track yield', took: '0.9s' },
] as const;
const TESTERS = ['AK', 'MJ', 'LS'] as const;

const money = (n: number) => n.toFixed(2);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Thirty days of accrued yield: it only climbs, by more on some days than others. */
const DAILY = [1.2, 0.4, 0.9, 2.1, 0.6, 0.3, 1.5, 1, 0.5, 2.4, 0.8, 0.4, 1.1, 1.9, 0.7, 0.6, 1.4, 2.2, 0.9, 0.5, 1.6, 1.2, 0.8, 2.6, 1.1, 0.9, 1.8, 1.4, 2, 2.8];
const SERIES = (() => {
  let v = 0;
  const totals = DAILY.map((d) => (v += d));
  /* Drawn into a 300 × 100 box, short of the right edge so the last day's point has room. */
  return totals.map((t, i) => ({ x: (i / (totals.length - 1)) * 284, y: 90 - (t / v) * 74, value: (YIELD * t) / v }));
})();
const CHART = (() => {
  const xy = SERIES.map((p) => [p.x, p.y]);
  let d = `M${xy[0][0]} ${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[Math.max(0, i - 1)], p1 = xy[i], p2 = xy[i + 1], p3 = xy[Math.min(xy.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  const end = xy[xy.length - 1];
  // The fill carries on past the day's point to the card's edge, level, so it never ends in a wall.
  return { line: d, area: `${d} L300 ${end[1]} L300 100 L0 100 Z` };
})();
const dayLabel = (i: number) => {
  const d = new Date();
  d.setDate(d.getDate() - (SERIES.length - 1 - i));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** A figure whose digits turn like an odometer's: each one is a strip of 0–9 shown through a slot. */
function Odometer({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`el__odo${className ? ` ${className}` : ''}`}>
      {value.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="el__odoSlot">
            <span className="el__odoStrip" style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>
              {'0123456789'.split('').map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} className="el__odoSep">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

export function EarnSlide({ active }: { active: boolean }) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  /* The captures are the heaviest thing on the slide and nobody sees them before the fourth slide,
     so they are not requested with the page: they mount the first time the slide is shown, or once
     the page has settled, whichever comes first. */
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

    const q = <T extends Element>(s: string) => root.querySelector<T>(s)!;
    const qa = <T extends Element>(s: string) => Array.from(root.querySelectorAll<T>(s));
    const steps = qa<HTMLElement>('.el__step');
    const status = q<HTMLElement>('.el__status');
    const statusText = q<HTMLElement>('.el__statusText');
    const tipDate = q<HTMLElement>('.el__tipDate');
    const tipValue = q<HTMLElement>('.el__tipValue');
    const shots = qa<HTMLImageElement>('.el__shot');

    let cancelled = false;
    let revert: (() => void) | null = null;

    // GSAP is only loaded when the slide is first shown, so it never delays the hero's first paint.
    // The window waits for its pictures, so it never arrives empty or swaps in a state half-loaded.
    Promise.all([import('gsap'), ...shots.map((s) => s.decode().catch(() => undefined))]).then(([{ gsap }]) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const stage = q<HTMLElement>('.el');
        const win = q<HTMLElement>('.el__window');
        const yieldCard = q<HTMLElement>('.el__yield');
        const log = q<HTMLElement>('.el__log');
        const pill = q<HTMLElement>('.el__testers');
        const amount = q<HTMLElement>('.el__patch--amount');
        const card = q<HTMLElement>('.el__patch--card');
        const copied = q<HTMLElement>('.el__patch--copied');
        const cursor = q<HTMLElement>('.el__cursor');
        const chart = q<HTMLElement>('.el__chart');
        const plot = q<SVGSVGElement>('.el__chart svg');
        const area = q<SVGPathElement>('.el__area');
        const guide = q<HTMLElement>('.el__guide');
        const joiner = q<HTMLElement>('.el__seat--join');
        const bar = q<HTMLElement>('.el__progress i');
        const yieldOdo = q<HTMLElement>('.el__yieldValue');
        /* The new tester's plate opens its own room in the row, so it is sized off a seated one. */
        const seated = qa<HTMLElement>('.el__seat');
        const seatWidth = () => parseFloat(getComputedStyle(seated[0]).width);
        const seatOverlap = () => parseFloat(getComputedStyle(seated[1]).marginLeft);

        /* ---- The odometer: each digit turns to its new value, the right-hand ones last ----
           `y: 0` alongside the percentage clears the offset the markup starts each strip at, which
           GSAP reads in as pixels and would otherwise add to the turn. */
        const turn = (odo: HTMLElement, value: string, duration = 0.6) => {
          const strips = Array.from(odo.querySelectorAll<HTMLElement>('.el__odoStrip'));
          const digits = value.replace(/\D/g, '').split('');
          strips.forEach((strip, i) => {
            gsap.to(strip, { y: 0, yPercent: -Number(digits[i]) * 10, duration, ease: 'power3.out', delay: i * 0.03 });
          });
        };

        /* ---- Where things are, in the stage's own pixels (the stage is scaled on wide screens) ---- */
        const at = (el: Element, fx = 0.5, fy = 0.5) => {
          const s = stage.getBoundingClientRect();
          const k = s.width / stage.offsetWidth;
          const r = el.getBoundingClientRect();
          return { x: (r.left + r.width * fx - s.left) / k, y: (r.top + r.height * fy - s.top) / k };
        };
        const onChart = (i: number) => {
          const p = SERIES[i];
          return at(chart, p.x / 300, p.y / 100);
        };
        /* The pointer travels as a hand does: across and down on different curves, so the path bends. */
        const travel = (tl: gsap.core.Timeline, to: { x: number; y: number }, t: number, duration: number) => {
          tl.to(cursor, { x: to.x, duration, ease: 'power2.inOut' }, t);
          tl.to(cursor, { y: to.y, duration, ease: 'power3.inOut' }, t);
        };
        const press = (tl: gsap.core.Timeline, t: number) => {
          tl.to(cursor, { scale: 0.86, duration: 0.08, ease: 'power2.in' }, t);
          tl.to(cursor, { scale: 1, duration: 0.22, ease: 'back.out(3)' }, t + 0.08);
        };
        /* A state of the dashboard comes in the way the app's own does: at once, with the briefest fade. */
        const show = (tl: gsap.core.Timeline, el: HTMLElement, t: number) => tl.to(el, { autoAlpha: 1, duration: 0.12, ease: 'power1.out' }, t);
        const setStep = (i: number, state: 'pending' | 'running' | 'passed') => steps[i]?.setAttribute('data-state', state);
        const setStatus = (state: 'running' | 'passed') => {
          status.setAttribute('data-state', state);
          statusText.textContent = state === 'running' ? 'Running' : 'Passed';
        };
        const pass = (tl: gsap.core.Timeline, i: number, t: number) => {
          tl.add(() => setStep(i, 'passed'), t);
          tl.to(bar, { scaleX: (i + 1) / STEPS.length, duration: 0.5, ease: 'power3.out' }, t);
          if (i + 1 < STEPS.length) tl.add(() => setStep(i + 1, 'running'), t + 0.2);
        };
        const park = () => ({ x: stage.offsetWidth * 0.9, y: stage.offsetHeight * 0.97 });

        // The start of the story: nothing tested, the next tester not yet seated, the pointer off stage.
        steps.forEach((_, i) => setStep(i, 'pending'));
        setStatus('running');
        gsap.set(bar, { scaleX: 0 });
        gsap.set(joiner, { width: 0, scale: 0.6, opacity: 0, marginLeft: 0 });
        gsap.set([amount, card, copied, guide], { autoAlpha: 0 });
        gsap.set(cursor, { autoAlpha: 0, ...park() });
        yieldOdo.querySelectorAll<HTMLElement>('.el__odoStrip').forEach((s) => gsap.set(s, { y: 0, yPercent: 0 }));

        // ---- Entry: the window settles, then the instruments land on it, nearest last ----
        const entry = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => void session() });
        entry.from(win, { y: 14, opacity: 0, duration: 0.9 }, 0);
        entry.from(log, { x: 18, opacity: 0, duration: 0.9 }, 0.22);
        entry.from(pill, { y: 12, opacity: 0, duration: 0.9 }, 0.3);
        entry.from(yieldCard, { y: 22, scale: 0.97, opacity: 0, duration: 1 }, 0.36);
        /* The chart is uncovered left to right rather than dashed in: its stroke does not scale with
           the box, which puts dashes in screen units. */
        entry.fromTo(plot, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power2.inOut', clearProps: 'clipPath' }, 0.6);
        entry.from(area, { opacity: 0, duration: 0.8, ease: 'power1.out' }, 1);
        entry.add(() => turn(yieldOdo, money(YIELD), 1.2), 0.62);

        // The yield accrues the whole time the slide is up — a cent or so at a time, on its own clock.
        let earned = YIELD;
        const accrue = () => {
          earned += rand(0.01, 0.03);
          turn(yieldOdo, money(earned), 0.5);
          gsap.delayedCall(rand(1.6, 2.4), accrue);
        };
        gsap.delayedCall(2.4, accrue);

        // ---- The session ----
        const session = () => {
          const tl = gsap.timeline({ onComplete: session });
          const scrubFrom = 4;
          const scrubTo = SERIES.length - 1;

          tl.set(cursor, park(), 0);
          tl.to(cursor, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, 0.05);
          tl.add(() => setStep(0, 'running'), 0);

          // 1. Choose an amount: $500, and the field fills.
          travel(tl, at(q('.el__hit--amount')), 0, 1.0);
          press(tl, 1.05);
          show(tl, amount, 1.12);
          pass(tl, 0, 1.3);

          // 2. Pay by card: the tab moves and the field's currency turns to USD.
          travel(tl, at(q('.el__hit--card')), 1.55, 0.7);
          press(tl, 2.3);
          show(tl, card, 2.37);
          tl.set(amount, { autoAlpha: 0 }, 2.5);
          pass(tl, 1, 2.55);

          // 3. Copy promo code, across in the flash sale.
          travel(tl, at(q('.el__hit--copy')), 2.8, 0.85);
          press(tl, 3.7);
          show(tl, copied, 3.77);
          pass(tl, 2, 3.95);

          // 4. Track yield: off the dashboard and onto the yield card, reading the chart day by day.
          travel(tl, onChart(scrubFrom), 4.15, 1.0);
          const scrub = { i: scrubFrom };
          const read = () => {
            const i = Math.round(scrub.i);
            const p = SERIES[i];
            const share = p.x / 300;
            gsap.set(guide, { left: `${share * 100}%`, '--y': `${p.y}%`, '--ax': share > 0.62 ? '-86%' : share < 0.25 ? '-14%' : '-50%' });
            // High on the chart the reading would sit on the figures above it, so it drops below the line.
            guide.toggleAttribute('data-below', p.y < 48);
            tipDate.textContent = dayLabel(i);
            tipValue.textContent = `$${money(p.value)}`;
          };
          tl.add(read, 5.05);
          tl.to(guide, { autoAlpha: 1, duration: 0.18 }, 5.1);
          tl.to(scrub, {
            i: scrubTo,
            duration: 1.7,
            ease: 'power1.inOut',
            onUpdate: () => {
              read();
              const p = onChart(Math.round(scrub.i));
              gsap.set(cursor, { x: p.x, y: p.y });
            },
          }, 5.25);
          pass(tl, 3, 7.0);

          // The run is green and the tester takes their seat.
          tl.add(() => setStatus('passed'), 7.25);
          tl.to(joiner, { width: seatWidth(), marginLeft: seatOverlap(), duration: 0.45, ease: 'power3.out' }, 7.4);
          tl.to(joiner, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 7.5);
          tl.to(guide, { autoAlpha: 0, duration: 0.25 }, 7.55);
          tl.to(cursor, { x: '+=36', y: '+=32', autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 7.65);

          // Hold on the green board, then clear it — the dashboard included — for the next tester.
          tl.add(() => {
            steps.forEach((_, i) => setStep(i, 'pending'));
            setStatus('running');
          }, 10.2);
          tl.to([card, copied], { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 10.2);
          tl.to(bar, { scaleX: 0, duration: 0.4, ease: 'power2.inOut' }, 10.2);
          tl.to(joiner, { scale: 0.6, opacity: 0, duration: 0.25, ease: 'power2.in' }, 10.2);
          tl.to(joiner, { width: 0, marginLeft: 0, duration: 0.35, ease: 'power2.inOut' }, 10.4);
          tl.to({}, { duration: 0.6 }, 10.8);
        };
      }, root);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
      // The session wrote text and states outside GSAP's control; put the finished run back.
      steps.forEach((s) => s.setAttribute('data-state', 'passed'));
      status.setAttribute('data-state', 'passed');
      statusText.textContent = 'Passed';
    };
  }, [active, load]);

  const last = SERIES[SERIES.length - 1];

  return (
    <div ref={ref} className="earnSlide" aria-hidden="true">
      <div className="el">
        {/* ---- Far: the dashboard ---- */}
        <div className="el__window">
          <div className="el__bar">
            <span className="el__dots">
              <i />
              <i />
              <i />
            </span>
            <span className="el__address">Remittix Dashboard</span>
          </div>
          <div className="el__screen">
            {load && (
              <>
                <img className="el__shot" src={`/figma/earn/dash-base-${theme}.webp`} alt="" width={1200} height={860} decoding="async" />
                <img className="el__shot el__patch el__patch--amount" src={`/figma/earn/dash-amount-${theme}.webp`} alt="" decoding="async" />
                <img className="el__shot el__patch el__patch--card" src={`/figma/earn/dash-card-${theme}.webp`} alt="" decoding="async" />
                <img className="el__shot el__patch el__patch--copied" src={`/figma/earn/dash-copied-${theme}.webp`} alt="" decoding="async" />
              </>
            )}
            {/* Where the session's pointer goes, on the capture's own controls. */}
            <span className="el__hit el__hit--amount" />
            <span className="el__hit el__hit--card" />
            <span className="el__hit el__hit--copy" />
          </div>
        </div>

        {/* ---- Middle: the test log ---- */}
        <div className="el__log">
          <div className="el__logHead">
            <b>Beta test run</b>
            <span className="el__status" data-state="passed">
              <i />
              <span className="el__statusText">Passed</span>
            </span>
          </div>
          <ol className="el__steps">
            {STEPS.map((step) => (
              <li key={step.name} className="el__step" data-state="passed">
                <span className="el__mark" />
                <span className="el__stepName">{step.name}</span>
                <span className="el__took">{step.took}</span>
              </li>
            ))}
          </ol>
          <span className="el__progress">
            <i />
          </span>
        </div>

        <div className="el__testers">
          <span className="el__seats">
            {TESTERS.map((initials, i) => (
              <span key={initials} className="el__seat" data-tone={i}>
                {initials}
              </span>
            ))}
            <span className="el__seat el__seat--join" data-tone={3}>
              DR
            </span>
            <span className="el__seat el__seat--open">+</span>
          </span>
          <span className="el__testersText">
            <b>Beta testers</b>
            Join the next run
          </span>
        </div>

        {/* ---- Near: the yield ---- */}
        <div className="el__yield">
          <div className="el__yieldHead">
            <span>Accrued yield</span>
            <span className="el__live">
              <i />
              Live
            </span>
          </div>
          <p className="el__yieldFigure">
            <span>+$</span>
            <Odometer value={money(YIELD)} className="el__yieldValue" />
          </p>
          <p className="el__yieldSub">Across 5 open positions</p>
          <div className="el__chart">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="el-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--el-accent)" stopOpacity="0.16" />
                  <stop offset="1" stopColor="var(--el-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[28, 52, 76].map((y) => (
                <line key={y} className="el__rule" x1="0" x2="300" y1={y} y2={y} />
              ))}
              <path className="el__area" d={CHART.area} fill="url(#el-area)" />
              <path className="el__line" d={CHART.line} />
            </svg>
            <span className="el__end" style={{ left: `${(last.x / 300) * 100}%`, top: `${last.y}%` }} />
            <span className="el__guide">
              <span className="el__guideDot" />
              <span className="el__tip">
                <span className="el__tipDate">{dayLabel(SERIES.length - 1)}</span>
                <span className="el__tipValue">${money(last.value)}</span>
              </span>
            </span>
          </div>
        </div>

        <svg className="el__cursor" viewBox="0 0 16 20" aria-hidden="true">
          <path d="M1.5 1.5v14.2l3.7-3.5 2.6 6.1 2.6-1.1-2.6-6h5.3z" />
        </svg>
      </div>
    </div>
  );
}

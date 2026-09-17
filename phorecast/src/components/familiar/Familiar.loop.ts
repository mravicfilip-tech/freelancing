/**
 * "Familiar Trading. Better Infrastructure." — the ambient loop.
 *
 * The section's load-in belongs to `Familiar.motion.ts`. This file owns what
 * happens *after* it has landed, and it owns nothing else: it reads the markup
 * the component already ships, writes text and colour into it, and puts every
 * value back on teardown.
 *
 * THE STORY, one beat per region, 13s apart
 * -----------------------------------------
 * A tick arrives and the book moves. That is the whole thing:
 *
 *   0.00s  NVDA prints. $218.36 -> $218.29 and the day follows -2.37% -> -2.40%,
 *          the figure flashing red on a down print, green on the way back.
 *   0.55s  The same refresh reaches the ECB card, whose policy rate is honestly
 *          unmoved, so only its chip lifts.
 *   1.30s  The French election re-sorts. Cazeneuve counts 55% -> 56% -> 57%,
 *          crosses Hollande — the two rows physically exchange places, a full
 *          row pitch each — and the Yes chip on the row that moved brightens.
 *   3.00s  The BTC ring follows the same print, 63% -> 65%.
 *   3.60s  A category is tapped in the filter row; it holds, then lets go.
 *   5.80s  Everything is at rest, and stays there for 7.2s.
 *
 * The next cycle plays the same story backwards — Cazeneuve gives second place
 * back, NVDA prints up to where it started — so after two cycles every figure
 * on the screen is exactly the one in the Figma frame again. Nothing drifts.
 *
 * The one thing that never rests is the 5-minute BTC round's clock, which ticks
 * a second at a time for as long as the section is on screen and restarts at
 * 5:00 when it runs out. A countdown that freezes is a screenshot; this is the
 * cheapest honest signal that the screen is live, and it is one digit.
 *
 * Nothing here floats, breathes, drifts, overshoots, rotates, or reacts to the
 * pointer. Reduced motion runs none of it.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../lib/motion';

/** One full cycle: ~5.8s of story, the rest of it still. */
const PERIOD = 13;
/** How long after the entrance lands before the first beat. */
const SETTLE = 1.2;

/* The app's own semantic colours, lifted from Familiar.css so a flash reads as
   the same interface speaking rather than a foreign hue laid over it. */
const UP = '#00c950';
const DOWN = '#e7000b';
const CHIP_YES_LIT = '#17482e';
const CHIP_NO_LIT = '#4a1f23';
const ECB_FOOT_LIT = '#242422';
const PILL_ON_BG = '#e5331e';
const PILL_ON_FG = '#fffbf8';

/** The last non-empty text node inside `el` — the NVDA footer's `-2.37%` sits
 *  beside an `<img>` with no element of its own to hold it. */
function lastText(el: HTMLElement | null): Text | null {
  if (!el) return null;
  for (let i = el.childNodes.length - 1; i >= 0; i -= 1) {
    const n = el.childNodes[i];
    if (n.nodeType === Node.TEXT_NODE && (n.nodeValue ?? '').trim()) return n as Text;
  }
  return null;
}

const num = (s: string | null | undefined) => {
  const m = /-?\d+(?:[.,]\d+)?/.exec((s ?? '').replace(',', '.'));
  return m ? Number.parseFloat(m[0]) : NaN;
};

const clock = (total: number) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

export function familiarLoop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const qa = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));

  /* ------------------------------------------------------------- handles
     Every one of these is optional. A sibling agent is rewriting the markup
     under this file; a missing hook costs its own beat and nothing else. */
  const nvdaValue = q('.fam__mkt--nvda .fam__mkt-value');
  const nvdaPct = lastText(q('.fam__mkt--nvda .fam__mkt-foot'));
  const ecbFoot = q('.fam__mkt--ecb .fam__mkt-foot');
  const rows = qa('.fam__event:not(.fam__event--btc) .fam__rows li');
  const gauge = q('.fam__gauge');
  const pills = qa('.fam__chips .fam__chip-pill');
  const btcMeta = q('.fam__event--btc .fam__event-meta');
  const timer = btcMeta
    ? Array.from(btcMeta.querySelectorAll('span'))
        .find((s) => /^\d{1,2}:\d{2}$/.test((s.textContent ?? '').trim())) ?? null
    : null;

  const rowPct = (i: number) => rows[i]?.querySelector<HTMLElement>('.fam__row-pct') ?? null;
  const rowName = (i: number) => rows[i]?.querySelector<HTMLElement>('.fam__row-name') ?? null;
  const canSort = rows.length >= 3 && !!rowPct(1) && !!rowPct(2) && !!rowName(1) && !!rowName(2);

  /* Everything this loop writes into, and what it said before it did. Teardown
     hands the section back character for character. */
  const held: Array<[Text | HTMLElement, string]> = [];
  const hold = (t: Text | HTMLElement | null) => {
    if (!t) return;
    held.push([t, (t instanceof Text ? t.nodeValue : t.textContent) ?? '']);
  };

  let ctx: gsap.Context | undefined;
  let driver: gsap.core.Timeline | undefined;
  let story: gsap.core.Timeline | undefined;
  let tick = 0;
  let ready = 0;
  let io: IntersectionObserver | undefined;
  let watcher: MutationObserver | undefined;
  let started = false;
  let stopped = false;

  /* ------------------------------------------------------------ the story */
  const start = () => {
    if (started || stopped) return;
    started = true;

    [nvdaValue, gauge, timer].forEach(hold);
    hold(nvdaPct);
    if (canSort) [1, 2].forEach((i) => { hold(rowName(i)); hold(rowPct(i)); });

    // Resting values are read now, with the entrance finished and its
    // `clearProps` already run, so a flash has something true to return to.
    const css = (el: HTMLElement | null, prop: 'color' | 'backgroundColor') =>
      (el ? getComputedStyle(el)[prop] : '') || '';
    const valueRest = css(nvdaValue, 'color');
    const pctRest = css(rowPct(1), 'color');
    const ecbRest = css(ecbFoot, 'backgroundColor');
    const pillBg = css(pills[0] ?? null, 'backgroundColor');
    const pillFg = css(pills[0] ?? null, 'color');

    // The two states each figure ping-pongs between. Both are read off the
    // design rather than hard-coded, so the resting frame is whatever the
    // component ships today.
    const price0 = num(nvdaValue?.textContent);
    const day0 = num(nvdaPct?.nodeValue);
    const gauge0 = num(gauge?.textContent);
    const priceDp = (nvdaValue?.textContent ?? '').includes('.') ? 2 : 0;

    // Positions 1 and 2 of the leaderboard, as a model. The DOM keeps its own
    // order; only what the two rows say is exchanged, so nothing is reparented
    // under a load-in that may still hold references to these nodes.
    const slots = [1, 2].map((i) => ({
      name: rowName(i)?.textContent ?? '',
      pct: num(rowPct(i)?.textContent),
    }));
    const paint = () => {
      slots.forEach((s, k) => {
        const n = rowName(k + 1);
        const p = rowPct(k + 1);
        if (n) n.textContent = s.name;
        if (p) p.textContent = `${Math.round(s.pct)}%`;
      });
    };

    let phase = 0;

    ctx = gsap.context(() => {
      const runCycle = () => {
        const up = phase % 2 === 0; // even: the outsider climbs. odd: it gives it back.
        const tl = gsap.timeline();
        story = tl;

        /* 1 — NVDA prints. The figure changes on the frame the flash starts;
           the colour is the tell, the digits are the beat. */
        if (nvdaValue && Number.isFinite(price0)) {
          const next = up ? price0 - 0.07 : price0;
          const nextDay = Number.isFinite(day0) ? (up ? day0 - 0.03 : day0) : NaN;
          tl.call(() => {
            nvdaValue.textContent = `$${next.toFixed(priceDp)}`;
            if (nvdaPct && Number.isFinite(nextDay)) nvdaPct.nodeValue = `${nextDay.toFixed(2)}%`;
          }, undefined, 0)
            .to(nvdaValue, { color: up ? DOWN : UP, duration: 0.22, ease: 'sine.out' }, 0)
            .to(nvdaValue, { color: valueRest, duration: 1.0, ease: 'sine.inOut' }, 0.24);
        }

        /* 2 — the refresh reaches the ECB card. A deposit facility rate does not
           move every thirteen seconds, so only the chip acknowledges it. */
        if (ecbFoot && ecbRest) {
          tl.to(ecbFoot, { backgroundColor: ECB_FOOT_LIT, duration: 0.35, ease: 'sine.out' }, 0.55)
            .to(ecbFoot, { backgroundColor: ecbRest, duration: 0.85, ease: 'sine.inOut' }, 0.9);
        }

        /* 3 — the leaderboard re-sorts. */
        if (canSort && Number.isFinite(slots[0].pct) && Number.isFinite(slots[1].pct)) {
          const moverSlot = up ? 1 : 0;           // bottom row climbs, then the same name falls back
          const mover = rows[moverSlot + 1];
          const pctEl = rowPct(moverSlot + 1)!;
          const from = slots[moverSlot].pct;
          const to = up ? from + 2 : from - 2;
          const walk = { v: from };

          tl.to(walk, {
            v: to, duration: 0.8, ease: 'sine.inOut',
            onUpdate: () => { pctEl.textContent = `${Math.round(walk.v)}%`; },
          }, 1.3)
            .to(pctEl, { color: up ? UP : DOWN, duration: 0.22, ease: 'sine.out' }, 1.3)
            .to(pctEl, { color: pctRest, duration: 0.9, ease: 'sine.inOut' }, 2.5);

          // The cross itself. Measured off the rows each cycle and expressed as
          // a share of a row's own height, so it stays a row pitch at every
          // breakpoint without a timeline rebuild on resize.
          const a = rows[1].getBoundingClientRect();
          const b = rows[2].getBoundingClientRect();
          const pitch = a.height > 0 ? ((b.top - a.top) / a.height) * 100 : 0;
          const cross = { v: 0 };
          tl.to(cross, {
            v: 1, duration: 0.9, ease: 'sine.inOut',
            onUpdate: () => {
              // The rows are transparent text on the card, so at the halfway
              // point the two lines sit on top of each other and read as a
              // collision. Dipping both through the pass turns that into a
              // dissolve — the travel is unchanged, only the overlap is.
              const fade = 1 - 0.62 * Math.sin(Math.PI * cross.v);
              gsap.set(rows[1], { yPercent: pitch * cross.v, opacity: fade });
              gsap.set(rows[2], { yPercent: -pitch * cross.v, opacity: fade });
            },
          }, 2.15)
            .call(() => {
              gsap.set([rows[1], rows[2]], { yPercent: 0 });
              gsap.set([rows[1], rows[2]], { clearProps: 'opacity' });
              slots[moverSlot].pct = to;
              slots.reverse();
              paint();
            }, undefined, 3.05);

          // The odds follow the move: Yes on the row that gained, No on the one
          // that gave it up.
          const chip = mover.querySelector<HTMLElement>(up ? '.fam__chip--yes' : '.fam__chip--no');
          if (chip) {
            const chipRest = getComputedStyle(chip).backgroundColor;
            tl.to(chip, { backgroundColor: up ? CHIP_YES_LIT : CHIP_NO_LIT, duration: 0.3, ease: 'sine.out' }, 2.6)
              .to(chip, { backgroundColor: chipRest, duration: 0.8, ease: 'sine.inOut' }, 2.9);
          }
        }

        /* 4 — the 5-minute BTC ring follows the same print. */
        if (gauge && Number.isFinite(gauge0)) {
          const ring = { v: gauge0 + (up ? 0 : 2) };
          tl.to(ring, {
            v: gauge0 + (up ? 2 : 0), duration: 0.7, ease: 'sine.inOut',
            onUpdate: () => { gauge.textContent = `${Math.round(ring.v)}%`; },
          }, 3.0)
            // `immediateRender: false` or the start value is written the moment
            // the cycle is built rather than when the playhead reaches 3.0s —
            // harmless here, since `brightness(1)` is what the ring already
            // looks like, but a delayed `fromTo` that parks a real offset holds
            // the section off its settled design for most of the cycle.
            .fromTo(gauge, { filter: 'brightness(1)' },
              { filter: 'brightness(1.5)', duration: 0.3, ease: 'sine.out', immediateRender: false }, 3.0)
            .to(gauge, { filter: 'brightness(1)', duration: 0.85, ease: 'sine.inOut' }, 3.3);
        }

        /* 5 — a category is tapped, holds, and lets go, so the row at rest is
           the row in the design. */
        const pill = pills[phase % (pills.length || 1)];
        if (pill && pillBg) {
          tl.to(pill, { backgroundColor: PILL_ON_BG, color: PILL_ON_FG, duration: 0.5, ease: 'sine.out' }, 3.6)
            .to(pill, { backgroundColor: pillBg, color: pillFg, duration: 0.8, ease: 'sine.inOut' }, 5.0);
        }

        phase += 1;
      };

      // A clock the cycles hang off, rather than a repeating timeline whose
      // tweens would have to be rebuilt in place every pass: each cycle knows
      // which row is moving and which pill is being tapped, so it is built with
      // real targets and thrown away.
      driver = gsap.timeline({ repeat: -1, paused: true })
        .call(runCycle)
        .to({}, { duration: PERIOD });
      driver.play();
    }, root);

    /* The round's clock. One digit, once a second, and only while the section
       is on screen. It restarts at 5:00 because the market is a 5m round. */
    if (timer) {
      let left = (() => {
        const [m, s] = (timer.textContent ?? '').trim().split(':');
        return Number.parseInt(m, 10) * 60 + Number.parseInt(s, 10);
      })();
      tick = window.setInterval(() => {
        left = left > 0 ? left - 1 : 300;
        timer.textContent = clock(left);
      }, 1000);
    }

    // Off screen, nothing runs.
    io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { driver?.play(); story?.play(); }
      else { driver?.pause(); story?.pause(); }
    }, { rootMargin: '120px' });
    io.observe(root);
  };

  /* -------------------------------------------------------------- the gate
     The loop must not open over the entrance, and it is wired in two ways that
     look different from in here. `useSectionMotion` passes this function as its
     `idle` option, which it calls from the entrance timeline's `onComplete` —
     one line *after* it has dispatched `motion:done`, so a listener attached
     here would wait for an event that has already gone by. Called any earlier
     (a direct call, a lab harness) the event is still ahead of us and is the
     best signal there is.

     So both are watched, and under them sits the question that is true either
     way: is anything still animating inside this section? Once the band has
     dropped `data-motion="pending"` — i.e. is demonstrably running rather than
     waiting to be scrolled to — the section is sampled four times a second and
     counted quiet only after three consecutive still samples, which is longer
     than the 0.25–0.4s pause the house entrance takes after its lead element.
     Whichever answers first opens the loop, and the first beat lands SETTLE
     later. */
  const open = () => {
    if (stopped || ready) return;
    ready = window.setTimeout(start, SETTLE * 1000);
  };

  let probe = 0;
  let quiet = 0;
  let waited = 0;
  const busy = () =>
    gsap.globalTimeline.getChildren(true, true, true).some((a) => {
      if (!a.isActive()) return false;
      const targets = (a as gsap.core.Tween).targets?.() ?? [];
      return targets.some((t) => t instanceof Node && (t === root || root.contains(t)));
    });
  const watch = () => {
    probe = window.setInterval(() => {
      waited += 1;
      quiet = busy() ? 0 : quiet + 1;
      // The cap is a backstop, not the plan: something in the section looping
      // already would otherwise hold this closed forever.
      if (quiet >= 3 || waited >= 40) { window.clearInterval(probe); probe = 0; open(); }
    }, 250);
  };

  const heard = () => { open(); };
  root.addEventListener('motion:done', heard);

  if (root.dataset.motionDone) open();
  else if (root.dataset.motion !== 'pending') watch();
  else {
    watcher = new MutationObserver(() => {
      if (root.dataset.motion !== 'pending') { watcher?.disconnect(); watch(); }
    });
    watcher.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  return () => {
    stopped = true;
    window.clearTimeout(ready);
    window.clearInterval(tick);
    window.clearInterval(probe);
    root.removeEventListener('motion:done', heard);
    watcher?.disconnect();
    io?.disconnect();
    story?.kill();
    driver?.kill();
    // Reverts every transform and colour this loop wrote, then the text goes
    // back too, so the section is left in the state the design shipped.
    ctx?.revert();
    held.forEach(([node, text]) => {
      if (node instanceof Text) node.nodeValue = text; else node.textContent = text;
    });
  };
}

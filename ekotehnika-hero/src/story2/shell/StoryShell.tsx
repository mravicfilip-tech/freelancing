// The shared shell for storyline 2. It pins the stage with the story clock, mounts one scene behind it, draws the
// grid over the scene, lays the text of each hold beat on the grid and puts the shared frame on top. After the pinned
// stage come the products and the footer as normal sections.
//
// All motion reads the story clock, so it scrubs with the scroll and freezes with ?at=. The loop below drives the
// block wipes, the scroll fill, the count up, the grid and the logos from clock.pos with no React render.
// The Prodaja tabs run on real time once their beat is on screen, from the story clock for when.
// With reduced motion there is no pin and no loop, each hold beat is a still screen with every part at its end state.
import { Suspense, useEffect, useMemo, useRef, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { stillClock, useStoryClock, type SceneProps } from '../clock';
import { TIMELINE, type BeatSpan } from '../timeline';
import { HeroFrame } from '../../ui/HeroFrame';
import { Grid, paintMarks, ruleMarks } from './Grid';
import { ATPane, C1Pane, NPane, PPane, RPane, SPane, setTab } from './panes';
import { AfterStory } from './sections';
import { COUNT_DONE, FILL_FROM, FILL_TO, HERO_SECONDS, WIPE_DONE, WIPE_SHARE, clamp01, formatCount, outCubic, range } from './motion';
import { prepRise, setRise, type Rise } from './reveal';
import { forkBackFrom, forkBackTo, forkPassesPx, forkTipPx } from '../scenes/sistem/forkTip';
import './shell.css';

export type Tone = 'light' | 'dark';

type LayerDef = { id: string; Pane: () => ReactNode; dark: boolean; still: number };

// Every hold beat but H, whose text is the shared hero frame. dark marks the beats whose ground is dark in
// the light versions. still is the keyframe the reduced motion section shows.
const LAYERS: LayerDef[] = [
  { id: 'C1', Pane: C1Pane, dark: false, still: 0.5 },
  { id: 'R', Pane: RPane, dark: false, still: 0.5 },
  { id: 'P', Pane: PPane, dark: false, still: 0.3 },
  { id: 'S', Pane: SPane, dark: true, still: 0.5 },
  { id: 'N', Pane: NPane, dark: false, still: 0.95 },
  { id: 'AT', Pane: ATPane, dark: true, still: 0.5 },
];

// Where the text leaves, as a share of its beat. P holds its four models to the end of the hold.
const LEAVE: Record<string, [number, number]> = { AT: [1.01, 1.02] };

// Prodaja steps one model per 0.22 of the hold, at k 0.06, 0.28, 0.50 and 0.72, the last one held to the end.
const P_FIRST = 0.06;
const P_STEP = 0.22;
const LEAVE_DEFAULT: [number, number] = [0.86, 1];
// the beat that comes in behind the L fork's tip, see scenes/sistem/forkTip.ts
const BEHIND_FORK = 'N';

// Story pixels where the ground under the top row is dark in the light versions, the black push at the end
// of the warehouse, the blueprint and the fork lift, then the dark floor of the last chapter.
const DARK_TOP: [number, number][] = [
  [7790, 9525],
  [10790, 13000],
];

const HOLDS = TIMELINE.filter((b) => b.hold);

// Beats whose text reveals over more of the hold than WIPE_DONE, by the factor given. C1's wipes and counts took about 144px of
// scroll, one or two wheel ticks (Filip 2026-10-12, video round 4, "this animation is happening too fast"), so they run over
// 0.36 of the hold, twice the old pace, which is 1.45 times the slower pace every beat has now.
const SLOW: Record<string, number> = { C1: 1.45 };

// The story's sections that have a link in the top nav, by the data-ch of that link, see HeroFrame.
const CHAPTER: Record<string, string> = { prodaja: 'prodaja', servis: 'servis', najam: 'najam' };

const ink = (tone: Tone, dark: boolean) => (tone === 'dark' || dark ? 'dark' : 'light');

function mountScene(Scene: ComponentType<SceneProps>, clock: SceneProps['clock']) {
  return (
    <Suspense fallback={null}>
      <Scene clock={clock} />
    </Suspense>
  );
}

type Group = {
  id: string;
  el: HTMLElement;
  span: BeatSpan;
  // layers leave by a share of their beat, the hero block leaves by story pixels
  leave: [number, number];
  leaveInPx: boolean;
  // the parts that rise in, see reveal.ts, a figure among them counts up as it rises
  // at is the story pixel a part starts rising on when the L fork's tip uncovers it, Najam only, NaN everywhere else
  wipes: { el: HTMLElement; order: number; rise: Rise; at: number; target: number; suffix: string; lastText: string }[];
  fills: { el: HTMLElement; letters: HTMLElement[]; on: number }[];
  // the plus marks at this group's block rules, drawn into .s2-plus
  wrap: HTMLElement | null;
  tabs: HTMLElement | null;
  persistent: boolean;
  maxOrder: number;
  last: string;
};

function collect(id: string, el: HTMLElement, span: BeatSpan, opts: Partial<Group> = {}): Group {
  const wipes = Array.from(el.querySelectorAll<HTMLElement>('[data-wipe]')).map((w) => ({
    el: w,
    order: Number(w.dataset.wipe ?? 0),
    rise: prepRise(w),
    at: NaN,
    target: w.dataset.count ? Number(w.dataset.count) : NaN,
    suffix: w.dataset.suffix ?? '',
    lastText: '',
  }));
  const fills = Array.from(el.querySelectorAll<HTMLElement>('[data-fill]')).map((f) => {
    f.setAttribute('data-live', '');
    return { el: f, letters: Array.from(f.querySelectorAll<HTMLElement>('.fl')), on: 0 };
  });
  return {
    id,
    el,
    span,
    leave: LEAVE_DEFAULT,
    leaveInPx: false,
    wipes,
    fills,
    wrap: null,
    tabs: el.querySelector<HTMLElement>('.s2-p'),
    persistent: false,
    maxOrder: Math.max(1, ...wipes.map((w) => w.order)),
    last: '',
    ...opts,
  };
}

type ShellProps = {
  Scene: ComponentType<SceneProps>;
  tone: Tone;
  reduced: boolean;
  // A version can name its own dark beats and dark spans under the top row, in place of the defaults.
  darkLayers?: string[];
  darkTop?: [number, number][];
};

export function StoryShell({ Scene, tone, reduced, darkLayers, darkTop = DARK_TOP }: ShellProps) {
  const { stageRef, clock } = useStoryClock(reduced);
  const isDark = (l: LayerDef) => (darkLayers ? darkLayers.includes(l.id) : l.dark);
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const stills = useMemo(() => LAYERS.map((l) => stillClock(TIMELINE.findIndex((b) => b.id === l.id), l.still)), []);
  const heroStill = useMemo(() => stillClock(0, 0.5), []);
  const frameTone = tone === 'dark' ? 'white' : 'ink';

  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    const hf = heroRef.current;
    const grid = gridRef.current;
    const plus = stage?.querySelector<HTMLElement>('.s2-plus');
    if (!stage || !hf || !grid || !plus) return;
    const t0 = performance.now();
    const H = TIMELINE[0];

    const groups: Group[] = [];
    // the top row buttons wipe in once at load and stay
    const actions = hf.querySelector<HTMLElement>('.hf-actions');
    if (actions) groups.push(collect('top', actions, H, { persistent: true }));
    const heroBottom = hf.querySelector<HTMLElement>('.hf-bottom');
    if (heroBottom) groups.push(collect('H', heroBottom, H, { leave: [500, 780], leaveInPx: true }));
    stage.querySelectorAll<HTMLElement>('[data-layer]').forEach((el) => {
      const span = TIMELINE.find((b) => b.id === el.dataset.layer)!;
      groups.push(collect(span.id, el, span, { leave: LEAVE[span.id] ?? LEAVE_DEFAULT }));
    });
    // each group draws the plus marks at its own block rules into a wrapper of its own, shown with the group
    for (const G of groups) {
      if (G.persistent) continue;
      const w = document.createElement('div');
      w.className = 'gpg';
      w.style.visibility = 'hidden';
      plus.appendChild(w);
      G.wrap = w;
      // Prodaja starts with no model on show, the first one comes in at k 0.06
      if (G.id === 'P' && G.tabs) setTab(G.tabs, -1);
    }

    // The nav's chapter bar, under the link for the chapter on screen, under Početna where the chapter has no link.
    const nav = hf.querySelector<HTMLElement>('.hf-nav');
    const bar = nav?.querySelector<HTMLElement>('.hf-nav-bar');
    nav?.setAttribute('data-live', '');
    let lastCh = '';
    const placeBar = () => {
      if (!nav || !bar) return;
      const a = nav.querySelector<HTMLElement>(`a[data-ch="${lastCh}"]`) ?? nav.querySelector<HTMLElement>('a[data-ch="home"]');
      if (!a) return;
      const n = nav.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      bar.style.setProperty('--nb-x', `${(r.left - n.left).toFixed(1)}px`);
      bar.style.setProperty('--nb-y', `${(r.bottom - n.top - 2).toFixed(1)}px`);
      bar.style.setProperty('--nb-w', `${r.width.toFixed(1)}px`);
    };

    // the plus marks at every crossing of a vertical with a block rule, from the rules as laid out
    const measure = () => {
      for (const G of groups) if (G.wrap) paintMarks(G.wrap, ruleMarks(G.el, stage));
      // Najam comes in behind the L fork as it backs out, so each of its parts rises once the tip has passed its left edge
      const sr = stage.getBoundingClientRect();
      for (const G of groups)
        if (G.id === BEHIND_FORK)
          for (const W of G.wipes) W.at = forkPassesPx(W.el.getBoundingClientRect().left - sr.left, stage.clientWidth, stage.clientHeight);
      placeBar();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    document.fonts?.ready.then(measure);
    const settle = window.setTimeout(measure, 800);

    let lastTone = '';
    let lastGrid = '';
    let id = 0;

    const loop = () => {
      const pos = clock.pos.current;
      // the hero block and the top row play on real time after load, 1.2s for all lines, then read the clock
      const heroT = clamp01((performance.now() - t0) / 1000 / HERO_SECONDS);

      for (const G of groups) {
        const isHero = G.id === 'H' || G.id === 'top';
        const len = G.span.end - G.span.start;
        const k0 = (pos - G.span.start) / len;
        // budget is the story pixels all wipes of this group share, the hero uses a fixed budget run by time
        const slow = SLOW[G.id] ?? 1;
        const budget = isHero ? 120 : WIPE_DONE * slow * len;
        const dur = budget * WIPE_SHARE;
        const stagger = (budget - dur) / G.maxOrder;
        const u = isHero ? Math.max(heroT * budget, (pos / len) * (budget / WIPE_DONE)) : pos - G.span.start;
        const k = isHero ? Math.max(k0, FILL_TO * heroT) : k0;
        let on: boolean;
        if (G.persistent) on = true;
        else if (G.leaveInPx) {
          // a hard cut half way through the leave window, no opacity ramp (taste 2026-10-12 17:55, nothing fades)
          on = pos < (G.leave[0] + G.leave[1]) / 2;
        } else {
          on = k >= 0 && k <= 1 && k < (G.leave[0] + G.leave[1]) / 2;
        }
        // Najam turns on as the fork starts backing out of L, cut at the blade's tip, so it draws on behind the steel and no frame
        // is an empty page (round 5, Filip's note 3). Its layout is unchanged.
        const behind = G.id === BEHIND_FORK && pos >= forkBackFrom && pos < forkBackTo;
        if (G.id === BEHIND_FORK && pos >= forkBackFrom && k < 0) on = true;
        const cut = behind ? `inset(0 0 0 ${Math.max(0, forkTipPx(pos, stage.clientWidth, stage.clientHeight)).toFixed(1)}px)` : '';
        if (G.id === BEHIND_FORK && cut !== G.el.style.clipPath) {
          G.el.style.clipPath = cut;
          if (G.wrap) G.wrap.style.clipPath = cut;
        }
        const vis = on ? 'v' : 'h';
        if (vis !== G.el.dataset.vis) {
          G.el.dataset.vis = vis;
          G.el.style.visibility = on ? 'visible' : 'hidden';
          G.el.style.setProperty('--lv', on ? 'visible' : 'hidden');
          if (G.wrap) G.wrap.style.visibility = on ? 'visible' : 'hidden';
          // Prodaja shows no model while its beat is off screen, so the first one comes in again next time. A model the
          // visitor picked stays picked, and is hidden with its pane, see .p-fig in shell.css.
          if (!on && G.id === 'P' && G.tabs && !G.tabs.hasAttribute('data-pick')) setTab(G.tabs, -1);
        }
        if (!on) continue;
        // the text of a beat is shown whole or not at all, so there is no opacity to drive here

        // the rise and the count up
        for (const W of G.wipes) {
          setRise(W.rise, clamp01(Number.isNaN(W.at) ? (u - W.order * stagger) / dur : (pos - W.at - (W.order % 4) * 15) / dur));
          if (!Number.isNaN(W.target)) {
            const cs = W.order * stagger + dur * 0.35;
            const cp = clamp01((u - cs) / Math.max(20, COUNT_DONE * slow * len - cs));
            const text = formatCount(W.target * outCubic(cp)) + W.suffix;
            if (text !== W.lastText) {
              W.lastText = text;
              W.el.textContent = text;
            }
          }
        }
        // scroll fill, letter by letter
        const f = range(k, FILL_FROM, FILL_TO);
        for (const F of G.fills) {
          const n = Math.round(f * F.letters.length);
          if (n !== F.on) {
            const a = Math.min(n, F.on);
            const b = Math.max(n, F.on);
            for (let i = a; i < b; i++) F.letters[i]?.classList.toggle('on', n > F.on);
            F.on = n;
          }
        }
        // Prodaja, the tabs step with k until the visitor picks one, one model per 0.22 of the hold
        if (G.id === 'P' && G.tabs && !G.tabs.hasAttribute('data-pick')) {
          const step = k < P_FIRST ? -1 : Math.min(3, Math.floor((k - P_FIRST) / P_STEP));
          if (G.tabs.getAttribute('data-tab') !== String(step)) setTab(G.tabs, step);
        }
      }

      // grid draw on at each hold, dim to 40 percent between holds, plus marks turn once on reveal
      let go = 0.4;
      let draw = 1;
      const gPos = Math.max(pos, heroT * 200);
      for (const h of HOLDS) {
        const gp = h.id === 'H' ? gPos : pos;
        if (gp >= h.start && gp <= h.end) {
          go = 1;
          draw = outCubic(range(gp - h.start, 0, 200));
          break;
        }
        if (gp > h.end && gp - h.end < 150) go = Math.max(go, 1 - 0.6 * range(gp - h.end, 0, 150));
        if (gp < h.start && h.start - gp < 120) go = Math.min(go, 0.4 * ((h.start - gp) / 120));
      }
      const gk = `${Math.round(go * 100)}|${Math.round(draw * 200)}`;
      if (gk !== lastGrid) {
        lastGrid = gk;
        grid.style.setProperty('--go', go.toFixed(2));
        plus.style.setProperty('--go', go.toFixed(2));
        grid.style.setProperty('--draw', draw.toFixed(3));
        plus.style.setProperty('--draw', draw.toFixed(3));
        grid.style.setProperty('--rot', draw >= 0.999 ? '0' : draw.toFixed(3));
        plus.style.setProperty('--rot', draw >= 0.999 ? '0' : draw.toFixed(3));
      }

      // the nav's chapter bar follows the section of the beat on screen
      const after = document.documentElement.hasAttribute('data-after-story');
      const ch = after ? 'home' : (CHAPTER[TIMELINE[clock.beat.current]?.section ?? ''] ?? 'home');
      if (ch !== lastCh) {
        lastCh = ch;
        placeBar();
      }

      // dark span, the grid and the frame turn white, the Linde logo stays as supplied and the Ekotehnika wordmark turns white
      const dark = tone === 'dark' || darkTop.some(([a, b]) => pos >= a && pos < b);
      const t = dark ? 'white' : 'ink';
      if (t !== lastTone) {
        lastTone = t;
        hf.dataset.tone = t;
        hf.dataset.toneBottom = t;
        grid.dataset.tone = t;
        plus.dataset.tone = t;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.clearTimeout(settle);
    };
  }, [reduced, clock, stageRef, tone, darkTop]);

  // The version chip is review chrome in the bottom band of the story. Over the sections after the story it steps aside, so
  // it never sits on a spec row, a figure or the footer copyright. The root carries the same attribute for that, so the
  // marked section is looked up inside the body.
  useEffect(() => {
    const root = document.documentElement;
    const on = () => {
      const next = document.body.querySelector<HTMLElement>('[data-after-story]');
      const after = !!next && next.getBoundingClientRect().top < window.innerHeight * 0.95;
      if (after) root.setAttribute('data-after-story', '');
      else root.removeAttribute('data-after-story');
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      root.removeAttribute('data-after-story');
    };
  }, []);

  // With reduced motion each hold is a still screen, the plus marks at its block rules are placed once, after the fonts load.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!reduced) return;
    const root = rootRef.current;
    if (!root) return;
    const run = () => {
      root.querySelectorAll<HTMLElement>('.s2-still').forEach((sec) => {
        const g = sec.querySelector<HTMLElement>('.s2-plus .gpg');
        if (g) paintMarks(g, ruleMarks(sec, sec));
      });
    };
    run();
    document.fonts?.ready.then(run);
    const ro = new ResizeObserver(run);
    ro.observe(root);
    return () => ro.disconnect();
  }, [reduced]);

  if (reduced) {
    return (
      <div className="s2" data-tone={tone} ref={rootRef}>
        <section className="s2-stage s2-still" aria-label="Ekotehnika, Linde viljuškari">
          <div className="s2-scene" aria-hidden="true">
            {mountScene(Scene, heroStill)}
          </div>
          <Grid />
          <HeroFrame tone={frameTone} rootRef={heroRef} />
        </section>
        {LAYERS.map((l, i) => (
          <section className="s2-stage s2-still" data-ink={ink(tone, isDark(l))} key={l.id} aria-label={l.id}>
            <div className="s2-scene" aria-hidden="true">
              {mountScene(Scene, stills[i])}
            </div>
            <Grid />
            <div className="s2-layer" data-ink={ink(tone, isDark(l))} style={{ opacity: 1 }}>
              <l.Pane />
            </div>
          </section>
        ))}
        <AfterStory />
      </div>
    );
  }

  return (
    <div className="s2" data-tone={tone}>
      <div ref={stageRef} className="s2-stage" role="region" aria-label="Ekotehnika, Linde viljuškari">
        <div className="s2-scene" aria-hidden="true">
          {mountScene(Scene, clock)}
        </div>
        <Grid rootRef={gridRef} />
        {LAYERS.map((l) => (
          <section className="s2-layer" data-layer={l.id} data-ink={ink(tone, isDark(l))} key={l.id} style={{ visibility: 'hidden', '--lv': 'hidden' } as CSSProperties}>
            <l.Pane />
          </section>
        ))}
        <HeroFrame tone={frameTone} rootRef={heroRef} />
      </div>
      <AfterStory />
    </div>
  );
}

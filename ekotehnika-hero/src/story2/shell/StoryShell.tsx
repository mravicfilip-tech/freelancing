// The shared shell for storyline 2. It pins the stage with the story clock, mounts one scene behind it, draws the
// grid over the scene, lays the text of each hold beat on the grid and puts the shared frame on top. After the pinned
// stage come the statement, Proizvodi, the client wall, the closing band and the footer as normal sections.
//
// All motion reads the story clock, so it scrubs with the scroll and freezes with ?at=. The loop below drives the
// block wipes, the scroll fill, the count up, the grid, the counter and the logos from clock.pos with no React render.
// With reduced motion there is no pin and no loop, each hold beat is a still screen with every part at its end state.
import { Suspense, useEffect, useMemo, useRef, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { stillClock, useStoryClock, type SceneProps } from '../clock';
import { LENGTH, TIMELINE, type BeatSpan } from '../timeline';
import { HeroFrame } from '../../ui/HeroFrame';
import { markers } from '../copy';
import { Grid } from './Grid';
import { ATPane, C1Pane, NPane, PPane, RPane, SPane, setTab } from './panes';
import { Closing, Clients, Footer, Products, Statement } from './sections';
import { COUNT_DONE, FILL_FROM, FILL_TO, HERO_SECONDS, WIPE_DONE, WIPE_SHARE, clamp01, formatCount, outCubic, range, wipeAt } from './motion';
import { applyBtnVariant } from './variant';
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

// Where the text leaves, as a share of its beat. P keeps its text through the first half, then lets the
// warehouse reveal take over.
const LEAVE: Record<string, [number, number]> = { P: [0.5, 0.74], AT: [1.01, 1.02] };
const LEAVE_DEFAULT: [number, number] = [0.86, 1];

// Story pixels where the ground under the top row is dark in the light versions, the black push at the end
// of the warehouse, the blueprint and the fork lift, then the dark floor of the last chapter.
const DARK_TOP: [number, number][] = [
  [7790, 9525],
  [10790, 13000],
];

// The counter on the right edge, the number of the last hold passed.
const COUNTER: [number, string, string][] = [
  [10900, '06', markers.at.name],
  [9600, '05', markers.n.name],
  [8000, '04', markers.s.name],
  [5300, '03', markers.p.name],
  [3500, '02', markers.r.name],
  [1500, '01', markers.c1.name],
  [0, '00', 'Početna'],
];

const HOLDS = TIMELINE.filter((b) => b.hold);
const PAD = 16;

const ink = (tone: Tone, dark: boolean) => (tone === 'dark' || dark ? 'dark' : 'light');

function mountScene(Scene: ComponentType<SceneProps>, clock: SceneProps['clock']) {
  return (
    <Suspense fallback={null}>
      <Scene clock={clock} />
    </Suspense>
  );
}

type Rect = { x: number; y: number; w: number; h: number };

// Merge overlapping boxes so the XOR mask below never brings a line back inside a text box.
function merge(rects: Rect[]): Rect[] {
  const out = rects.map((r) => ({ ...r }));
  let again = true;
  while (again) {
    again = false;
    for (let i = 0; i < out.length && !again; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
          const x = Math.min(a.x, b.x);
          const y = Math.min(a.y, b.y);
          out[i] = { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
          out.splice(j, 1);
          again = true;
          break;
        }
      }
    }
  }
  return out;
}

// The grid is hidden behind every text box with 16px of padding. A full layer minus one box each, by XOR.
function maskStyle(rects: Rect[]) {
  const boxes = merge(rects);
  if (!boxes.length) return { image: '', size: '', pos: '', repeat: '', comp: '' };
  const solid = 'linear-gradient(#000,#000)';
  return {
    image: [...boxes.map(() => solid), solid].join(','),
    size: [...boxes.map((r) => `${r.w.toFixed(1)}px ${r.h.toFixed(1)}px`), '100% 100%'].join(','),
    pos: [...boxes.map((r) => `${r.x.toFixed(1)}px ${r.y.toFixed(1)}px`), '0 0'].join(','),
    repeat: 'no-repeat',
    comp: [...boxes.map(() => 'exclude'), 'add'].join(','),
  };
}

type Group = {
  id: string;
  el: HTMLElement;
  span: BeatSpan;
  // layers leave by a share of their beat, the hero block leaves by story pixels
  leave: [number, number];
  leaveInPx: boolean;
  wipes: { el: HTMLElement; order: number; last: string; target: number; suffix: string; lastText: string }[];
  fills: { el: HTMLElement; letters: HTMLElement[]; on: number }[];
  masks: HTMLElement[];
  rects: Rect[];
  tabs: HTMLElement | null;
  persistent: boolean;
  maxOrder: number;
  last: string;
};

function collect(id: string, el: HTMLElement, span: BeatSpan, opts: Partial<Group> = {}): Group {
  const wipes = Array.from(el.querySelectorAll<HTMLElement>('[data-wipe]')).map((w) => ({
    el: w,
    order: Number(w.dataset.wipe ?? 0),
    last: '',
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
    masks: Array.from(el.querySelectorAll<HTMLElement>('[data-mask]')),
    rects: [],
    tabs: el.querySelector<HTMLElement>('.s2-p'),
    persistent: false,
    maxOrder: Math.max(1, ...wipes.map((w) => w.order)),
    last: '',
    ...opts,
  };
}

// Box of an element inside the stage, from its layout position, so a running reveal never moves the mask.
function boxIn(el: HTMLElement, stage: HTMLElement): Rect {
  const a = el.getBoundingClientRect();
  const b = stage.getBoundingClientRect();
  return { x: a.left - b.left - PAD, y: a.top - b.top - PAD, w: a.width + PAD * 2, h: a.height + PAD * 2 };
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
  useEffect(() => {
    applyBtnVariant();
  }, []);
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
    const lines = grid?.querySelector<HTMLElement>('.s2-lines');
    const plus = stage?.querySelector<HTMLElement>('.s2-plus');
    if (!stage || !hf || !grid || !lines || !plus) return;
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
    // boxes that are always there, logos, nav, buttons and the counter
    const fixed = Array.from(hf.querySelectorAll<HTMLElement>('.hf-top [data-mask], .hf-nums, .hf-coords'));
    let fixedRects: Rect[] = [];

    const measure = () => {
      fixedRects = fixed.map((e) => boxIn(e, stage));
      for (const G of groups) G.rects = G.masks.map((e) => boxIn(e, stage));
      lastMask = '\u0000';
    };
    let lastMask = '';
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    document.fonts?.ready.then(measure);
    const settle = window.setTimeout(measure, 800);

    let lastTone = '';
    let lastCounter = '';
    let lastProg = -1;
    let lastGrid = '';
    let id = 0;

    const loop = () => {
      const pos = clock.pos.current;
      // the hero block and the top row play on real time after load, 1.2s for all lines, then read the clock
      const heroT = clamp01((performance.now() - t0) / 1000 / HERO_SECONDS);
      const visible: Group[] = [];

      for (const G of groups) {
        const isHero = G.id === 'H' || G.id === 'top';
        const len = G.span.end - G.span.start;
        const k0 = (pos - G.span.start) / len;
        // budget is the story pixels all wipes of this group share, the hero uses a fixed budget run by time
        const budget = isHero ? 120 : WIPE_DONE * len;
        const dur = budget * WIPE_SHARE;
        const stagger = (budget - dur) / G.maxOrder;
        const u = isHero ? Math.max(heroT * budget, (pos / len) * (budget / WIPE_DONE)) : pos - G.span.start;
        const k = isHero ? Math.max(k0, FILL_TO * heroT) : k0;
        let o = 0;
        let on: boolean;
        if (G.persistent) on = true;
        else if (G.leaveInPx) {
          o = range(pos, G.leave[0], G.leave[1]);
          on = o < 1;
        } else {
          on = k >= 0 && k <= 1;
          o = on ? range(k, G.leave[0], G.leave[1]) : 1;
          if (o >= 1) on = false;
        }
        const vis = on ? 'v' : 'h';
        if (vis !== G.el.dataset.vis) {
          G.el.dataset.vis = vis;
          G.el.style.visibility = on ? 'visible' : 'hidden';
          G.el.style.setProperty('--lv', on ? 'visible' : 'hidden');
        }
        if (!on) continue;
        if (!G.persistent) visible.push(G);
        if (!G.persistent) {
          const op = (1 - o).toFixed(2);
          if (G.el.style.opacity !== op) G.el.style.opacity = op;
        }
        const pe = !G.persistent && o > 0.4 ? 'none' : '';
        if (G.el.style.pointerEvents !== pe) G.el.style.pointerEvents = pe;

        // block wipes and count up
        for (const W of G.wipes) {
          const p = clamp01((u - W.order * stagger) / dur);
          const key = String(Math.round(p * 240));
          if (key !== W.last) {
            W.last = key;
            const w = wipeAt(p);
            W.el.style.setProperty('--bx', `${w.bx.toFixed(1)}%`);
            W.el.style.setProperty('--tv', w.shown ? 'inherit' : 'hidden');
          }
          if (!Number.isNaN(W.target)) {
            const cs = W.order * stagger + dur * 0.35;
            const cp = clamp01((u - cs) / Math.max(20, COUNT_DONE * len - cs));
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
        // Prodaja, the tabs step with k until the visitor picks one
        if (G.id === 'P' && G.tabs && !G.tabs.hasAttribute('data-pick')) {
          const step = Math.min(3, Math.max(0, Math.floor((k - 0.05) / 0.11)));
          if (G.tabs.getAttribute('data-tab') !== String(step)) setTab(G.tabs, step);
        }
      }

      // the grid, hidden behind the boxes that are on screen
      const key = visible.map((g) => g.id).join();
      if (key !== lastMask) {
        lastMask = key;
        const m = maskStyle([...fixedRects, ...visible.flatMap((g) => g.rects)]);
        lines.style.maskImage = m.image;
        lines.style.maskSize = m.size;
        lines.style.maskPosition = m.pos;
        lines.style.maskRepeat = m.repeat;
        lines.style.maskComposite = m.comp;
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

      // counter and progress line on the right edge
      const prog = Math.round(clamp01(pos / LENGTH) * 2000) / 2000;
      if (prog !== lastProg) {
        lastProg = prog;
        hf.style.setProperty('--prog', String(prog));
      }
      const [, c, cName] = COUNTER.find(([s]) => pos >= s)!;
      if (c !== lastCounter) {
        lastCounter = c;
        const now = hf.querySelector('.hf-now');
        if (now) now.textContent = c;
        const nm = hf.querySelector('.hf-name');
        if (nm) nm.textContent = cName;
      }

      // dark span, the grid and the frame turn white and the logos leave, the Linde logo is banned on dark grey
      const dark = tone === 'dark' || darkTop.some(([a, b]) => pos >= a && pos < b);
      const t = dark ? 'white' : 'ink';
      if (t !== lastTone) {
        lastTone = t;
        hf.dataset.tone = t;
        hf.dataset.toneBottom = t;
        hf.dataset.logos = dark ? 'off' : 'on';
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
  // it never sits on a spec row, a figure or the footer copyright.
  useEffect(() => {
    const root = document.documentElement;
    const on = () => {
      const next = document.querySelector<HTMLElement>('[data-after-story]');
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

  // With reduced motion each hold is a still screen, the grid is hidden behind its boxes once, after the fonts load.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!reduced) return;
    const root = rootRef.current;
    if (!root) return;
    const run = () => {
      root.querySelectorAll<HTMLElement>('.s2-still').forEach((sec) => {
        const g = sec.querySelector<HTMLElement>('.s2-lines');
        if (!g) return;
        const rects = Array.from(sec.querySelectorAll<HTMLElement>('[data-mask]')).map((e) => boxIn(e, sec));
        const m = maskStyle(rects);
        g.style.maskImage = m.image;
        g.style.maskSize = m.size;
        g.style.maskPosition = m.pos;
        g.style.maskRepeat = m.repeat;
        g.style.maskComposite = m.comp;
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
        <Statement />
        <Products />
        <Clients />
        <Closing />
        <Footer />
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
      <Statement />
      <Products />
      <Clients />
      <Closing />
      <Footer />
    </div>
  );
}

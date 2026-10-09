// The shared shell for storyline 2. It pins the stage with the story clock, mounts one scene behind it,
// puts the shared hero frame over it and lays the text of each hold beat into the open space the scene
// leaves. After the pinned stage come the products range and the footer as normal sections. With reduced
// motion there is no pin, each hold beat is a still section with its text beside a still of the scene.
// Text rises in as its beat starts and leaves as it ends, nothing but the top row stays between holds.
import { Suspense, useEffect, useMemo, useRef, type ComponentType, type ReactNode } from 'react';
import { stillClock, useStoryClock, type SceneProps } from '../clock';
import { TIMELINE } from '../timeline';
import { HeroFrame } from '../../ui/HeroFrame';
import { ATPane, C1Pane, NPane, PPane, RPane, SPane } from './panes';
import { Footer, Products } from './sections';
import './shell.css';

export type Tone = 'light' | 'dark';

type LayerDef = { id: string; Pane: () => ReactNode; dark: boolean; still: number };

// Every hold beat but H, whose text is the shared hero frame. dark marks the beats whose ground is dark in
// the light versions. still is the keyframe the reduced motion section shows.
const LAYERS: LayerDef[] = [
  { id: 'C1', Pane: C1Pane, dark: false, still: 0.5 },
  { id: 'R', Pane: RPane, dark: false, still: 0.5 },
  { id: 'P', Pane: PPane, dark: false, still: 0.95 },
  { id: 'S', Pane: SPane, dark: true, still: 0.5 },
  { id: 'N', Pane: NPane, dark: false, still: 0.95 },
  { id: 'AT', Pane: ATPane, dark: true, still: 0.5 },
];

// Where the text leaves, as a share of its beat. P keeps its text through the first half, then lets the
// warehouse reveal take over.
const LEAVE: Record<string, [number, number]> = { P: [0.44, 0.7], AT: [1.01, 1.02] };
const LEAVE_DEFAULT: [number, number] = [0.86, 1];

// Story pixels where the ground under the top row is dark in the light versions, the black push at the end
// of the warehouse, the blueprint and the fork lift, then the dark floor of the last chapter.
const DARK_TOP: [number, number][] = [
  [7790, 9525],
  [10790, 13000],
];

const range = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const out3 = (t: number) => 1 - Math.pow(1 - t, 3);

const ink = (tone: Tone, dark: boolean) => (tone === 'dark' || dark ? 'dark' : 'light');

function mountScene(Scene: ComponentType<SceneProps>, clock: SceneProps['clock']) {
  return (
    <Suspense fallback={null}>
      <Scene clock={clock} />
    </Suspense>
  );
}

export function StoryShell({ Scene, tone, reduced }: { Scene: ComponentType<SceneProps>; tone: Tone; reduced: boolean }) {
  const { stageRef, clock } = useStoryClock(reduced);
  const heroRef = useRef<HTMLDivElement>(null);
  const stills = useMemo(() => LAYERS.map((l) => stillClock(TIMELINE.findIndex((b) => b.id === l.id), l.still)), []);
  const heroStill = useMemo(() => stillClock(0, 0.5), []);
  const frameTone = tone === 'dark' ? 'white' : 'ink';

  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    const hf = heroRef.current;
    if (!stage || !hf) return;
    const layers = Array.from(stage.querySelectorAll<HTMLElement>('[data-layer]')).map((el) => {
      const span = TIMELINE.find((b) => b.id === el.dataset.layer)!;
      return { el, span, leave: LEAVE[span.id] ?? LEAVE_DEFAULT, items: Array.from(el.querySelectorAll<HTMLElement>('[data-rise]')), last: '' };
    });
    const heroBottom = hf.querySelector<HTMLElement>('.hf-bottom');
    let lastTone = '';
    let lastHero = -1;
    let id = 0;
    const loop = () => {
      const pos = clock.pos.current;
      for (const L of layers) {
        const k = (pos - L.span.start) / (L.span.end - L.span.start);
        const on = k >= 0 && k <= 1;
        const o = on ? range(k, L.leave[0], L.leave[1]) : 1;
        const key = on ? `${Math.round(k * 4000)}` : 'off';
        if (key === L.last) continue;
        L.last = key;
        if (!on || o >= 1) {
          L.el.style.visibility = 'hidden';
          continue;
        }
        L.el.style.visibility = 'visible';
        L.items.forEach((it, i) => {
          const a = out3(range(k, i * 0.026, 0.13 + i * 0.026));
          const op = a * (1 - o);
          it.style.opacity = op.toFixed(3);
          it.style.transform = `translateY(${((1 - a) * 30 - o * 22).toFixed(1)}px)`;
          it.style.pointerEvents = op > 0.6 ? 'auto' : 'none';
        });
      }
      if (heroBottom) {
        const h = 1 - out3(range(pos, 500, 780));
        const r = Math.round(h * 500);
        if (r !== lastHero) {
          lastHero = r;
          heroBottom.style.opacity = h.toFixed(3);
          heroBottom.style.transform = `translateY(${((1 - h) * -26).toFixed(1)}px)`;
          heroBottom.style.visibility = h < 0.01 ? 'hidden' : 'visible';
        }
      }
      const dark = tone === 'dark' || DARK_TOP.some(([a, b]) => pos >= a && pos < b);
      const t = dark ? 'white' : 'ink';
      if (t !== lastTone) {
        lastTone = t;
        hf.dataset.tone = t;
        hf.dataset.toneBottom = t;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [reduced, clock, stageRef, tone]);

  if (reduced) {
    return (
      <div className="s2" data-tone={tone}>
        <section className="s2-hero-still" aria-label="Ekotehnika, Linde viljuškari">
          <div className="s2-scene" aria-hidden="true">
            {mountScene(Scene, heroStill)}
          </div>
          <HeroFrame tone={frameTone} rootRef={heroRef} />
        </section>
        {LAYERS.map((l, i) => (
          <section className="s2-still" data-ink={ink(tone, l.dark)} key={l.id} aria-label={l.id}>
            <div className="s2-flow">
              <l.Pane />
            </div>
            <div className="s2-still-scene" aria-hidden="true">
              {mountScene(Scene, stills[i])}
            </div>
          </section>
        ))}
        <Products />
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
        {LAYERS.map((l) => (
          <section className="s2-layer" data-layer={l.id} data-ink={ink(tone, l.dark)} key={l.id} style={{ visibility: 'hidden' }}>
            <l.Pane />
          </section>
        ))}
        <HeroFrame tone={frameTone} rootRef={heroRef} />
      </div>
      <Products />
      <Footer />
    </div>
  );
}

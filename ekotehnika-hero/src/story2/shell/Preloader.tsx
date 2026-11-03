// The preloader. Round 7 held the page on a white sheet with the two logos and an ink progress line, and Filip rejected the bar (taste
// 2026-11-03 13:17, "Something cool", "a cool interactive preloader animation for this website instead of progress bar", "you can do
// multiple versions"). Round 8 makes it an animation in the site's own language, four versions he picks by number with ?loader=N and the
// Loader row of the panel (preview.ts), 1 is the default until he picks. Each draws the same real loading and answers the mouse.
//   1 Viljuška  two Linde tines carry a pallet and a carton up the sheet as it loads, the carton turns toward the mouse, and the tines lift
//               the sheet off the page the way the L beat lifts its page (loader/Viljuska.tsx)
//   2 Nacrt     the page's own grid draws on and a truck draws itself in ink lines, a crosshair with a live coordinate follows the mouse,
//               and the lines become the page's grid (loader/Nacrt.tsx)
//   3 Paleta    a small WebGL scene of its own, cartons stack on a pallet and a fork carries it out of frame, falls back to 1 with no WebGL
//               or if its renderer cannot start (loader/Paleta.tsx)
//   4 Ruta      a dashed road draws on from the Vrčin pin and the service van drives along it, the road carries on into the hero's own road
//               (loader/Ruta.tsx)
// This file owns what they share, the numbers and the timing, and none of them has a loop of its own (loader/state.ts). Until the page is
// ready the sheet shows the version, and the page under it is already mounted, so the models, the fonts and the scene's first frame all
// load behind it. When they are in it holds the finished picture for the version's own HOLD_MS, lets go once, and the exit takes EXIT_MS,
// 650, under the 700 the brief gives. The top row, the hero text, the grid and the scene arrive as one move at the moment it lets go
// (markReveal in scenes/sistem/intro.ts, read by StoryShell). It runs once per page load. With no WebGL the scene is not waited for, and
// after LIMIT_MS it lets go whatever is still missing, so a slow network or a failed scene never holds the page. A frozen clock (?at=) and
// reduced motion get no preloader, the page is there as it always was.
//
// What the progress is made of, the fonts the page sets (0.1), the models and textures counted by three's loading manager (0.6) and the
// first frame of the scene (0.3). It only ever moves on, and it is eased so it never jumps. index.html holds a plain white sheet, so the
// first paint is not a blank page while the script loads, and this component takes it over on its first render.
import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { INTRO_SKIP, assets, introStart, markReveal } from '../scenes/sistem/intro';
import { LOADER } from '../preview';
import { EXIT_MS, HOLD_MS, newState } from './loader/state';
import { Viljuska } from './loader/Viljuska';
import { Nacrt } from './loader/Nacrt';
import { Ruta } from './loader/Ruta';
import { Readout } from './loader/Readout';
import './loader/loader.css';

// the third version is a WebGL scene of its own and is fetched only when it is the one asked for
const Paleta = lazy(() => import('./loader/Paleta').then((m) => ({ default: m.Paleta })));
// when it is the one asked for, its chunk is fetched as soon as this file runs and not when the sheet first renders
if (LOADER === 3 && typeof window !== 'undefined') void import('./loader/Paleta');

// the longest the page waits, a little under the shell's own HERO_WAIT_MS so the shell never plays its text before the sheet lifts
const LIMIT_MS = 9500;
// the shortest the sheet stays, so a cached page does not flash it
const SHOW_MS = 600;
// how long the models may still be coming after the scene has drawn, before the page goes on without them
const ASSETS_GRACE_MS = 3000;

// The keys that scroll a page. While the sheet is up the page cannot be scrolled, so the story clock stays at its start.
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp']);

let finished = false;

export function Preloader({ webgl }: { webgl: boolean }) {
  const [up, setUp] = useState(!INTRO_SKIP && !finished);
  // the third version needs WebGL and falls back to the first without it, or when its renderer fails to start
  const [version, setVersion] = useState(LOADER === 3 && !webgl ? 1 : LOADER);
  const root = useRef<HTMLDivElement>(null);
  const state = useRef(newState()).current;

  useLayoutEffect(() => {
    if (!up) return;
    document.getElementById('boot')?.remove();
    const sheet = root.current;
    if (!sheet) return;
    const t0 = performance.now();
    let fonts = false;
    // the document's own font loading, asked for the weights the page sets, so the wait is for them and not for an idle list
    Promise.all(['350', '400', '500', '700'].map((w) => document.fonts?.load(`${w} 16px "Daxline Pro"`)))
      .then(() => document.fonts?.ready)
      .catch(() => undefined)
      .then(() => {
        fonts = true;
      });

    const block = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      e.stopImmediatePropagation();
    };
    const keys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) block(e);
    };
    window.addEventListener('wheel', block, { passive: false, capture: true });
    window.addEventListener('touchmove', block, { passive: false, capture: true });
    window.addEventListener('keydown', keys, { capture: true });

    // the mouse, in px and from the centre, the versions read it eased
    let tx = state.cx;
    let ty = state.cy;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      state.moved = true;
    };
    window.addEventListener('pointermove', move, { passive: true });

    let shown = 0;
    let last = t0;
    let id = 0;
    let letGo = 0;
    let revealed = 0;
    let frame = 0;
    const tick = (now: number) => {
      const drawn = introStart() >= 0;
      if (drawn && !frame) frame = now;
      const models = !webgl || (assets.seen && !assets.active && assets.progress >= 100) || (drawn && now - frame > ASSETS_GRACE_MS);
      const ready = fonts && drawn && models && now - t0 >= SHOW_MS;
      const want = (fonts ? 0.1 : 0) + (webgl ? 0.6 * (assets.seen ? Math.min(1, assets.progress / 100) : 0) + (drawn ? 0.3 : 0) : 0.9);
      const goal = letGo ? 1 : Math.min(want, ready ? 1 : 0.97);
      // eased toward the goal at a rate per second, so a frame of any length moves the same share, and never backwards. It closes faster
      // once the loading is done, so the picture is whole when the closing move starts
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      shown = Math.max(shown, shown + (goal - shown) * (1 - Math.exp(-(letGo ? 12 : 6) * dt)));
      if (letGo && shown > 0.995) shown = 1;
      if (!letGo && (ready || now - t0 > LIMIT_MS)) letGo = now;
      // the closing move is timed from the moment the loading was done, the page is let go once the version's hold is over, and the sheet
      // is gone EXIT_MS after that
      if (letGo && !revealed && now - letGo >= (HOLD_MS[version] ?? 240)) {
        revealed = now;
        markReveal(now);
        sheet.setAttribute('data-out', '');
      }
      state.p = shown;
      state.w = window.innerWidth;
      state.h = window.innerHeight;
      state.t = (now - t0) / 1000;
      state.full = letGo ? (now - letGo) / 1000 : 0;
      state.out = revealed ? Math.min(1, (now - revealed) / EXIT_MS) : 0;
      const k = 1 - Math.exp(-9 * dt);
      state.cx += (tx - state.cx) * k;
      state.cy += (ty - state.cy) * k;
      state.mx = state.moved ? Math.max(-1, Math.min(1, (state.cx / state.w - 0.5) * 2)) : 0;
      state.my = state.moved ? Math.max(-1, Math.min(1, (state.cy / state.h - 0.5) * 2)) : 0;
      state.frames.forEach((f) => f(state, dt));
      if (state.out >= 1) {
        finished = true;
        setUp(false);
        return;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('wheel', block, { capture: true });
      window.removeEventListener('touchmove', block, { capture: true });
      window.removeEventListener('keydown', keys, { capture: true });
      window.removeEventListener('pointermove', move);
    };
  }, [up, webgl, version, state]);

  if (!up) return null;
  return (
    <div className="pl" ref={root} data-v={version} role="status" aria-live="polite">
      {version === 1 && <Viljuska state={state} />}
      {version === 2 && <Nacrt state={state} />}
      {version === 3 && (
        <Suspense
          fallback={
            <>
              <div className="pl-ground" />
              <Readout state={state} />
            </>
          }
        >
          <Paleta state={state} onFail={() => setVersion(1)} />
        </Suspense>
      )}
      {version === 4 && <Ruta state={state} />}
      <span className="sr-only">Učitavanje</span>
    </div>
  );
}

// The preloader, round 7. Filip, "this is taking a while. First the buttons come in, then this, then the whole scenery", "maybe we need
// like a content loader". Until the page is ready it shows the white ground with the Linde Material Handling box and the Ekotehnika
// wordmark as supplied, and one thin ink line that fills with the real loading, nothing else. The page under it is already mounted, so
// the models, the fonts and the scene's first frame all load behind it. When they are in it lets go once, the sheet lifts, and the top
// row, the hero text, the grid and the scene arrive as one move (markReveal in scenes/sistem/intro.ts, read by StoryShell). It runs once
// per page load. With no WebGL the scene is not waited for, and after LIMIT_MS it lets go whatever is still missing, so a slow network
// or a failed scene never holds the page. A frozen clock (?at=) and reduced motion get no preloader, the page is there as it always was.
//
// What the line is made of, the fonts the page sets (0.1), the models and textures counted by three's loading manager (0.6) and the first
// frame of the scene (0.3). It only ever moves on, and it is eased so it never jumps. index.html holds a still copy of the sheet, so the
// first paint is not a blank page while the script loads, and this component takes it over on its first render.
import { useLayoutEffect, useRef, useState } from 'react';
import { INTRO_SKIP, assets, introStart, markReveal } from '../scenes/sistem/intro';

// the longest the page waits, a little under the shell's own HERO_WAIT_MS so the shell never plays its text before the sheet lifts
const LIMIT_MS = 9500;
// the shortest the sheet stays, so a cached page does not flash it
const SHOW_MS = 600;
// how long the models may still be coming after the scene has drawn, before the page goes on without them
const ASSETS_GRACE_MS = 3000;
// the line stays full this long before the sheet lifts, and the lift takes LIFT_MS (.pl in shell.css)
const FULL_MS = 220;
const LIFT_MS = 700;

// The keys that scroll a page. While the sheet is up the page cannot be scrolled, so the story clock stays at its start.
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp']);

let finished = false;

export function Preloader({ webgl }: { webgl: boolean }) {
  const [up, setUp] = useState(!INTRO_SKIP && !finished);
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLElement>(null);

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

    let shown = 0;
    let last = t0;
    let id = 0;
    let letGo = 0;
    let out = 0;
    let frame = 0;
    const tick = (now: number) => {
      const drawn = introStart() >= 0;
      if (drawn && !frame) frame = now;
      const models = !webgl || (assets.seen && !assets.active && assets.progress >= 100) || (drawn && now - frame > ASSETS_GRACE_MS);
      const ready = fonts && drawn && models && now - t0 >= SHOW_MS;
      const want = (fonts ? 0.1 : 0) + (webgl ? 0.6 * (assets.seen ? Math.min(1, assets.progress / 100) : 0) + (drawn ? 0.3 : 0) : 0.9);
      const goal = letGo ? 1 : Math.min(want, ready ? 1 : 0.97);
      // eased toward the goal at a rate per second, so a frame of any length moves the same share, and never backwards
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      shown = Math.max(shown, shown + (goal - shown) * (1 - Math.exp(-6 * dt)));
      if (line.current) line.current.style.transform = `scaleX(${Math.min(1, shown).toFixed(3)})`;
      if (!letGo && (ready || now - t0 > LIMIT_MS)) {
        letGo = now;
        // the line fills, then the sheet lifts and the page starts arriving in the same frame
        out = window.setTimeout(() => {
          markReveal(performance.now());
          sheet.setAttribute('data-out', '');
          out = window.setTimeout(() => {
            finished = true;
            setUp(false);
          }, LIFT_MS);
        }, FULL_MS);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(out);
      window.removeEventListener('wheel', block, { capture: true });
      window.removeEventListener('touchmove', block, { capture: true });
      window.removeEventListener('keydown', keys, { capture: true });
    };
  }, [up, webgl]);

  if (!up) return null;
  return (
    <div className="pl" ref={root} role="status" aria-live="polite">
      <div className="pl-in">
        <div className="pl-logos" aria-hidden="true">
          <img src="/brand/linde-mh.svg" width={160} height={96} alt="" />
          <img src="/brand/ekotehnika.svg" width={160} height={33} alt="" />
        </div>
        <div className="pl-bar" aria-hidden="true">
          <i ref={line} />
        </div>
        <span className="sr-only">Učitavanje</span>
      </div>
    </div>
  );
}

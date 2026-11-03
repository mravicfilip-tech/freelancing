// The preloader. Round 7 held the page on a white sheet with an ink progress line and Filip rejected the bar (taste 2026-11-03 13:17). Round 8
// made four drawn and primitive loaders and he rejected those too (taste 2026-11-03 15:40, "out of style for the graphics we're using on the
// website", "use the models, use the boxes we made"). Now the loader is a mode of the story's own scene (scenes/sistem/loader.ts), three
// versions he picks by number with ?loader=N and the Loader row of the panel (preview.ts), 1 is the default until he picks.
//   1 Utovar  a close shot of the hero X50's forks and pallet, EKOTEHNIKA cartons settle onto the pallet as the loading passes eight marks, the
//             forks lift the load and the camera pulls back into the hero shot
//   2 Regal   one bay of racks with labelled loads, the reach truck lifts a pallet through the four beams as the loading goes, and the camera
//             tracks out along the aisle to the hero
//   3 Kutija  the carton alone on its pallet turning to the mouse, its bin label printing the loading, then the X50 drives in, lifts it and
//             drives on into the hero place
// This file owns what they share, the loading and the timing, and writes the numbers the scene reads (loader.state in loader.ts). The shell
// holds a plain white sheet (index.html #boot) until the first set is in, the X50 model, the environment and the fonts, and removes it in the
// same frame the scene has drawn its first frames, so no frame of the loader is an empty page. The rest of the scene loads behind the loader
// and drives its progress, the other seven models and the scene's later groups. When it is all in the loader plays its closing move, the
// hero's words and the top row start arriving at the version's REVEAL_S (markReveal in scenes/sistem/intro.ts, read by StoryShell), and the
// camera lands on the hero shot at END_S, so the page is where it always was and there is no cut. It runs once per page load. After LIMIT_MS
// it lets go whatever is still missing, so a slow network or a failed scene never holds the page. With no WebGL the two logos stand on the
// white sheet for a moment and then the page is there. A frozen clock (?at=) and reduced motion get no preloader at all.
//
// What the progress is made of, the fonts (0.04), the first set (0.06), and the rest of it, the models and textures the scene asks for after
// the first set counted by three's loading manager (0.54) and the scene's later groups mounting (0.36). It only ever moves on, and it is eased
// so it never jumps. The only interaction is the mouse, a gentle parallax of the camera or the turn of the carton, and nothing here blocks the
// page for longer than the loader plays, the wheel and the scroll keys are held so the story clock stays at its start until it has landed.
import { useLayoutEffect, useRef, useState } from 'react';
import { INTRO_SKIP, assets, introStart, markReveal } from '../scenes/sistem/intro';
import { END_S, FREEZE, LIMIT_S, REVEAL_S, STAGES, goAt, isFirst, loader, markFirst, setStage } from '../scenes/sistem/loader';
import './loader/loader.css';

// the longest the page waits, a little under the shell's own HERO_WAIT_MS so the shell never plays its text before the loader lets go
const LIMIT_MS = LIMIT_S * 1000;
// the shortest the loader stays on screen once it shows, so a cached page does not flash it and the version has time to play
const SHOW_MS = 1500;
// after the last later group has mounted, the models it asks for take a moment to be asked for, so the loading is only called done after this
const SETTLE_MS = 500;
// the plain sheet of a page with no WebGL stays this long over the two logos
const PLAIN_MS = 900;

// The keys that scroll a page. While the loader plays the page cannot be scrolled, so the story clock stays at its start.
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp']);

let finished = false;

export function Preloader({ webgl }: { webgl: boolean }) {
  const [up, setUp] = useState(!INTRO_SKIP && !finished);
  const root = useRef<HTMLDivElement>(null);
  const read = useRef<HTMLParagraphElement>(null);
  const figure = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!up) return;
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

    // the mouse from the centre of the window, -1 to 1, the scene reads it eased
    let tx = 0;
    let ty = 0;
    let moved = false;
    const move = (e: PointerEvent) => {
      tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2));
      moved = true;
    };
    window.addEventListener('pointermove', move, { passive: true });

    const done = () => {
      finished = true;
      loader.live = false;
      setStage(STAGES);
      setUp(false);
    };
    // the white sheet of index.html comes off in the frame the loader, or the page, is ready to show
    const lift = () => document.getElementById('boot')?.remove();

    let shown = 0;
    let last = t0;
    let id = 0;
    let tShow = 0;
    let stageDone = 0;
    let l0 = 0;
    let letGo = 0;
    let revealed = false;
    let figureNow = -1;

    // no WebGL, there is no scene to wait for, the logos on the white sheet and then the page
    if (!webgl) {
      lift();
      sheet.setAttribute('data-plain', '');
      loader.live = false;
      markFirst();
      setStage(STAGES);
      const wait = () => {
        const now = performance.now();
        if (fonts && now - t0 >= PLAIN_MS) {
          markReveal(now);
          done();
          return;
        }
        id = requestAnimationFrame(wait);
      };
      id = requestAnimationFrame(wait);
    } else {
      const tick = (now: number) => {
        const dt = Math.min(0.5, (now - last) / 1000);
        last = now;
        // the canvas failed as it started, the page goes on without the loader
        const failed = introStart() >= 0 && !loader.env;
        const first = isFirst() || (fonts && loader.env && loader.x50 && loader.frames >= 3);
        if (first && !tShow) {
          markFirst();
          tShow = now;
          l0 = assets.loaded;
          lift();
          sheet.setAttribute('data-on', '');
        }
        // out of time, or no scene, let go with whatever is in. The loader never shows if the first set did not arrive in time
        if (failed || (!letGo && now - t0 > LIMIT_MS)) {
          if (!tShow) {
            lift();
            loader.live = false;
            markFirst();
            markReveal(now);
            done();
            return;
          }
          if (!letGo) letGo = now;
        }
        if (tShow) {
          if (loader.mounted >= STAGES && !stageDone) stageDone = now;
          const rest = loader.mounted >= STAGES && !assets.active && now - stageDone >= SETTLE_MS ? 1 : assets.total > l0 ? Math.min(1, Math.max(0, (assets.loaded - l0) / (assets.total - l0))) : 0;
          const want = (fonts ? 0.04 : 0) + 0.06 + 0.54 * rest + 0.36 * (loader.mounted / STAGES);
          const ready = fonts && stageDone > 0 && rest >= 1 && now - tShow >= SHOW_MS;
          if (!letGo && ready && !FREEZE) letGo = now;
          const goal = letGo ? 1 : Math.min(want, 0.97);
          // eased toward the goal at a rate per second, so a frame of any length moves the same share, and never backwards. It closes faster
          // once the loading is done, so the picture is whole when the closing move starts
          shown = Math.max(shown, shown + (goal - shown) * (1 - Math.exp(-(letGo ? 12 : 4) * dt)));
          if (letGo && shown > 0.995) shown = 1;
          loader.t = FREEZE && FREEZE.t !== null ? FREEZE.t : (now - tShow) / 1000;
          loader.p = FREEZE ? FREEZE.p : shown;
          // the closing move is timed from the moment the loading is whole, shown has reached 1
          const whole = letGo && shown >= 1 ? (now - letGo) / 1000 : -1;
          loader.full = FREEZE ? FREEZE.full : whole;
          loader.go = loader.full >= 0 ? goAt(loader.version, loader.full) : 0;
          if (loader.full >= 0 && !revealed && loader.full >= (REVEAL_S[loader.version] ?? 0.5)) {
            revealed = true;
            markReveal(now);
          }
          const k = 1 - Math.exp(-6 * dt);
          loader.mx = FREEZE ? FREEZE.mx : loader.mx + ((moved ? tx : 0) - loader.mx) * k;
          loader.my = FREEZE ? FREEZE.my : loader.my + ((moved ? ty : 0) - loader.my) * k;
          // the share loaded, at the foot of the left column where the page's own coordinate label stands, written when the whole number changes
          const n = Math.round(Math.min(1, loader.p) * 100);
          if (n !== figureNow && figure.current) {
            figureNow = n;
            figure.current.textContent = String(n);
          }
          if (read.current) read.current.style.opacity = loader.go > 0 ? String(Math.max(0, 1 - loader.go * 4)) : '';
          if (!FREEZE && loader.full >= (END_S[loader.version] ?? 1.8)) {
            loader.go = 1;
            done();
            return;
          }
        }
        id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('wheel', block, { capture: true });
      window.removeEventListener('touchmove', block, { capture: true });
      window.removeEventListener('keydown', keys, { capture: true });
      window.removeEventListener('pointermove', move);
    };
  }, [up, webgl]);

  if (!up) return null;
  return (
    <div className="pl" ref={root} data-v={loader.version} role="status" aria-live="polite">
      {/* the loading figure of the versions that have no label of their own, Kutija prints its figure on the carton */}
      {loader.version !== 3 && (
        <p className="pl-read" ref={read} aria-hidden="true">
          <span>Učitavanje</span>
          <span ref={figure}>0</span>
          <span>%</span>
        </p>
      )}
      {/* a page with no WebGL shows the two logos as supplied on the white sheet, in the page's own top row markup so they stand where the page's own do */}
      <div className="pl-logos" aria-hidden="true">
        <div className="hf-top">
          <span className="hf-logo">
            <img src="/brand/linde-mh.svg" width={160} height={96} alt="" />
            <span className="hf-wm">
              <img className="wm-ink" src="/brand/ekotehnika.svg" width={160} height={33} alt="" />
            </span>
          </span>
        </div>
      </div>
      <span className="sr-only">Učitavanje</span>
    </div>
  );
}

// The switcher Filip compares the scroll with, a small fixed box at the bottom right with one row of buttons, 6 Lock fast and 9 Anchors,
// Filip 5 November, "add two scroll variants back, Lock Fast 6 and the Anchors number 9". A click writes ?feel into the URL and reloads, since
// the clock reads the feel once, after saving the beat and k the page was on so it lands on the same frame (preview.ts). It shows on the dev
// server or with ?preview in the URL, and renders nothing on a production page without it. A screen held upright has its own pathway, ?m,
// which the feel does not touch, so the box is not shown there, see shell.css.
import type { StoryClock } from '../clock';
import { TIMELINE } from '../timeline';
import { FEEL, FEELS, PREVIEW, saveReturn } from '../preview';

export function Preview({ clock }: { clock: StoryClock }) {
  if (!PREVIEW) return null;
  const choose = (feel: number) => {
    if (feel === FEEL) return;
    const b = TIMELINE[clock.beat.current];
    if (b) saveReturn({ id: b.id, k: clock.k.current });
    const url = new URL(window.location.href);
    url.searchParams.set('feel', String(feel));
    window.location.assign(url.toString());
  };
  return (
    <div className="pv" aria-label="Preview">
      <span>Scroll</span>
      <div className="pv-row" role="group" aria-label="Scroll">
        {FEELS.map(([n, name]) => (
          <button type="button" key={n} aria-pressed={n === FEEL} onClick={() => choose(n)}>
            {`${n} ${name}`}
          </button>
        ))}
      </div>
    </div>
  );
}

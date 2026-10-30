// The panel Filip picks with on localhost, a small fixed square at the bottom right with two rows of buttons. Scroll is the feel of the
// story clock, 0 Today, 1 to 3 from a low speed cap to a high one, and 4 to 6 the lock, which holds the page to the clock. Najam is 0 Today, production's grid of forklifts, and 1 Close,
// 2 Aisle end and 3 Wide, the three cameras of the warehouse story. A click writes ?feel and ?najam into the URL and reloads, since the
// spans of the story change with the choice, after saving the beat and k the page was on so it lands on the same frame (preview.ts).
// It shows on the dev server, which is what npm run live runs, or with ?preview in the URL, and renders nothing on a production page.
import type { StoryClock } from '../clock';
import { TIMELINE } from '../timeline';
import { FEEL, FEELS, NAJAM, NAJAMS, PREVIEW, saveReturn } from '../preview';

const label = (i: number, names: string[]) => (i === 0 || names[i].length > 1 ? `${i} ${names[i]}` : names[i]);

export function Preview({ clock }: { clock?: StoryClock }) {
  if (!PREVIEW) return null;
  const choose = (feel: number, najam: number) => {
    if (feel === FEEL && najam === NAJAM) return;
    if (clock) {
      const b = TIMELINE[clock.beat.current];
      if (b) saveReturn({ id: b.id, k: clock.k.current });
    }
    const url = new URL(window.location.href);
    url.searchParams.set('feel', String(feel));
    url.searchParams.set('najam', String(najam));
    window.location.assign(url.toString());
  };
  const row = (name: string, now: number, names: string[], set: (i: number) => void) => (
    <>
      <span>{name}</span>
      <div className="pv-row" role="group" aria-label={name}>
        {names.map((_, i) => (
          <button type="button" key={i} aria-pressed={i === now} onClick={() => set(i)}>
            {label(i, names)}
          </button>
        ))}
      </div>
    </>
  );
  return (
    <div className="pv" aria-label="Preview">
      {row('Scroll', FEEL, FEELS, (i) => choose(i, NAJAM))}
      {row('Najam', NAJAM, NAJAMS, (i) => choose(FEEL, i))}
    </div>
  );
}

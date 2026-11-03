// The panel Filip picks with on localhost, a small fixed square at the bottom right with three rows of buttons. Scroll is the feel of the
// story clock, 0 Today, 1 to 3 from a low speed cap to a high one, 4 to 6 the lock, which holds the page to the clock, and 7 Stops, the lock
// with a stop at every section. Najam is 0 Today, production's grid of forklifts, and 2 New, the warehouse story of round 6. Loader is the
// preloader that plays on load, 1 Utovar, 2 Regal and 3 Kutija. A click writes ?feel, ?najam and ?loader into the URL and reloads,
// since the spans of the story change with the choice, after saving the beat and k the page was on so it lands on the same frame
// (preview.ts). A click on the loader that is already picked reloads too, so the preloader plays again.
// It shows on the dev server, which is what npm run live runs, or with ?preview in the URL, and renders nothing on a production page.
import type { StoryClock } from '../clock';
import { TIMELINE } from '../timeline';
import { FEEL, FEELS, LOADER, LOADERS, NAJAM, NAJAMS, PREVIEW, saveReturn } from '../preview';

const label = (i: number, name: string) => (i === 0 || name.length > 1 ? `${i} ${name}` : name);

export function Preview({ clock }: { clock?: StoryClock }) {
  if (!PREVIEW) return null;
  const choose = (feel: number, najam: number, loader: number, replay = false) => {
    if (feel === FEEL && najam === NAJAM && loader === LOADER && !replay) return;
    if (clock) {
      const b = TIMELINE[clock.beat.current];
      if (b) saveReturn({ id: b.id, k: clock.k.current });
    }
    const url = new URL(window.location.href);
    url.searchParams.set('feel', String(feel));
    url.searchParams.set('najam', String(najam));
    url.searchParams.set('loader', String(loader));
    window.location.assign(url.toString());
  };
  const row = (name: string, now: number, choices: [number, string][], set: (i: number) => void) => (
    <>
      <span>{name}</span>
      <div className="pv-row" role="group" aria-label={name}>
        {choices.map(([i, text]) => (
          <button type="button" key={i} aria-pressed={i === now} onClick={() => set(i)}>
            {label(i, text)}
          </button>
        ))}
      </div>
    </>
  );
  return (
    <div className="pv" aria-label="Preview">
      {row('Scroll', FEEL, FEELS.map((f, i) => [i, f] as [number, string]), (i) => choose(i, NAJAM, LOADER))}
      {row('Najam', NAJAM, NAJAMS, (i) => choose(FEEL, i, LOADER))}
      {row('Loader', LOADER, LOADERS, (i) => choose(FEEL, NAJAM, i, true))}
    </div>
  );
}

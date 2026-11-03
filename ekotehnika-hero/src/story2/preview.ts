// The things Filip picks on localhost, read once from the URL and shared by the scroll clock, the shell and the scene.
//   ?feel=N   how the story clock follows the scroll, 4 Lock slow, 5 Lock and 6 Lock fast cap the clock and hold the page to it, and
//             7 Stops is Lock 5 with a stop at every section, so holding the wheel parks the clock where the words of a section have
//             arrived. 7 is the default. Filip kept these four in round 8, 0 to 3 are off the panel and the URL. 8 Anchors carries the
//             clock from stop to stop, one gesture a trip, the client's ticket of 3 November. 9 Glide eases each trip in and out, 10 Magnet
//             scrolls freely and settles on the next stop (scroll/useScrollStory.ts, story2/stops.ts)
//   ?najam=N  which Najam, 2 is the warehouse story Filip picked in round 8 and the default, 0 is the old grid of forklifts, kept
//             reachable by URL only (timeline.ts, scenes/sistem/najamplan.ts)
//   ?loader=N which preloader plays on load, 1 Utovar, 2 Regal and 3 Kutija, all three the story's own scene (scenes/sistem/loader.ts), 1 is
//             the default until Filip picks (shell/Preloader.tsx)
//             The text of the panes has no switch any more, Fade is the one animation (shell/reveal.ts, Filip, round 8)
// The panel that sets them (shell/Preview.tsx) shows on the dev server, which is what npm run live runs, or with ?preview in the URL.
// Without either the page behaves as the defaults say. Kept free of react and three so every module can import it.
const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
const pick = (name: string, fallback: number, allowed: number[]) => {
  const n = Number(params.get(name) ?? fallback);
  return allowed.includes(n) ? n : fallback;
};

export const FEEL = pick('feel', 7, [4, 5, 6, 7, 8, 9, 10]);
export const LOADER = pick('loader', 1, [1, 2, 3]);
export const NAJAM = pick('najam', 2, [0, 2]);
export const PREVIEW = Boolean(import.meta.env.DEV) || params.has('preview');

export const FEELS = ['Today', '1', '2', '3', 'Lock slow', 'Lock', 'Lock fast', 'Stops', 'Anchors', 'Glide', 'Magnet'];
// the preloaders the panel offers, by their number in the URL
export const LOADERS: [number, string][] = [[1, 'Utovar'], [2, 'Regal'], [3, 'Kutija']];

// Where the story was when a switch reloaded the page, a beat id and k of that beat, so the page can land on the same frame
// whatever the spans of the new choice are. Taken once, at load.
const KEY = 'story2-return';
export type Return = { id: string; k: number };
export const RETURN: Return | null = (() => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    const r = raw ? (JSON.parse(raw) as Return) : null;
    return r && typeof r.id === 'string' && Number.isFinite(r.k) ? r : null;
  } catch {
    return null;
  }
})();

export const saveReturn = (r: Return) => {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    // a browser that will not store it just lands on the top
  }
};

// The settings of the story, read once from the URL and shared by the scroll clock, the shell and the scene. Filip picked them on
// 4 November ("Go with lock fast (6) and number 3 loader", "Remove the picker then"), and on 5 November brought two scroll feels back on the
// switcher, "add two scroll variants back, Lock Fast 6 and the Anchors number 9" (shell/Preview.tsx).
//   ?feel=N   how the story clock follows the scroll. 6 Lock fast is the default, the clock capped at 1800 story px a second and the page
//             held to it. 9 is Anchors with each trip eased in and out, a gesture carries the clock to the next stop. The switcher offers
//             these two. 4 Lock slow, 5 Lock, 7 Stops, 8 Anchors without the ease and 10 Magnet stay reachable by URL. A touch screen
//             moves by its own pathway, ?m below (scroll/useScrollStory.ts, story2/stops.ts)
//   ?najam=N  which Najam, 2 is the warehouse story Filip picked in round 8 and the default, 0 is the old grid of forklifts, kept
//             reachable by URL only (timeline.ts, scenes/sistem/najamplan.ts)
//   ?loader=N which preloader plays on load, 1 Utovar, 2 Regal and 3 Kutija, all three the story's own scene (scenes/sistem/loader.ts), 3 is
//             the default, Filip's pick of 3 November, "go with option 3 for preloader" (shell/Preloader.tsx)
//             The text of the panes has no switch any more, Fade is the one animation (shell/reveal.ts, Filip, round 8)
// Kept free of react and three so every module can import it.
const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
const pick = (name: string, fallback: number, allowed: number[]) => {
  const n = Number(params.get(name) ?? fallback);
  return allowed.includes(n) ? n : fallback;
};

export const FEEL = pick('feel', 6, [4, 5, 6, 7, 8, 9, 10]);
export const LOADER = pick('loader', 3, [1, 2, 3]);
export const NAJAM = pick('najam', 2, [0, 2]);
// The switcher shows on the dev server, which is what npm run live runs, or with ?preview in the URL. Without either the page is the defaults.
export const PREVIEW = Boolean(import.meta.env.DEV) || params.has('preview');
// the feels the switcher offers, by their number in the URL
export const FEELS: [number, string][] = [[6, 'Lock fast'], [9, 'Anchors']];
// ?m=N, the phone pathway, how a screen held upright moves through the story, Filip 4 November, "Can we iterate on multiple pathways for
// scroll". 1 Stops, a swipe glides to the next stop and the words come in once it lands, the one on production. 2 Free, the finger moves
// the story and it settles on the next stop when the finger lets go. 3 Column, the scene stays in the top half and the words of every section
// scroll under it as one column, the scene gliding to the section being read. 4 Tap, a tap on the right of the scene or a swipe goes on, a
// tap on the left goes back, a bar of segments at the top shows the stops. Briefs/mobile/round3.md. A screen held upright only.
// 2 Free is the default, Filip 4 November, "let me see v2 on production just that". The others answer to ?m for testing only.
export const MSCROLL = pick('m', 2, [1, 2, 3, 4]);

// Where the story was, a beat id and k of that beat, put in session storage by the switcher or a test so the page lands on that frame,
// whatever the spans of the new feel are. Taken once, at load.
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

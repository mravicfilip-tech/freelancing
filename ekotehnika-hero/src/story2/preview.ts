// The settings of the story, read once from the URL and shared by the scroll clock, the shell and the scene. Filip picked them and the
// switcher panel is gone (4 November, "Go with lock fast (6) and number 3 loader", "Remove the picker then"). The URL still takes the
// others, for testing only, nothing on the page offers them.
//   ?feel=N   how the story clock follows the scroll. 6 Lock fast is the default, the clock capped at 1800 story px a second and the page
//             held to it. 4 Lock slow, 5 Lock, 7 Stops, 8 Anchors, 9 Glide and 10 Magnet stay reachable by URL. A touch screen moves by
//             anchors in every feel (scroll/useScrollStory.ts, story2/stops.ts)
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
// ?m=N, the phone pathway, how a screen held upright moves through the story, Filip 4 November, "Can we iterate on multiple pathways for
// scroll". 1 Stops, a swipe glides to the next stop and the words come in once it lands, the one on production. 2 Free, the finger moves
// the story and it settles on the next stop when the finger lets go. 3 Column, the scene stays in the top half and the words of every section
// scroll under it as one column, the scene gliding to the section being read. 4 Tap, a tap on the right of the scene or a swipe goes on, a
// tap on the left goes back, a bar of segments at the top shows the stops. Briefs/mobile/round3.md. A screen held upright only.
export const MSCROLL = pick('m', 1, [1, 2, 3, 4]);

// Where the story was, a beat id and k of that beat, put in session storage by a test so the page lands on that frame. Taken once, at load.
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

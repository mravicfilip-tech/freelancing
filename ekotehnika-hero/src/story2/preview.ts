// The two things Filip picks on localhost, read once from the URL and shared by the scroll clock, the shell and the scene.
//   ?feel=N   how the story clock follows the scroll, 0 Today, 1, 2 and 3, 2 is the default (scroll/useScrollStory.ts)
//   ?najam=N  which Najam, 0 Today is production's grid of forklifts, 1 Close, 2 Aisle end and 3 Wide are the warehouse story of
//             round 6 with three cameras for its third beat (timeline.ts, scenes/sistem/najamplan.ts)
// The panel that sets them (shell/Preview.tsx) shows on the dev server, which is what npm run live runs, or with ?preview in the URL.
// Without either the page behaves as the defaults say. Kept free of react and three so every module can import it.
const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
const pick = (name: string, fallback: number) => {
  const n = Number(params.get(name) ?? fallback);
  return Number.isInteger(n) && n >= 0 && n <= 3 ? n : fallback;
};

export const FEEL = pick('feel', 2);
export const NAJAM = pick('najam', 0);
export const PREVIEW = Boolean(import.meta.env.DEV) || params.has('preview');

export const FEELS = ['Today', '1', '2', '3'];
export const NAJAMS = ['Today', 'Close', 'Aisle end', 'Wide'];

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

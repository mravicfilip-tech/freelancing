// Board picks that are still open. A query key such as ?btn=3 or ?nav=2 previews one option on any
// variant page and is remembered for the browser tab, so the switcher can walk every variant with it.
// 0 is the Base, the round 3 treatment the options compete with. Once Filip picks, the default
// below changes to his number and the board pages leave.

export const PICK_DEFAULTS = { btn: 1, nav: 1 } as const;
export const PICK_COUNTS = { btn: 5, nav: 4 } as const;
export type PickKey = keyof typeof PICK_DEFAULTS;

export function kitPick(key: PickKey): number {
  const max = PICK_COUNTS[key];
  const valid = (v: string | null) => {
    const n = Number(v);
    return v !== null && v !== '' && Number.isInteger(n) && n >= 0 && n <= max ? n : null;
  };
  if (typeof window === 'undefined') return PICK_DEFAULTS[key];
  const fromUrl = valid(new URLSearchParams(window.location.search).get(key));
  try {
    if (fromUrl !== null) sessionStorage.setItem(`kit-pick-${key}`, String(fromUrl));
    return fromUrl ?? valid(sessionStorage.getItem(`kit-pick-${key}`)) ?? PICK_DEFAULTS[key];
  } catch {
    return fromUrl ?? PICK_DEFAULTS[key];
  }
}

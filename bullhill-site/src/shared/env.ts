// The public build, `npm run build:public`, sets VITE_PUBLIC in vite.config.ts. Under it the review switches
// in the URL are off, so a visitor sees the defaults whatever the address carries. `npm run dev` keeps them all.
export const PUBLIC = import.meta.env.VITE_PUBLIC === '1';

// A review switch from the URL, null in the public build. The language is not a switch, lang.ts reads it.
export function param(key: string): string | null {
  if (PUBLIC || typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

// Line icons for the story shell, 24 unit grid, drawn with the current colour. The nav set follows
// src/ui/Nav.tsx, copied here so the shared nav stays as it is.
import type { JSX } from 'react';

const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const ICONS: Record<string, JSX.Element> = {
  Početna: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  Novi: (
    <>
      <path d="M3.5 17V10.5h5.5l1.8-3H14V17" />
      <path d="M17.5 4v13.5M17.5 15.5h3.5" />
      <circle cx="6.5" cy="18.5" r="1.7" />
      <circle cx="12" cy="18.5" r="1.7" />
    </>
  ),
  Polovni: (
    <>
      <path d="M12 3.5l7 2.6v5.2c0 4.3-2.9 7.7-7 9.2-4.1-1.5-7-4.9-7-9.2V6.1z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  Najam: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" />
      <path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  Servis: <path d="M14.6 5.2a4.2 4.2 0 0 0-5.1 5.4L4.4 15.7a2 2 0 0 0 2.9 2.9l5.1-5.1a4.2 4.2 0 0 0 5.4-5.1l-2.6 2.6-2.4-.5-.5-2.4z" />,
  Kontakt: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  // The stats row of theme B.
  since: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5" />
      <path d="M15.5 6a3 3 0 0 1 0 5.6M17.5 14.4c1.7.6 2.7 2.1 3 4.6" />
    </>
  ),
  arrow: <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />,
  tick: <path d="M5 12.5l4.2 4.2L19 7" />,
};

export function Ico({ name, size = 22, sw }: { name: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...P} strokeWidth={sw ?? P.strokeWidth} aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

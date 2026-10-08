import type { JSX } from 'react';
import type { PillarId } from '../content';

type P = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export const Mail = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M3.5 6l8.5 7 8.5-7" />
  </svg>
);

export const Phone = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
  </svg>
);

export const Mobile = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <rect x="7" y="2.5" width="10" height="19" rx="1.5" />
    <path d="M11 18.5h2" />
  </svg>
);

export const Search = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />
  </svg>
);

export const Arrow = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Calendar = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

export const Users = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.4a6.5 6.5 0 0 1 3.5 5.6" />
  </svg>
);

export const Badge = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M12 2.8l7.5 3v6c0 4.6-3.2 8-7.5 9.4-4.3-1.4-7.5-4.8-7.5-9.4v-6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </svg>
);

export const Van = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M2.5 6.5h11v10h-11zM13.5 9.5h4l3.5 3.5v3.5h-7.5" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

const pillarPaths: Record<PillarId, JSX.Element> = {
  novi: (
    <>
      <path d="M3 18.5h11V11H8.5L6.5 6H4v12.5" />
      <path d="M17 4v14.5M17 18.5h4.5" />
      <circle cx="6" cy="19.5" r="1.5" />
      <circle cx="12" cy="19.5" r="1.5" />
    </>
  ),
  najam: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4l2.8 1.8M5 4.5L3 6.5M19 4.5l2 2" />
    </>
  ),
  servis: <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.6-.4-.4-2.6z" />,
  polovni: (
    <>
      <path d="M12 2.8l7.5 3v6c0 4.6-3.2 8-7.5 9.4-4.3-1.4-7.5-4.8-7.5-9.4v-6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
};

export const PillarIcon = ({ id, size = 26 }: P & { id: PillarId }) => <svg {...base(size)}>{pillarPaths[id]}</svg>;

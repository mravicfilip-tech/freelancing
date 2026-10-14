// Small line icons, 20 box, 1.5 stroke, decorative unless the parent labels them.
const P: Record<string, string> = {
  arrow: 'M4 10h12M11 5l5 5-5 5',
  'arrow-left': 'M16 10H4M9 5l-5 5 5 5',
  'arrow-up': 'M10 16V4M5 9l5-5 5 5',
  close: 'M5 5l10 10M15 5L5 15',
  menu: 'M3 6h14M3 10h14M3 14h14',
  phone: 'M5.5 3h2.2l1.3 3.4-1.6 1.2a9 9 0 004 4l1.2-1.6L16 11.3v2.2A2.5 2.5 0 0113.5 16 10.5 10.5 0 014 6.5 2.5 2.5 0 015.5 3z',
  mail: 'M3 5.5h14v9H3zM3.5 6l6.5 5 6.5-5',
  chat: 'M4 4.5h12v8H9l-3.5 3v-3H4z',
  check: 'M4.5 10.5l3.5 3.5 7.5-8',
  trench: 'M2 5h4l2 9h4l2-9h4M2 16h16',
  duct: 'M3 7h14M3 10h14M3 13h14M3 4v12M17 4v12',
  house: 'M3 9.5L10 3l7 6.5M5 8.5V16h10V8.5M8.5 16v-4h3v4',
  surface: 'M2 8l8-4 8 4-8 4zM2 12l8 4 8-4',
  chart: 'M3 16V4M3 16h14M6 12l3-3 3 2 4-5',
  gauge: 'M10 3v14M6 5h4M6 9h4M6 13h4',
  list: 'M7 5h10M7 10h10M7 15h10M3 5h1M3 10h1M3 15h1',
  box: 'M3 6l7-3 7 3v8l-7 3-7-3zM3 6l7 3 7-3M10 9v8',
  circle: 'M10 3a7 7 0 100 14 7 7 0 000-14z',
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg className="p2-icon" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.circle} />
    </svg>
  );
}

// Dashed column guides, three lines at the column edges. Decorative.
export function Guides({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div className={`p2-guides p2-guides--${tone}`} aria-hidden="true">
      <i /><i /><i />
    </div>
  );
}

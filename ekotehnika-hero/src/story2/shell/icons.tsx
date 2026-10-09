// Thin line truck icons for the tiles and the product cards. 120 by 80, drawn with the current colour.
import type { JSX } from 'react';

const wheel = (cx: number, r = 8) => (
  <>
    <circle cx={cx} cy={61} r={r} />
    <circle cx={cx} cy={61} r={2.2} />
  </>
);

const art: Record<string, JSX.Element> = {
  counter: (
    <>
      <path d="M12 56 V38 Q12 32 18 32 H64 V56" />
      <path d="M24 32 L28 10 H62 L66 32" />
      <path d="M34 32 V20 H54 V32" />
      <path d="M76 6 V58 M82 6 V58" />
      <path d="M76 58 H112 M76 52 H112" />
      {wheel(30, 9)}
      {wheel(64, 9)}
    </>
  ),
  reach: (
    <>
      <path d="M12 56 V36 Q12 31 17 31 H46 V56" />
      <path d="M20 31 L23 12 H44 L46 31" />
      <path d="M60 4 V58 M66 4 V58" />
      <path d="M60 58 H106 M60 51 H106" />
      {wheel(24, 7)}
      {wheel(48, 7)}
    </>
  ),
  pallet: (
    <>
      <path d="M16 14 L22 40 H44 V56 H14 V40" />
      <path d="M16 14 H26" />
      <path d="M44 52 H110 M44 58 H110" />
      <path d="M44 52 V58" />
      {wheel(30, 6)}
    </>
  ),
  stacker: (
    <>
      <path d="M12 56 V36 H40 V56 Z" />
      <path d="M16 36 L18 18 H38" />
      <path d="M46 6 V58 M52 6 V58" />
      <path d="M46 58 H108 M46 52 H108" />
      {wheel(26, 7)}
    </>
  ),
  picker: (
    <>
      <path d="M12 56 V30 H44 V56 Z" />
      <path d="M16 30 V8 H40 V30" />
      <path d="M20 8 H36" />
      <path d="M50 4 V58 M56 4 V58" />
      <path d="M50 58 H108 M50 52 H108" />
      {wheel(26, 7)}
    </>
  ),
};

export function TruckIcon({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {art[name] ?? art.counter}
      <path d="M4 70 H116" opacity={0.5} />
    </svg>
  );
}

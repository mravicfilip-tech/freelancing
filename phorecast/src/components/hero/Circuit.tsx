import { useId } from 'react';

/** Geometry copied verbatim from assets/hero/circuit.svg. */
const D =
  'M0 248H101.807C119.911 248 135.758 235.84 140.444 218.353L190.873 30.1472C195.559 12.6599 ' +
  '211.406 0.5 229.511 0.5H642.431C653.04 0.5 663.214 4.71427 670.716 12.2157L719.284 60.7843C726.786 ' +
  '68.2857 731 78.4599 731 89.0685V248';

/**
 * The dotted circuit on slide 4, inline instead of `<img src={circuit}>` so the
 * entrance can draw it — `drawPaths` needs a real <path> in the document.
 *
 * `hv4__wire` is the design's line, unchanged. `hv4__trace` is a solid copy of
 * the same geometry that is drawn on and then handed over to the dotted line;
 * it is transparent in CSS and only ever made visible by the timeline, so if the
 * script never runs the slide looks exactly as it does today.
 */
export function Circuit({ className }: { className: string }) {
  const gradient = useId();
  return (
    <svg
      className={className}
      width="731.5"
      height="248.5"
      viewBox="0 0 731.5 248.5"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradient} x1="439.439" y1="20.9123" x2="6.53968" y2="173.43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC194" />
          <stop offset="0.572115" stopColor="#FF8B58" />
          <stop offset="1" stopColor="#FF632A" />
        </linearGradient>
      </defs>
      <path className="hv4__wire" d={D} stroke={`url(#${gradient})`} strokeOpacity="0.37" strokeDasharray="3 3" />
      <path className="hv4__trace" d={D} stroke={`url(#${gradient})`} strokeOpacity="0.55" />
    </svg>
  );
}

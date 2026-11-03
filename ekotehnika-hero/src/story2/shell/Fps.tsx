// The frame readout of ?debug=fps, a small box in the bottom left corner. It runs its own requestAnimationFrame, measures the gap
// between frames, and every half second writes one line from the meters in story2/perf.ts. It writes to the page only when the line
// changed, and renders nothing without the parameter.
import { useEffect, useRef } from 'react';
import { DEBUG_FPS, perf } from '../perf';

export function Fps() {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!DEBUG_FPS) return;
    let id = 0;
    let last = 0;
    let shown = 0;
    let text = '';
    const tick = (now: number) => {
      if (last) perf.frame.add(now - last);
      last = now;
      if (now - shown > 500) {
        shown = now;
        const f = perf.frame.lap();
        const sh = perf.shell.lap();
        const sc = perf.scene.lap();
        const dr = perf.draw.lap();
        if (f.n) {
          const next = [
            `${(1000 / f.avg).toFixed(0)} fps   frame ${f.avg.toFixed(1)} ms (worst ${f.max.toFixed(0)})`,
            `shell js ${sh.avg.toFixed(2)} ms (worst ${sh.max.toFixed(1)})`,
            `scene js ${sc.avg.toFixed(2)} ms (worst ${sc.max.toFixed(1)})   draw ${dr.avg.toFixed(1)} ms`,
            `${perf.calls} calls   ${(perf.tris / 1000).toFixed(0)}k triangles   dpr ${perf.dpr.toFixed(2)}`,
          ].join('\n');
          if (next !== text && ref.current) {
            text = next;
            ref.current.textContent = next;
          }
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  if (!DEBUG_FPS) return null;
  return <pre className="fps" ref={ref} aria-hidden="true" />;
}

// The one live figure all four preloaders carry, the share loaded, at the foot of the left column where the page's own coordinate label
// stands, in the type of that label. It is text and not part of any drawing, so the figure is real text a screen reader can skip with the
// rest of the sheet. Written to the DOM straight from the loop, only when the whole number changes.
import { useRef } from 'react';
import { span, useFrame, type LoaderState } from './state';

export function Readout({ state }: { state: LoaderState }) {
  const el = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLParagraphElement>(null);
  const last = useRef(-1);
  useFrame(state, (s) => {
    // the figure goes in the first quarter of the exit, a version that lifts the whole sheet takes it along, and this is gone before that
    if (root.current) root.current.style.opacity = s.out > 0 ? String(1 - span(s.out, 0, 0.25)) : '';
    const n = Math.round(Math.min(1, s.p) * 100);
    if (n !== last.current && el.current) {
      last.current = n;
      el.current.textContent = String(n);
    }
  });
  return (
    <p className="pl-read" ref={root} aria-hidden="true">
      <span>Učitavanje</span>
      <span ref={el}>0</span>
      <span>%</span>
    </p>
  );
}

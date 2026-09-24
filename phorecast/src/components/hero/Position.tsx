import { useCallback, useEffect, useRef, useState } from 'react';
import { REDUCED } from '../../lib/motion';
import './Position.css';

type Props = {
  index: number;      // zero-based
  count: number;
  onSelect: (i: number) => void;
  /** The autoplay interval, so the track can show it running out. */
  periodMs: number;
  /** True while the hero is holding the carousel (hover, focus, off screen, reduced motion). */
  paused: boolean;
  /** Changing this restarts the track's run, for a hold that also restarted the hero's interval. */
  cycleKey?: unknown;
  label?: string;
};

const clamp = (n: number, a: number, z: number) => Math.min(z, Math.max(a, n));

/**
 * The hero's slider control: prev and next either side of a segmented track
 * that fills as the autoplay interval runs down.
 *
 * The fill is the point of the control: it shows that the hero advances by
 * itself every seven seconds, so the carousel does not appear to change at
 * random.
 *
 * The track is draggable as well as clickable, and commits on release rather
 * than while the pointer moves: following the drag live would replay the slide
 * choreography on every segment the pointer crossed.
 */
export function Position({ index, count, onSelect, periodMs, paused, cycleKey, label = 'Slide' }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const fillsRef = useRef<HTMLSpanElement[]>([]);
  const [dragTo, setDragTo] = useState<number | null>(null);

  // The clock, kept out of React: it is read every frame and nothing else in
  // the hero needs to re-render for it. The effect below sets the start on
  // mount, before the first frame reads it.
  const startRef = useRef(0);
  const heldRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => { startRef.current = performance.now(); heldRef.current = 0; }, [index, cycleKey]);
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) heldRef.current = performance.now() - startRef.current;
    else startRef.current = performance.now() - heldRef.current;
  }, [paused]);

  // The interval is the hero's, so the track finishing and the slide changing
  // are the same moment rather than two things that drift apart.
  useEffect(() => {
    const paint = (p: number) => {
      fillsRef.current.forEach((el, n) => {
        if (el) el.style.transform = `scaleX(${n < index ? 1 : n === index ? p : 0})`;
      });
    };
    if (REDUCED) { paint(1); return; }

    // Paint only when the number moves. Held (for example with the hero
    // scrolled away) the elapsed time is a constant, and writing the same four
    // transforms every frame is a style recalculation a frame for a bar that
    // is not moving and may not even be on screen.
    let last = -1;
    let raf = 0;
    const tick = () => {
      const elapsed = pausedRef.current ? heldRef.current : performance.now() - startRef.current;
      const p = clamp(elapsed / periodMs, 0, 1);
      if (p !== last) { last = p; paint(p); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, periodMs]);

  const segmentAt = useCallback((clientX: number) => {
    const box = railRef.current?.getBoundingClientRect();
    if (!box) return index;
    return clamp(Math.floor(((clientX - box.left) / box.width) * count), 0, count - 1);
  }, [count, index]);

  const onPointerDown = (e: React.PointerEvent) => {
    railRef.current?.setPointerCapture(e.pointerId);
    setDragTo(segmentAt(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragTo !== null) setDragTo(segmentAt(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragTo === null) return;
    railRef.current?.releasePointerCapture(e.pointerId);
    onSelect(dragTo);
    setDragTo(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step) { onSelect(index + step); e.preventDefault(); return; }
    if (e.key === 'Home') { onSelect(0); e.preventDefault(); }
    if (e.key === 'End') { onSelect(count - 1); e.preventDefault(); }
  };

  const shown = dragTo ?? index;

  return (
    <div className="position">
      <button type="button" className="position__arrow" aria-label="Previous slide" onClick={() => onSelect(index - 1)}>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3 L5 8 L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        ref={railRef}
        className={`position__rail${dragTo !== null ? ' is-dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label={`${label} position`}
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={shown + 1}
        aria-valuetext={`${label} ${shown + 1} of ${count}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`position__seg${i < shown ? ' is-past' : ''}`}>
            <span
              className="position__fill"
              ref={(el) => { if (el) fillsRef.current[i] = el; }}
            />
          </span>
        ))}
      </div>

      <button type="button" className="position__arrow" aria-label="Next slide" onClick={() => onSelect(index + 1)}>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3 L11 8 L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

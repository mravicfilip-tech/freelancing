import { useEffect, useRef, type ReactNode } from 'react';
import { mountRow } from './arc';

/**
 * A row of prize cards with the arc scene laid over it: the children scroll
 * or slide inside `.fx-row__body`, the canvas stays put and follows them.
 */
export function FxRow({ className, children }: { className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!root.current || !canvas.current) return;
    return mountRow(root.current, canvas.current);
  }, []);
  return (
    <div className={`fx-row${className ? ` ${className}` : ''}`} ref={root}>
      {children}
      <canvas className="fx-row__fx" ref={canvas} aria-hidden="true" />
    </div>
  );
}

import type { PointerEvent, ReactNode } from 'react';
import type { NodeId, Point } from '../data';

interface Props {
  id: NodeId;
  title: string;
  pos: Point;
  width: number;
  /** Vertical anchor of each port, as a CSS length from the card top. */
  ports: { in?: string; out?: string };
  dragging: boolean;
  onDragStart: (id: NodeId, e: PointerEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
}

const INTERACTIVE = 'input, select, textarea, button, label, a, [contenteditable="true"]';

export function NodeCard({ id, title, pos, width, ports, dragging, onDragStart, className, children }: Props) {
  return (
    <article
      className={`node ${className ?? ''}`}
      data-node={id}
      data-dragging={dragging || undefined}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width }}
      aria-label={title}
      onPointerDown={(e) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest(INTERACTIVE)) return;
        onDragStart(id, e);
      }}
    >
      <header className="node-head">
        <span className="node-dot" aria-hidden />
        <h3>{title}</h3>
      </header>
      {children}
      {ports.in && <span className="port port-in" data-port={`${id}:in`} style={{ top: ports.in }} aria-hidden />}
      {ports.out && <span className="port port-out" data-port={`${id}:out`} style={{ top: ports.out }} aria-hidden />}
    </article>
  );
}

export function Field({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
    </div>
  );
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <label className="select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
        <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

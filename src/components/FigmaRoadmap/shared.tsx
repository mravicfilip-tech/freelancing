import type { Level } from './content';

/** The tick a milestone carries on the live cards: filled once it is done, an open ring until then. */
export function Tick({ done }: { done: boolean }) {
  return (
    <span className="rd-tick" data-done={done || undefined} aria-hidden="true">
      <svg viewBox="0 0 20 20" width="20" height="20">
        {done ? (
          <path
            d="M4.5 10.4 8.4 14.2 15.5 6.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <circle cx="10" cy="10" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        )}
      </svg>
    </span>
  );
}

/**
 * The milestones of one level, ruled on the design's [4,4] stroke and ticked. Shared by every
 * direction that lists them; `.rd-miles` styles live in FigmaRoadmap.css.
 */
export function Milestones({ level }: { level: Level }) {
  return (
    <ol className="rd-miles">
      {level.items.map((item, j) => (
        <li key={item.short} data-done={item.done || undefined} style={{ '--j': j } as React.CSSProperties}>
          <Tick done={item.done} />
          {item.text}
        </li>
      ))}
    </ol>
  );
}

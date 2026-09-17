/**
 * The Swap hover: the live label leaves upward while a duplicate arrives from
 * below. Direction 03 from hover-lab.html, chosen for buttons, menu links and
 * footer links, so all three families move the same way.
 *
 * The duplicate is the animation, which is why it lives here rather than in a
 * pseudo-element: `content` cannot carry a React child, and reading the label
 * back out of the DOM to build one would run after paint.
 *
 * Only the second copy is hidden from assistive tech; the first is the real
 * label and keeps whatever role its parent gives it.
 */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll__in">{children}</span>
      <span className="roll__in" aria-hidden="true">{children}</span>
    </span>
  );
}

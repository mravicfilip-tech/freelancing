import { Icon } from './Icon';
import mark from '../assets/brand/mark.svg';
import './Logo.css';

/**
 * The wordmark and the 3D-less flat mark beside it, in the nav and the footer.
 *
 * `brand/mark.svg` is one flat path at `#f03725`, which is class B in
 * LIGHTMODE.md §2.3 and therefore a mask: the file stays on disk and the paint
 * becomes `color`, set in Logo.css. Nothing else in this file changed — the
 * anchor, the label and the box are what they were.
 *
 * On `#f03725` specifically: it is NOT a stray, and it is not `--orange-100`
 * gone wrong. It is the artwork red — the value Figma exports throughout
 * `src/assets` (the fan arcs, the Built smear, the Familiar dots and gauges,
 * the in-app mark, twenty-odd files) as distinct from the `#e5331e` the UI
 * tokens carry. So the mark keeps it in dark, to the pixel, through a local
 * token rather than by joining `--accent`.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <a href="#top" className={`logo ${className}`} aria-label="Phorcast home">
      <Icon src={mark} w={30.5} h={35.6} className="logo__mark" />
      <span className="logo__word">Phorcast</span>
    </a>
  );
}

import { Icon } from './Icon';
import { home, useRoute } from '../lib/router';
import mark from '../assets/brand/mark.svg';
import './Logo.css';

/**
 * The wordmark and the flat mark beside it, in the nav and the footer.
 *
 * `brand/mark.svg` is one flat path, so it renders as a mask (see Icon) and
 * its colour comes from Logo.css.
 *
 * The href comes from `home()`: `#top` on "/" and "/" anywhere else, because
 * `#top` only exists in the landing page's document and would do nothing
 * from /about.
 */
export function Logo({ className = '' }: { className?: string }) {
  const { path } = useRoute();
  return (
    <a href={home(path)} className={`logo ${className}`} aria-label="Phorcast home">
      <Icon src={mark} w={30.5} h={35.6} className="logo__mark" />
      <span className="logo__word">Phorcast</span>
    </a>
  );
}

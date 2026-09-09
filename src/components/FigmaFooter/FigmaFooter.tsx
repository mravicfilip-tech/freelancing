import { useRef, type ReactElement } from 'react';
import { PresaleButton } from '../FigmaHero/FigmaHero';
import { useCorridors } from './useCorridors';
import { useFooterMotion } from './useFooterMotion';
import './FigmaFooter.css';

const LINKS: [string, string][][] = [
  [
    ['About', '#about'],
    ['Tokenomics', '#tokenomics'],
    ['How to buy?', '#how-to-buy'],
  ],
  [
    ['Roadmap', '#roadmap'],
    ['Ecosystem', '#ecosystem'],
    ['Whitepaper', '#whitepaper'],
  ],
];

const CONTACT: [string, string][] = [
  ['support@remittix.io', 'mailto:support@remittix.io'],
  ['marketing@remittix.io', 'mailto:marketing@remittix.io'],
];

const DISCLAIMER =
  'Digital currencies may be unregulated in your jurisdiction. The value of digital currencies may go down ' +
  'as well as up. Profits may be subject to capital gains or other taxes applicable in your jurisdiction.';

function IconX() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.07 3.66c.26-1.3-.94-2.37-2.13-1.9L1.6 9.63c-1.2.47-1.1 2.22.14 2.56l4.32 1.19 1.62 5.05c.28.88 1.38 1.16 2.05.53l2.37-2.24 4.2 3.08c.79.58 1.92.16 2.13-.81zM8.9 14.3l9.06-5.72-7.2 6.72a1.1 1.1 0 0 0-.34.62l-.4 2.3z" />
    </svg>
  );
}
function IconMedium() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="6" />
      <ellipse cx="16.3" cy="12" rx="3.1" ry="5.6" />
      <ellipse cx="22.2" cy="12" rx="1.3" ry="5" />
    </svg>
  );
}

const SOCIAL: [string, string, () => ReactElement][] = [
  ['X', 'https://x.com/remittix', IconX],
  ['Telegram', 'https://t.me/remittix', IconTelegram],
  ['Medium', 'https://medium.com/@remittix', IconMedium],
];

/**
 * Footer. A full-height closing line carrying the hero's own headline and the primary button, then
 * the wordmark and socials, then the disclaimer beside the link columns — all on the same light
 * band and 1560 dashed rails the sections above it use, so the page ends on the same grid.
 */
export function FigmaFooter() {
  const root = useRef<HTMLElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  useFooterMotion(root);
  useCorridors(cta);

  return (
    <footer ref={root} className="ft" data-motion="pending">
      <div className="ft__frame">
        <div className="ft__cta" ref={cta}>
          <canvas className="ft__field" aria-hidden="true" />
          <h2 className="ft__title">
            <span className="ft__line">
              <span className="ft__lineInner">Cross-border</span>
            </span>
            <span className="ft__line">
              <span className="ft__lineInner">
                Payments <span className="ft__titleMuted">Reinvented</span>
              </span>
            </span>
          </h2>
          <PresaleButton wide />
        </div>

        <i className="ft__rule" aria-hidden="true" />

        <div className="ft__main">
          <div className="ft__identity">
            <a className="ft__brand" href="/">
              <img src="/figma/logo-lime.svg" alt="" width={33} height={17} />
              <span>Remittix</span>
            </a>
            <ul className="ft__social">
              {SOCIAL.map(([name, href, Icon]) => (
                <li key={name}>
                  <a href={href} aria-label={name} rel="noreferrer noopener" target="_blank">
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav className="ft__nav" aria-label="Footer">
            {LINKS.map((column, c) => (
              <div className="ft__col" key={c}>
                <h3 className="ft__label">{c === 0 ? 'Company' : 'Project'}</h3>
                <ul>
                  {column.map(([label, href]) => (
                    <li key={label}>
                      <a href={href}>{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="ft__col ft__col--contact">
              <h3 className="ft__label">Contact info</h3>
              <ul>
                {CONTACT.map(([label, href]) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <p className="ft__small">
          <b>Disclaimer:</b> {DISCLAIMER}
        </p>

        <i className="ft__rule" aria-hidden="true" />

        <div className="ft__legal">
          <span>© All Rights reserved by Remittix – 2026</span>
          <nav aria-label="Legal">
            <a href="#privacy">Privacy policy</a>
            <a href="#terms">Terms of service</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

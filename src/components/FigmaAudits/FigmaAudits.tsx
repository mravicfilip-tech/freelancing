import { useRef } from 'react';
import { blobOrigin, Chevron } from '../FigmaHero/FigmaHero';
import { useAuditsMotion } from './useAuditsMotion';
import './FigmaAudits.css';

/**
 * "Audited, verified & certified" — the trust band. Two cells on the same dashed lattice as the
 * bands above it: the contract audits on the left, the whitepaper on the right.
 *
 * NOTE: the audit partners and every href here are placeholders. Swap AUDITS, WHITEPAPER_HREF and
 * REPORTS_HREF for the real firms and published reports before this ships.
 */

const AUDITS = [
  { name: 'CertiK', href: '#audit-certik' },
  { name: 'Coinsult', href: '#audit-coinsult' },
] as const;

const REPORTS_HREF = '#audits';
const WHITEPAPER_HREF = '#whitepaper';

/** A shield with a tick, drawn on the system's 24-grid — the mark beside each auditor's name. */
function ShieldMark() {
  return (
    <svg className="av__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6 4.6 5.7v5.9c0 4.5 3 8.2 7.4 9.6 4.4-1.4 7.4-5.1 7.4-9.6V5.7L12 2.6Z" />
      <path className="av__tick" d="m8.5 12 2.6 2.6L15.6 10" />
    </svg>
  );
}

/** The whitepaper itself: a ruled page with its corner turned. */
function PaperMark() {
  return (
    <svg className="av__glyph av__glyph--paper" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h7l5 5v13H6V3Z" />
      <path d="M13 3v5h5" />
      <path className="av__rule" d="M9 12.4h6M9 15.8h6M9 9h2.5" />
    </svg>
  );
}

export function FigmaAudits() {
  const root = useRef<HTMLElement>(null);
  useAuditsMotion(root);

  return (
    <section ref={root} className="av" id="audits" data-motion="pending" aria-labelledby="av-title">
      <div className="av__frame">
        <div className="av__head">
          <h2 id="av-title" className="av__title">
            <span className="av__line">
              <span className="av__lineInner">Audited, verified</span>
            </span>
            <span className="av__line">
              <span className="av__lineInner">&amp; certified</span>
            </span>
          </h2>
          <p className="av__intro">
            Read our whitepaper and security audits to learn everything you need to know about the
            Remittix ecosystem.
          </p>
        </div>

        <div className="av__cols">
          <div className="av__cell">
            <div className="av__marks">
              {AUDITS.map((audit) => (
                <span className="av__firm" key={audit.name}>
                  <ShieldMark />
                  {audit.name}
                </span>
              ))}
            </div>
            <p className="av__copy">
              Our smart contract has successfully undergone a rigorous audit by leading security
              firms <a href={AUDITS[0].href}>{AUDITS[0].name}</a> &amp;{' '}
              <a href={AUDITS[1].href}>{AUDITS[1].name}</a>.
            </p>
            <a
              className="fh__btn fh__btn--primary fh__btn--wide"
              href={REPORTS_HREF}
              onPointerEnter={blobOrigin}
              onPointerLeave={blobOrigin}
            >
              View here
              <Chevron direction="right" />
            </a>
          </div>

          <div className="av__cell">
            <div className="av__marks">
              <PaperMark />
            </div>
            <p className="av__copy">
              Read our whitepaper to learn more about our platform and tokenomics.
            </p>
            <a
              className="fh__btn fh__btn--ghost fh__btn--wide"
              href={WHITEPAPER_HREF}
              onPointerEnter={blobOrigin}
              onPointerLeave={blobOrigin}
            >
              Whitepaper
              <Chevron direction="right" />
            </a>
          </div>

          <i className="av__gutter" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

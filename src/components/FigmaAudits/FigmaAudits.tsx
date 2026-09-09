import { useRef, useState } from 'react';
import { blobOrigin, Chevron } from '../FigmaHero/FigmaHero';
import { useAuditsMotion } from './useAuditsMotion';
import './FigmaAudits.css';

/**
 * "Audited, verified & certified" — the credentials band. Three cells on the same dashed lattice
 * as the "As seen in" band: the two contract audits and the whitepaper, each carrying what the
 * document actually says (findings, verdict date, version) rather than a line of assurance copy.
 * Under them runs the ledger strip: the contract itself, its chain, and the treasury's multisig.
 *
 * NOTE: the finding counts, dates, the contract address, the multisig and all hrefs are
 * placeholders. Swap them for the published reports before this ships.
 *
 * Both marks ship white for a dark ground; the copies in public/figma/logos/ carry the design's
 * ink instead, and Coinsult's gradient tile is flattened to that same ink so the two read as one
 * set. A firm without a `logo` falls back to the drawn shield.
 */

type Logo = { src: string; w: number; h: number };
type Credential = {
  id: string;
  name: string;
  logo?: Logo;
  kind: string;
  facts: [string, string][];
  href: string;
  cta: string;
  /** Renders the cell's link as a pill rather than a ruled link. Secondary — the page's primary
      action is the presale, and this band should not compete with it. */
  pill?: boolean;
};

const CREDENTIALS: Credential[] = [
  {
    id: 'certik',
    name: 'CertiK',
    logo: { src: '/figma/logos/certik.svg', w: 130, h: 26 },
    kind: 'Smart contract audit',
    facts: [
      ['Findings', '0 critical · 0 major'],
      ['Signed off', '12 Aug 2026'],
    ],
    href: '#audit-certik',
    cta: 'Read report',
  },
  {
    id: 'coinsult',
    name: 'Coinsult',
    logo: { src: '/figma/logos/coinsult.svg', w: 113, h: 29 },
    kind: 'Smart contract audit',
    facts: [
      ['Findings', '0 critical · 2 minor'],
      ['Signed off', '03 Sep 2026'],
    ],
    href: '#audit-coinsult',
    cta: 'Read report',
  },
  {
    id: 'whitepaper',
    name: 'Whitepaper',
    kind: 'Protocol & tokenomics',
    facts: [
      ['Version', 'v1.4'],
      ['Published', '21 Aug 2026'],
    ],
    href: '#whitepaper',
    cta: 'Whitepaper',
    pill: true,
  },
];

/** The ledger strip: the facts a reader can check for themselves. */
const CONTRACT = '0x1f9a4C7B2e58Dd0341aE6b93F0c8721Ac2E4d5b6';
const LEDGER: [string, string, boolean][] = [
  ['Contract', CONTRACT, true],
  ['Network', 'Ethereum mainnet', false],
  ['Treasury', '4-of-7 multisig', false],
];

/** A shield with a tick — the stand-in until a firm's own mark is in public/figma/logos/. */
function ShieldMark() {
  return (
    <svg className="av__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6 4.6 5.7v5.9c0 4.5 3 8.2 7.4 9.6 4.4-1.4 7.4-5.1 7.4-9.6V5.7L12 2.6Z" />
      <path className="av__accent" d="m8.5 12 2.6 2.6L15.6 10" />
    </svg>
  );
}

/** The whitepaper itself: a ruled page with its corner turned. */
function PaperMark() {
  return (
    <svg className="av__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h7l5 5v13H6V3Z" />
      <path d="M13 3v5h5" />
      <path className="av__accent" d="M9 12.4h6M9 15.8h6M9 9h2.5" />
    </svg>
  );
}

/** Middle-truncated, so the address reads as an address at any column width. */
const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function CopyAddress({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="av__copy"
      data-copied={copied || undefined}
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          },
          () => {
            /* clipboard blocked: the address is on the page to select by hand */
          },
        );
      }}
    >
      <span className="av__mono">{shortAddress(value)}</span>
      <span className="av__copyLabel">{copied ? 'Copied' : 'Copy'}</span>
      <span className="sr-only">{copied ? 'Address copied' : `Copy the contract address ${value}`}</span>
    </button>
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
            Two independent audits and the whitepaper, published in full — findings, severities and
            remediations included.
          </p>
        </div>

        <div className="av__grid">
          {/* the lattice's own edges run rail to rail; the cells carry only the dividers */}
          <i className="av__ruleH av__ruleH--top" aria-hidden="true" />
          <i className="av__ruleH av__ruleH--bottom" aria-hidden="true" />
          {CREDENTIALS.map((c, i) => (
            <article className="av__cell" key={c.id}>
              {i < CREDENTIALS.length - 1 && <i className="av__ruleV" aria-hidden="true" />}

              <div className="av__mark">
                {c.logo ? (
                  <img
                    src={c.logo.src}
                    alt={c.name}
                    width={c.logo.w}
                    height={c.logo.h}
                    loading="lazy"
                  />
                ) : (
                  <span className="av__drawn">
                    {c.id === 'whitepaper' ? <PaperMark /> : <ShieldMark />}
                    {c.name}
                  </span>
                )}
              </div>

              <p className="av__kind">{c.kind}</p>

              <dl className="av__facts">
                {c.facts.map(([label, value]) => (
                  <div className="av__fact" key={label}>
                    <dt>{label}</dt>
                    <dd className="av__mono">{value}</dd>
                  </div>
                ))}
              </dl>

              {c.pill ? (
                <a
                  className="fh__btn fh__btn--ghost"
                  href={c.href}
                  onPointerEnter={blobOrigin}
                  onPointerLeave={blobOrigin}
                >
                  {c.cta}
                </a>
              ) : (
                <a className="av__link" href={c.href}>
                  {c.cta}
                  <Chevron direction="right" />
                </a>
              )}
            </article>
          ))}
        </div>

        <div className="av__ledger">
          {LEDGER.map(([label, value, copy]) => (
            <div className="av__field" key={label}>
              <span className="av__fieldLabel">{label}</span>
              {copy ? <CopyAddress value={value} /> : <span className="av__mono">{value}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

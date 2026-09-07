import { useRef } from 'react';
import { useSeenInMotion } from './useSeenInMotion';
import './FigmaSeenIn.css';

const L = (n: string) => `/figma/logos/${n}.svg`;

/**
 * "As seen in" (Figma 2532:809). Seven marks on a dashed lattice — four cells then three — each
 * logo at the size the design gives it, so none is stretched to a common box.
 */
type Mark = { id: string; name: string; src: string; w: number; h: number; word?: string };

const ROWS: Mark[][] = [
  [
    { id: 'anthropic', name: 'Anthropic', src: L('anthropic'), w: 176.552, h: 20 },
    { id: 'privy', name: 'Privy', src: L('privy'), w: 141.538, h: 32 },
    { id: 'noah', name: 'Noah', src: L('noah'), w: 120, h: 32 },
    { id: 'ethereum', name: 'Ethereum', src: L('ethereum'), w: 167.628, h: 42 },
  ],
  [
    { id: 'uniswap', name: 'Uniswap', src: L('uniswap'), w: 42, h: 42, word: 'Uniswap' },
    { id: 'trust', name: 'Trust Wallet', src: L('trust'), w: 118.336, h: 32 },
    { id: 'safe', name: 'Safe Wallet', src: L('safe'), w: 165.333, h: 32 },
  ],
];

export function FigmaSeenIn() {
  const root = useRef<HTMLElement>(null);
  useSeenInMotion(root);

  return (
    <section ref={root} className="sn" data-motion="pending" aria-labelledby="sn-title" data-node-id="2532:809">
      <div className="sn__frame">
        <h2 id="sn-title" className="sn__title">
          <span className="sn__line">
            <span className="sn__lineInner">As seen in</span>
          </span>
        </h2>

        <div className="sn__grid">
          {/* the lattice's own top edge; every other rule belongs to a cell */}
          <i className="sn__ruleH sn__ruleH--top" aria-hidden="true" />
          {ROWS.map((row, r) => (
            <div className="sn__row" key={r}>
              {row.map((mark, i) => (
                <div className="sn__cell" key={mark.id}>
                  <i className="sn__ruleH" aria-hidden="true" />
                  {i < row.length - 1 && <i className="sn__ruleV" aria-hidden="true" />}
                  <span className="sn__mark">
                    <img src={mark.src} alt={mark.name} width={mark.w} height={mark.h} loading="lazy" />
                    {mark.word && <b className="sn__word">{mark.word}</b>}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

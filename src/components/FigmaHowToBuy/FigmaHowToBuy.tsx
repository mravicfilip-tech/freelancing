import { useRef, useState } from 'react';
import { blobOrigin, Chevron } from '../FigmaHero/FigmaHero';
import { useHowToBuyMotion } from './useHowToBuyMotion';
import './FigmaHowToBuy.css';

/**
 * "How to buy $RTX?" — the four steps as a vertical tablist: the rail on the left switches the
 * panel on the right. Arrow keys, Home and End move between steps, as a tablist should.
 *
 * NOTE: the wallet and presale hrefs are placeholders; point them at the real destinations.
 */

type Action = { label: string; href: string; ghost?: boolean };
type Step = { id: string; title: string; body: string; actions: Action[] };

const STEPS: Step[] = [
  {
    id: 'wallet',
    title: 'Set up your wallet',
    body:
      'Start by setting up a secure crypto wallet to hold your Remittix $RTX tokens. We recommend using Coinbase, MetaMask or Trust Wallet for the best experience. These wallets are secure, user-friendly, and fully compatible with Remittix.',
    actions: [
      { label: 'Download MetaMask', href: '#download-metamask' },
      { label: 'Download Trust', href: '#download-trust', ghost: true },
    ],
  },
  {
    id: 'load',
    title: 'Load your wallet',
    body:
      'Add funds to the wallet you just created. You can buy ETH, USDT, BNB or SOL with a card inside MetaMask, Trust Wallet or Coinbase, or send them across from an exchange you already use. Leave a little over for the network fee.',
    actions: [{ label: 'Buy crypto', href: '#buy-crypto' }],
  },
  {
    id: 'buy',
    title: 'Buy Remittix tokens',
    body:
      'Open the presale panel, connect the wallet you funded, and choose how much you want to spend. Confirm in your wallet and your $RTX is allocated at the presale rate you were quoted — fifty dollars is the minimum.',
    actions: [{ label: 'Join presale', href: '#presale' }],
  },
  {
    id: 'claim',
    title: 'Get your hands on $RTX',
    body:
      'Your allocation is held against the wallet you paid from and unlocks in full at listing — no cliff, no drip. Connect the same wallet to the claim panel on launch day and the tokens land straight in it.',
    actions: [{ label: 'Read tokenomics', href: '#tokenomics', ghost: true }],
  },
];

export function FigmaHowToBuy() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  useHowToBuyMotion(root);

  const step = STEPS[active];

  /** Up/down (and Home/End) move between steps; the rail wraps at both ends. */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: STEPS.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const index = (next + STEPS.length) % STEPS.length;
    setActive(index);
    tabs.current[index]?.focus();
  }

  return (
    <section ref={root} className="hb" id="how-to-buy" data-motion="pending" aria-labelledby="hb-title">
      <div className="hb__frame">
        <div className="hb__head">
          <h2 id="hb-title" className="hb__title">
            <span className="hb__line">
              <span className="hb__lineInner">How to buy $RTX?</span>
            </span>
          </h2>
          <p className="hb__intro">
            Four steps from an empty wallet to an allocation held against your own address.
          </p>
        </div>

        <div className="hb__cols">
          <div className="hb__rail" role="tablist" aria-orientation="vertical" onKeyDown={onKeyDown}>
            {STEPS.map((s, i) => (
              <button
                type="button"
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`hb-tab-${s.id}`}
                aria-controls={`hb-panel-${s.id}`}
                aria-selected={i === active}
                tabIndex={i === active ? 0 : -1}
                className={`hb__step${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="hb__accent" aria-hidden="true">
                  <i />
                </span>
                <span className="hb__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="hb__stepTitle">{s.title}</span>
              </button>
            ))}
          </div>

          <div
            className="hb__panel"
            role="tabpanel"
            id={`hb-panel-${step.id}`}
            aria-labelledby={`hb-tab-${step.id}`}
            tabIndex={0}
          >
            {/* keyed on the step so the panel re-runs its own fade as the rail switches */}
            <div className="hb__panelInner" key={step.id}>
              <p className="hb__eyebrow">Step {String(active + 1).padStart(2, '0')}</p>
              <h3 className="hb__panelTitle">{step.title}</h3>
              <p className="hb__body">{step.body}</p>
              <div className="hb__actions">
                {step.actions.map((action) => (
                  <a
                    key={action.label}
                    className={`fh__btn fh__btn--wide ${action.ghost ? 'fh__btn--ghost' : 'fh__btn--primary'}`}
                    href={action.href}
                    onPointerEnter={blobOrigin}
                    onPointerLeave={blobOrigin}
                  >
                    {action.label}
                    <Chevron direction="right" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <i className="hb__gutter" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

import { useRef, useState } from 'react';
import { Payments, Trading, Staking, Storage } from './illustrations';
import { useEcosystemMotion } from './useEcosystemMotion';
import '../FigmaFeatures/illustrations/illustrations.css';
import './illustrations/ecosystem-illustrations.css';
import './FigmaEcosystem.css';

/**
 * Ecosystem section: one card with the copy and an accordion of the four pillars on the left, and
 * an illustration on the right that swaps with the active pillar. The accordion advances on its
 * own every few seconds (a progress accent shows where it is) and any item can be clicked. Each
 * illustration is a layered stage in the bento grid's manner, with a build-in and an idle loop.
 */
/** Assets exported from the Figma section (node 2474:155). */
const E = (n: string) => `/figma/ecosystem/${n}`;

export const PILLARS = [
  {
    id: 'payments',
    title: 'Payments',
    icon: E('icon-payments.svg'),
    body: 'Send crypto, they receive fiat. Local payment rails in over 30 currencies with same-day settlement and zero FX fees, straight into any bank account.',
  },
  {
    id: 'trading',
    title: 'Trading',
    icon: E('icon-trading.svg'),
    body: 'Swap between crypto and fiat at the live market rate without leaving the wallet. No exchange account, no withdrawal queue, no hidden spread.',
  },
  {
    id: 'staking',
    title: 'Staking',
    icon: E('icon-staking.svg'),
    body: 'Put idle RTX to work. Stake from the wallet in one tap, watch rewards accrue daily, and unstake whenever you need the liquidity.',
  },
  {
    id: 'storage',
    title: 'Storage',
    icon: E('icon-storage.svg'),
    body: 'Self-custody by default. Your keys never leave your device, with hardware wallet support and a built-in vault for long-term holdings.',
  },
] as const;

export function FigmaEcosystem() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { select } = useEcosystemMotion(root, active, setActive);
  return (
    <section ref={root} className="ec" data-motion="pending" aria-labelledby="ec-title">
      <div className="ec__frame">
        <div className="ec__card">
          <div className="ec__copy">
            <span className="ec__eyebrow">Ecosystem</span>
            <h2 id="ec-title" className="ec__title">
              <span className="ec__line">
                <span className="ec__lineInner">One wallet. Everything</span>
              </span>
              <span className="ec__line">
                <span className="ec__lineInner">your money needs to do.</span>
              </span>
            </h2>
            <p className="ec__body">
              Remittix is built as a full ecosystem, not a single feature. Pay, trade, stake and store from the same
              wallet, on the same rails that move crypto into any bank account.
            </p>

            <ul className="ec__list" role="tablist" aria-label="Ecosystem pillars">
              {PILLARS.map((p, i) => (
                <li key={p.id} className={`ec__item${i === active ? ' ec__item--on' : ''}`}>
                  <i className="ec__accent">
                    <i className="ec__progress" />
                  </i>
                  <button type="button" role="tab" aria-selected={i === active} aria-controls={`ec-scene-${p.id}`} className="ec__itemHead" onClick={() => select(i)}>
                    <img src={p.icon} alt="" width={20} height={20} />
                    <span className="ec__itemTitle">{p.title}</span>
                  </button>
                  <div className="ec__itemBody">
                    <p>{p.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="ec__panel">
            <img className="ec__wall" src={E('panel-bg.webp')} alt="" aria-hidden="true" />
            <div id="ec-scene-payments" className="ec__scene" data-scene="payments" role="tabpanel">
              <Payments />
            </div>
            <div id="ec-scene-trading" className="ec__scene" data-scene="trading" role="tabpanel">
              <Trading />
            </div>
            <div id="ec-scene-staking" className="ec__scene" data-scene="staking" role="tabpanel">
              <Staking />
            </div>
            <div id="ec-scene-storage" className="ec__scene" data-scene="storage" role="tabpanel">
              <Storage />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

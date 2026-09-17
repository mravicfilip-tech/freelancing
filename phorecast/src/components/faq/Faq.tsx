import { useMemo, useRef, useState } from 'react';
import dot from '../../assets/icons/live-dot.svg';
import { HeroLogo } from '../HeroLogo';
import { useSectionMotion } from '../../lib/motion';
import { buildFaq } from './Faq.motion';
import seal from '../../assets/faq/seal.svg';
import './Faq.css';

type Chip = { label: string; value: string } | { verify: string };

type Item = { q: string; a: string; chips?: Chip[] };

const ITEMS: Item[] = [
  {
    q: 'What markets can I trade on Phorecast?',
    a: 'Crypto, forex, stocks, commodities and indices sit behind one account and one balance. You move between them without opening a second venue or funding a second wallet.',
  },
  {
    q: 'How quickly can I start trading?',
    a: 'Registration takes about a minute. Create the account with an email or a wallet, fund it, and the markets are open to you straight away.',
  },
  {
    q: 'Does Phorecast hold my funds?',
    a: 'No. Collateral sits in smart contracts we never touch, so a withdrawal is something you execute rather than something you request.',
  },
  {
    q: 'How does on-chain trading work?',
    a: 'Execution happens off-chain, settlement happens on-chain. Positions, P&L, liquidations and settlement are all independently verifiable — you never have to take our word for the number.',
    chips: [
      { label: 'Execution', value: 'Off-chain' },
      { label: 'Settlement', value: 'On-chain' },
      { verify: 'Verifiable on-chain' },
    ],
  },
  {
    q: 'How do deposits and withdrawals work?',
    a: 'Fund with crypto, card, Apple Pay, Google Pay or bank transfer. Withdrawals settle on-chain to the address you control, with no queue and no approval step.',
  },
  {
    q: 'Do I need to complete KYC?',
    a: 'Not to open an account or to trade. Some fiat rails ask for identity checks of their own, and we tell you before you start one rather than after.',
  },
  {
    q: 'What happens when a position is liquidated?',
    a: 'The liquidation runs against the same on-chain collateral you can inspect yourself. Every step, from the mark price to the close, is written where you can check it.',
  },
];

const pad = (n: number) => String(n + 1).padStart(2, '0');

export function Faq() {
  const [open, setOpen] = useState(3);
  const markRef = useRef<HTMLDivElement>(null);
  // Centred in its own square box, so it needs its own placement rather than the hero's.
  const markPlacement = useMemo(() => ({ heightFraction: 0.86, widthFraction: 0.86, cx: 0.5, cy: 0.5 }), []);

  // The band arrives when it is scrolled to; see Faq.motion.ts. `data-motion`
  // below holds the animated parts in CSS until this takes over, and the
  // accordion's own state is untouched by any of it.
  const ref = useSectionMotion<HTMLElement>(buildFaq);

  return (
    <section ref={ref} className="faq" id="faq" aria-labelledby="faq-title" data-motion="pending">
      <div className="container faq__inner">
        <div className="faq__rail">
          <p className="eyebrow">
            <img src={dot} alt="" className="eyebrow__dot" width={12} height={12} />
            Frequently asked
          </p>
          <h2 id="faq-title" className="faq__title">Answers<br />you can verify</h2>
          <p className="faq__lede">
            Everything below is how Phorecast actually works.<br />
            Where a claim can be checked on-chain, we show<br />
            you where to check it.
          </p>
          <div className="faq__mark" ref={markRef} aria-hidden="true">
            <HeroLogo hostRef={markRef} variant="lined" placement={markPlacement} scroll={false} />
          </div>
        </div>

        <ul className="faq__list">
          {ITEMS.map((item, i) => {
            const isOpen = i === open;
            return (
              <li key={item.q} className={`faq__row${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span className="faq__index">{pad(i)}</span>
                    <span className="faq__question">{item.q}</span>
                    <span className="faq__toggle" aria-hidden="true"><i /><i /></span>
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq__answer" hidden={!isOpen}>
                  <p className="faq__a-text">{item.a}</p>
                  {item.chips && (
                    <div className="faq__chips">
                      {item.chips.map((c, ci) =>
                        'verify' in c ? (
                          <span key={ci} className="faq__chip faq__chip--verify">
                            <img src={seal} alt="" width={16} height={16} />{c.verify}
                          </span>
                        ) : (
                          <span key={ci} className="faq__chip">
                            <span className="faq__chip-label">{c.label}</span>
                            <span className="faq__chip-value">{c.value}</span>
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

import { useMemo, useRef, useState } from 'react';
import { LiveDot } from '../LiveDot';
import { HeroLogo } from '../HeroLogo';
import { Icon } from '../Icon';
import { useSectionMotion } from '../../lib/motion';
import { buildFaq } from './Faq.motion';
import seal from '../../assets/faq/seal.svg';
import './Faq.css';

type Chip = { label: string; value: string } | { verify: string };

type Item = { q: string; a: string; chips?: Chip[] };

const ITEMS: Item[] = [
  {
    q: 'What is Phorcast?',
    a: 'Phorcast is a prediction market platform built for traders. You take a position on what happens next, from where Bitcoin is in five minutes to where gold closes this month, and if you’re right, each contract pays $1. No leverage, no liquidations. Your maximum loss is always what you stake.',
  },
  {
    q: 'What markets can I trade on Phorcast?',
    a: 'Crypto, stocks, indices, commodities, forex and sports, across timeframes from 5 minutes to monthly. Contract types include Up/Down (will the price close higher or lower?) and Price Hit (will the price touch a level before expiry?). New markets and contract types are added regularly.',
  },
  {
    q: 'Do I need to KYC to open an account?',
    a: 'No. You can sign up with an email address, social login or by connecting a crypto wallet, and start trading straight away. We may ask for verification on large withdrawals or where required by law.',
  },
  {
    q: 'How quickly can I get started?',
    a: 'Under two minutes. Create an account, send crypto to your personal deposit address, and your balance is credited as soon as the transaction confirms (around two seconds for USDC on Arbitrum).',
  },
  {
    q: 'What is the minimum deposit?',
    a: '$10 in any supported currency. Minimum deposit amounts vary slightly by network to cover confirmation costs and are shown on the deposit screen for each coin.',
  },
  {
    q: 'How long do withdrawals take?',
    a: 'Most withdrawals are processed within minutes. Larger withdrawals may be held for a security review and can take up to 24 hours. You’ll see the transaction hash as soon as it’s sent.',
    // The only item with chips: it is the one answer that states timings
    // worth pinning beside the prose, and the seal claims only what the copy
    // promises (the transaction hash). Chips must never assert more than the
    // answer text does.
    chips: [
      { label: 'Most withdrawals', value: 'Minutes' },
      { label: 'Security review', value: 'Up to 24 hours' },
      { verify: 'Transaction hash on send' },
    ],
  },
  {
    q: 'Do you plan to launch a Phorcast token?',
    a: 'Yes. A native token is part of our roadmap, with early users and active traders in mind. No date or details yet. Announcements will come through our official channels only, so be wary of anything claiming otherwise.',
  },
];

const pad = (n: number) => String(n + 1).padStart(2, '0');

export function Faq() {
  const [open, setOpen] = useState(5);
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
            <LiveDot />
            Frequently asked
          </p>
          <h2 id="faq-title" className="faq__title">Answers<br />before you start</h2>
          <p className="faq__lede">
            {/* The `{' '}` after each break is load-bearing. JSX trims the
                newline and indentation after a `<br />`, so the next text has no
                leading space. Below 720px `.br-wide` is hidden and the sentences
                would fuse ("works.What you can trade"). Above 720px the extra
                space is harmless: CSS drops a space at the start of a line. */}
            Everything below is how Phorcast actually works.<br className="br-wide" />{' '}
            What you can trade, what it costs to start,<br className="br-wide" />{' '}
            and how quickly money moves in and out.
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
                        /* The seal is drawn as a mask (Icon) in currentColor, so it
                           follows the chip's `--accent` in both themes with no
                           light variant of the file. The eyebrow's live dot cannot
                           work this way (three ellipses at three alphas), so it
                           swaps files per theme instead; see LiveDot.tsx. */
                        'verify' in c ? (
                          <span key={ci} className="faq__chip faq__chip--verify">
                            <Icon src={seal} w={16} h={16} />{c.verify}
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

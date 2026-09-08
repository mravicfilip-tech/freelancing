import { useRef, useState } from 'react';
import { useFaqMotion } from './useFaqMotion';
import './FigmaFaq.css';

type Entry = { q: string; a: string };

/** Eight entries, split down the middle: the left column reads before the right. */
const ENTRIES: Entry[] = [
  {
    q: 'What is Remittix, in one paragraph?',
    a: 'A payments network that takes crypto in and pays local currency out. You send from a wallet; the recipient gets money in their bank account, in their own currency, usually inside an hour. RTX is the token the network settles and stakes on.',
  },
  {
    q: 'How do I buy RTX in the presale?',
    a: 'Connect a wallet on the presale panel, pick ETH, USDT, BNB or SOL, and confirm. Card payment goes through the same panel via our on-ramp partner. Tokens are allocated to the wallet you paid from and claimable at listing.',
  },
  {
    q: 'Is there a minimum purchase?',
    a: 'Fifty dollars, or the equivalent in whichever asset you pay with. There is no maximum, though purchases over $25,000 are settled OTC — email the desk and we will handle it directly.',
  },
  {
    q: 'When do tokens unlock, and is there a vesting cliff?',
    a: 'Presale allocations unlock in full at listing — no cliff, no drip. Team and treasury allocations vest linearly over 24 months from listing, with the schedule written into the contract.',
  },
  {
    q: 'Which currencies and corridors work at launch?',
    a: 'Thirty-plus corridors at launch, covering NGN, PHP, INR, KES, GHS, BRL, MXN, VND and the SEPA zone. Corridors switch on one at a time as each payout partner clears compliance.',
  },
  {
    q: 'What does a transfer actually cost?',
    a: 'A flat 1% network fee, taken on the send side, and the mid-market rate on the conversion — no spread added on top. The receiving bank may charge its own deposit fee in some corridors; the quote shows it before you confirm.',
  },
  {
    q: 'Has the contract been audited?',
    a: 'Yes, by two independent firms, with both reports published in full — findings, severities and remediations included. The treasury is multi-signature and the wallet is non-custodial: keys stay on the device.',
  },
  {
    q: 'When does the wallet ship, and what is in v1?',
    a: 'Public beta follows listing. V1 covers send, receive, swap, the fiat payout rails and staking from inside the app. Merchant tools and the payment API come in the release after that.',
  },
];

const COLUMNS = [ENTRIES.slice(0, 4), ENTRIES.slice(4)];

function Column({ entries, offset }: { entries: Entry[]; offset: number }) {
  // Each column keeps its own open row, so the two halves read independently.
  const [open, setOpen] = useState(0);

  return (
    <div className="fq__col">
      {entries.map((entry, i) => {
        const isOpen = open === i;
        const id = `fq-a-${offset + i}`;
        return (
          <div className={`fq__item${isOpen ? ' is-open' : ''}`} key={entry.q}>
            <span className="fq__accent" aria-hidden="true">
              <i />
            </span>
            <button
              type="button"
              className="fq__q"
              aria-expanded={isOpen}
              aria-controls={id}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="fq__qText">{entry.q}</span>
              <span className="fq__sign" aria-hidden="true" />
            </button>
            <div className="fq__a" id={id} role="region">
              <div>
                <p>{entry.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * FAQ — the questions sit straight on the band in two dashed columns rather than inside a card,
 * so the section breathes like the "As seen in" band above it and halves the scroll depth of a
 * single stack.
 */
export function FigmaFaq() {
  const root = useRef<HTMLElement>(null);
  useFaqMotion(root);

  return (
    <section ref={root} className="fq" id="faq" data-motion="pending" aria-labelledby="fq-title">
      <div className="fq__frame">
        <div className="fq__head">
          <h2 id="fq-title" className="fq__title">
            <span className="fq__line">
              <span className="fq__lineInner">Frequently asked,</span>
            </span>
            <span className="fq__line">
              <span className="fq__lineInner">plainly answered</span>
            </span>
          </h2>
          <p className="fq__intro">
            Presale mechanics, token custody, and how money actually moves once the wallet is live.
          </p>
        </div>

        <div className="fq__cols">
          {COLUMNS.map((entries, c) => (
            <Column key={c} entries={entries} offset={c * 4} />
          ))}
          <i className="fq__gutter" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

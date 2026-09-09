import { useRef, useState } from 'react';
import { StepIllustration } from './illustrations';
import { useHowToBuyMotion } from './useHowToBuyMotion';
import './FigmaHowToBuy.css';

/**
 * "How to buy $RTX?" (Figma 2715:746 / 2715:2265 / 2715:2432). One section in three states: the
 * card on the left carries the live step, the rail on the right lists all three and marks the live
 * one with the indigo edge. Arrow keys, Home and End move between steps, as a tablist should.
 */

type Step = { id: string; title: string; body: string };

const STEPS: Step[] = [
  {
    id: 'sign-up',
    title: 'Sign Up',
    body:
      'Visit remittixpresale.io, click “Connect Wallet & Pay”, and make sure you’re on the Ethereum (ERC20) network.',
  },
  {
    id: 'currency',
    title: 'Select Currency',
    body: 'Choose the crypto you want to pay with, or use your card instead.',
  },
  {
    id: 'claim',
    title: 'Buy & Claim',
    body:
      'Confirm the transaction in your wallet. Your tokens will appear in your dashboard within 5–10 minutes.',
  },
];

export function FigmaHowToBuy() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useHowToBuyMotion(root);

  const step = STEPS[active];

  /** Up/down (and Home/End) move between steps; the rail wraps at both ends. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = STEPS.length - 1;
    const to =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? active === last
          ? 0
          : active + 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? active === 0
            ? last
            : active - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(to);
    (root.current?.querySelectorAll<HTMLButtonElement>('.hb__step')[to])?.focus();
  };

  return (
    <section ref={root} className="hb" id="how-to-buy" data-motion="pending" aria-labelledby="hb-title" data-node-id="2715:746">
      <div className="hb__frame">
        <div className="hb__head">
          <h2 id="hb-title" className="hb__title">
            <span className="hb__line">
              <span className="hb__lineInner">How to buy $RTX?</span>
            </span>
          </h2>
          <p className="hb__intro">
            Three steps from an empty wallet to an allocation held against your own address.
          </p>
        </div>

        <div className="hb__cols">
          {/* The card: the live step, with its illustration behind the copy. */}
          <div
            className="hb__card"
            role="tabpanel"
            id={`hb-panel-${step.id}`}
            aria-labelledby={`hb-tab-${step.id}`}
            tabIndex={0}
          >
            {/* The card's own background from the file: an exported glow per step, under the dot
                field and its colour wash. Anchored to the card's edges so it holds at any width. */}
            <div className="hb__bg" data-step={step.id} aria-hidden="true">
              {step.id === 'sign-up' && <img className="hb__glow hb__glow--1" src="/figma/howtobuy/s1-glow@2x.png" alt="" width={774} height={262} />}
              {/* The currency card's art frame carries its dot field and wash inside the export
                  (the file stacks its ellipses over them), so it takes no CSS field of its own. */}
              {step.id === 'currency' && <img className="hb__glow hb__glow--2" src="/figma/howtobuy/s2-art@2x.png" alt="" width={774} height={319} />}
              {step.id === 'claim' && <img className="hb__glow hb__glow--3" src="/figma/howtobuy/s3-glow@2x.png" alt="" width={326} height={342} />}
              {step.id !== 'currency' && (
                <>
                  <i className="hb__dots" />
                  <i className="hb__wash" />
                </>
              )}
            </div>
            {/* The step's illustration, its own layer over the background and under the copy. */}
            <StepIllustration key={`art-${step.id}`} step={step.id} />
            {/* keyed on the step so the card re-runs its own entrance as the rail switches */}
            <div className="hb__cardInner" key={step.id}>
              <div className="hb__copy">
                <h3 className="hb__cardTitle">{step.title}</h3>
                <p className="hb__body">{step.body}</p>
              </div>
            </div>
          </div>

          <div className="hb__rail" role="tablist" aria-orientation="vertical" onKeyDown={onKeyDown}>
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`hb-tab-${s.id}`}
                aria-selected={i === active}
                aria-controls={`hb-panel-${s.id}`}
                tabIndex={i === active ? 0 : -1}
                className={`hb__step${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="hb__stepLabel">Step {i + 1}</span>
                <span className="hb__stepTitle">{s.title}</span>
                <span className="hb__marker" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useRef } from 'react';
import { PresaleButton } from '../FigmaHero/FigmaHero';
import { Fast, Fx, Pay, Simple, Ui } from './illustrations';
import { B, useMobileArt } from './illustrations/Stage';
import { useFeaturesMotion, type MotionPicks } from './useFeaturesMotion';
import './FigmaFeatures.css';
import './illustrations/illustrations.css';

/**
 * Feature section from the Figma design "Remittix Redesign", node 2409:2419 ("2").
 * A light band between the dashed 1560 rails: a two-tone headline and five white cards on the
 * 1440 grid. Each card's illustration is rebuilt from the design's layers (illustrations/) so it
 * can animate part by part; the copy, chips and button are live. Motion lives in useFeaturesMotion.
 *
 * Under 720px the cards take the design's phone frames (2597:469, :705, :844, :1042, :1126): the
 * copy sits on top and each illustration switches to its portrait composition rather than being a
 * landscape scene shrunk to a third of its width.
 */

function CardText({ title, chip, children, className }: { title: string; chip?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`ff__text${className ? ` ${className}` : ''}`}>
      {/* The chip is a sibling of the title so the phone design can sit it on the title's line;
          on a desk the card pins it to its own top-left corner. */}
      <div className="ff__titleRow">
        <h3 className="ff__cardTitle">{title}</h3>
        {chip}
      </div>
      <p className="ff__cardBody">{children}</p>
    </div>
  );
}

function AccelerationChip() {
  return (
    <span className="ff__chip" data-node-id="2409:2537">
      <img src={B('imgDataTransferGoalFlag.svg')} alt="" width={20} height={20} />
      Acceleration
    </span>
  );
}

export function FigmaFeatures({ picks }: { picks?: MotionPicks } = {}) {
  const root = useRef<HTMLElement>(null);
  const mobile = useMobileArt();
  useFeaturesMotion(root, picks, mobile);
  return (
    <section ref={root} className="ff" data-node-id="2409:2419" data-motion="pending" aria-labelledby="ff-title">
      <div className="ff__frame">
        <div className="ff__inner">
          <h2 id="ff-title" className="ff__title" data-node-id="2409:2424">
            <span className="ff__line">
              <span className="ff__lineInner">Bridging crypto with local</span>
            </span>
            <span className="ff__line">
              {/* The two shapes this line can take are "payment networks" / "globally." and
                  "payment" / "networks globally.". The second is what the balancer picks —
                  "networks globally." is the narrower of the two long halves — but it puts the
                  block's two short lines side by side. The bound pair settles it in the text,
                  written out rather than left as an invisible byte a formatter would eat. */}
              <span className="ff__lineInner ff__titleMuted">{'payment\u00A0networks globally.'}</span>
            </span>
          </h2>

          <div className="ff__grid">
            <div className="ff__row">
              <article className="ff__card ff__card--pay" data-node-id="2409:2427">
                <CardText title="Pay Remittix" className="ff__text--pay">
                  Use crypto to pay directly into any fiat bank account.
                </CardText>
                <Pay mobile={mobile} />
              </article>

              <article className="ff__card ff__card--fx" data-node-id="2409:2439">
                <CardText title="Zero FX fees.">
                  Cross-border transfers come with a flat fee—no extra charges for FX, wires, or hidden costs. What you
                  send is exactly what they receive.
                </CardText>
                <Fx mobile={mobile} />
              </article>
            </div>

            <div className="ff__row">
              <article className="ff__card ff__card--simple" data-node-id="2409:2451">
                <div className="ff__simpleCopy">
                  <CardText title="Crypto-to-fiat payments made simple.">
                    Remittix operates just like your favorite banking apps, but we allow you to send crypto while
                    ensuring your recipients receive fiat. When you need an easy solution for crypto payments, Remittix
                    is your go-to protocol.
                  </CardText>
                  <PresaleButton />
                </div>
                <Simple mobile={mobile} />
              </article>
            </div>

            <div className="ff__row">
              <article className="ff__card ff__card--fast" data-node-id="2409:2532">
                {/* The desk layout stands the chip in the card's own top-left corner; the phone
                    design sits it on the title's line, so it moves inside the copy there. */}
                {!mobile && <AccelerationChip />}
                <Fast mobile={mobile} />
                <CardText title="Super fast." chip={mobile ? <AccelerationChip /> : undefined}>
                  Crypto is received instantly, and fiat is sent via local payment networks, ensuring same-day
                  processing.
                </CardText>
              </article>

              <article className="ff__card ff__card--ui" data-node-id="2409:2544">
                <CardText title="User-friendly interface." className="ff__text--ui">
                  Send crypto payments straight to bank accounts in over 30 currencies— simply connect your wallet.
                </CardText>
                <Ui mobile={mobile} />
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

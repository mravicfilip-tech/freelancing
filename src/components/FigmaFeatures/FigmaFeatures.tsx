import { useRef } from 'react';
import { PresaleButton } from '../FigmaHero/FigmaHero';
import { Fast, Fx, Pay, Simple, Ui } from './illustrations';
import { B } from './illustrations/Stage';
import { useFeaturesMotion, type MotionPicks } from './useFeaturesMotion';
import './FigmaFeatures.css';
import './illustrations/illustrations.css';

/**
 * Feature section from the Figma design "Remittix Redesign", node 2409:2419 ("2").
 * A light band between the dashed 1560 rails: a two-tone headline and five white cards on the
 * 1440 grid. Each card's illustration is rebuilt from the design's layers (illustrations/) so it
 * can animate part by part; the copy, chips and button are live. Motion lives in useFeaturesMotion.
 */

function CardText({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`ff__text${className ? ` ${className}` : ''}`}>
      <h3 className="ff__cardTitle">{title}</h3>
      <p className="ff__cardBody">{children}</p>
    </div>
  );
}

export function FigmaFeatures({ picks }: { picks?: MotionPicks } = {}) {
  const root = useRef<HTMLElement>(null);
  useFeaturesMotion(root, picks);
  return (
    <section ref={root} className="ff" data-node-id="2409:2419" data-motion="pending" aria-labelledby="ff-title">
      <div className="ff__frame">
        <div className="ff__inner">
          <h2 id="ff-title" className="ff__title" data-node-id="2409:2424">
            <span className="ff__line">
              <span className="ff__lineInner">Bridging crypto with local</span>
            </span>
            <span className="ff__line">
              <span className="ff__lineInner ff__titleMuted">payment networks globally.</span>
            </span>
          </h2>

          <div className="ff__grid">
            <div className="ff__row">
              <article className="ff__card ff__card--pay" data-node-id="2409:2427">
                <CardText title="Pay Remittix" className="ff__text--pay">
                  Use crypto to pay directly into any fiat bank account.
                </CardText>
                <Pay />
              </article>

              <article className="ff__card ff__card--fx" data-node-id="2409:2439">
                <CardText title="Zero FX fees.">
                  Cross-border transfers come with a flat fee—no extra charges for FX, wires, or hidden costs. What you
                  send is exactly what they receive.
                </CardText>
                <Fx />
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
                <Simple />
              </article>
            </div>

            <div className="ff__row">
              <article className="ff__card ff__card--fast" data-node-id="2409:2532">
                <span className="ff__chip" data-node-id="2409:2537">
                  <img src={B('imgDataTransferGoalFlag.svg')} alt="" width={20} height={20} />
                  Acceleration
                </span>
                <Fast />
                <CardText title="Super fast.">
                  Crypto is received instantly, and fiat is sent via local payment networks, ensuring same-day
                  processing.
                </CardText>
              </article>

              <article className="ff__card ff__card--ui" data-node-id="2409:2544">
                <CardText title="User-friendly interface." className="ff__text--ui">
                  Send crypto payments straight to bank accounts in over 30 currencies— simply connect your wallet.
                </CardText>
                <Ui />
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

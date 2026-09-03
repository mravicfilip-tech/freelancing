import { PresaleButton } from '../FigmaHero/FigmaHero';
import './FigmaFeatures.css';

/**
 * Feature section from the Figma design "Remittix Redesign", node 2343:116 ("2").
 * A dark band under the hero: a two-tone headline and five cards on the 1440 grid.
 * Each card's illustration is the design's composition exported as a single 2x asset
 * (public/figma/features); the copy, chips and button are live.
 */

const ART = {
  pay: { src: '/figma/features/pay-remittix.png', width: 562, height: 188 },
  fx: { src: '/figma/features/zero-fx.png', width: 480, height: 361 },
  simple: { src: '/figma/features/made-simple.png', width: 709, height: 334 },
  fast: { src: '/figma/features/super-fast.png', width: 500, height: 436 },
  ui: { src: '/figma/features/interface.png', width: 668, height: 234 },
} as const;

function Art({ id, className }: { id: keyof typeof ART; className?: string }) {
  const a = ART[id];
  return (
    <img
      className={`ff__art${className ? ` ${className}` : ''}`}
      src={a.src}
      alt=""
      width={a.width}
      height={a.height}
      loading="lazy"
      decoding="async"
    />
  );
}

function CardText({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`ff__text${className ? ` ${className}` : ''}`}>
      <h3 className="ff__cardTitle">{title}</h3>
      <p className="ff__cardBody">{children}</p>
    </div>
  );
}

export function FigmaFeatures() {
  return (
    <section className="ff" data-node-id="2343:116" aria-labelledby="ff-title">
      <div className="ff__inner">
        <h2 id="ff-title" className="ff__title" data-node-id="2343:119">
          Bridging crypto with local <span className="ff__titleMuted">payment networks globally.</span>
        </h2>

        <div className="ff__grid">
          <div className="ff__row">
            <article className="ff__card ff__card--pay" data-node-id="2354:885">
              <Art id="pay" className="ff__art--pay" />
              <CardText title="Pay Remittix">Use crypto to pay directly into any fiat bank account.</CardText>
            </article>

            <article className="ff__card ff__card--fx" data-node-id="2354:691">
              <Art id="fx" className="ff__art--fx" />
              <CardText title="Zero FX fees.">
                Cross-border transfers come with a flat fee—no extra charges for FX, wires, or hidden costs. What you send
                is exactly what they receive.
              </CardText>
            </article>
          </div>

          <div className="ff__row">
            <article className="ff__card ff__card--simple" data-node-id="2348:1723">
              <div className="ff__simpleCopy">
                <CardText title="Crypto-to-fiat payments made simple.">
                  Remittix operates just like your favorite banking apps, but we allow you to send crypto while ensuring
                  your recipients receive fiat. When you need an easy solution for crypto payments, Remittix is your go-to
                  protocol.
                </CardText>
                <PresaleButton />
              </div>
              <Art id="simple" className="ff__art--simple" />
            </article>
          </div>

          <div className="ff__row">
            <article className="ff__card ff__card--fast" data-node-id="2361:2188">
              <span className="ff__chip" data-node-id="2361:2193">
                <img src="/figma/features/accel-icon.svg" alt="" width={20} height={20} />
                Acceleration
              </span>
              <Art id="fast" className="ff__art--fast" />
              <CardText title="Super fast.">
                Crypto is received instantly, and fiat is sent via local payment networks, ensuring same-day processing.
              </CardText>
            </article>

            <article className="ff__card ff__card--ui" data-node-id="2360:1854">
              <Art id="ui" className="ff__art--ui" />
              <CardText title="User-friendly interface.">
                Send crypto payments straight to bank accounts in over 30 currencies— simply connect your wallet.
              </CardText>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

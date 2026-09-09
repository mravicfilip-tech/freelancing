import { PRESALE, STAGE_LADDER, whole } from '../data';
import { Figure } from '../Figure';

/**
 * The one thing that makes a presale a presale: the price ratchets up a cent a
 * stage. A flat progress bar throws that away, so the stages are drawn as a
 * staircase — spent stages solid, the live one filled to how much is sold, the
 * stages ahead ghosted with the price you will pay if you wait.
 */
export function StageLadder() {
  const sold = PRESALE.progress * 100;

  return (
    <div className="ladder">
      <div className="ladder__head">
        <div>
          <p className="ladder__label">Stage {PRESALE.stage} price</p>
          <Figure className="ladder__price" symbol="$" value={PRESALE.price.toFixed(2)} />
        </div>
        <div className="ladder__next">
          <p className="ladder__label">Next stage</p>
          <p className="ladder__next-price">${PRESALE.nextPrice.toFixed(2)}</p>
        </div>
      </div>

      <ol
        className="ladder__steps"
        aria-label={`Stage ${PRESALE.stage} of the presale, ${sold}% sold`}
      >
        {STAGE_LADDER.map((stage, i) => (
          <li
            className="ladder__step"
            key={stage.n}
            data-state={stage.state}
            style={{ '--step': `${44 + i * 11}px` } as React.CSSProperties}
          >
            <span className="ladder__bar">
              <span
                className="ladder__fill"
                style={stage.state === 'live' ? { height: `${sold}%` } : undefined}
              />
            </span>
            <span className="ladder__n">${stage.price.toFixed(2)}</span>
          </li>
        ))}
      </ol>

      <dl className="ladder__facts">
        <div>
          <dt>Sold this stage</dt>
          <dd>{sold.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Left to raise</dt>
          <dd>${whole(PRESALE.usdLeft)}</dd>
        </div>
        <div>
          <dt>Tokens remaining</dt>
          <dd>{whole(PRESALE.rtxLeft)}</dd>
        </div>
      </dl>
    </div>
  );
}

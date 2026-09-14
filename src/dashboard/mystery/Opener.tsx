import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { TokenId } from '../data';
import { Button } from '../Button';
import { CheckIcon, PayMark } from '../icons';
import { PrizeCard } from './PrizeCard';
import { FxRow } from './FxRow';
import { redraw } from './arc';
import { BOX, PAY, PRIZES, draw, rate, reward, type Prize } from './data';

/**
 * The opener: a reel of prize cards behind a centre marker, the box sitting
 * over the middle slot until it is opened, and the controls under it. A spin
 * lays out a fresh strip with the drawn prize at a fixed slot, snaps the reel
 * to its start, and eases it there over four seconds; the box lifts as the
 * reel starts and the winning card is lit when it stops.
 */
const SLOT = 218;
const LEN = 44;
const WIN = 38;
const CAPS = ['Unwrapping…', 'You can win…', 'Opening up…'];

function strip(winner?: Prize): Prize[] {
  const out = Array.from({ length: LEN }, (_, i) => PRIZES[(i * 7) % PRIZES.length]);
  for (let i = 0; i < LEN; i++) if (i > 4 && Math.random() < 0.6) out[i] = draw();
  if (winner) out[WIN] = winner;
  return out;
}

export function Opener({ onWin }: { onWin: (p: Prize, spent: number) => void }) {
  const [pay, setPay] = useState<TokenId>(PAY[0]);
  const [count, setCount] = useState(1);
  const [cards, setCards] = useState<Prize[]>(() => strip());
  const [phase, setPhase] = useState<'idle' | 'spin' | 'won'>('idle');
  const [won, setWon] = useState<Prize | null>(null);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const at = useRef(3);

  /** x that centres slot `i` in the viewport. */
  const xFor = (i: number) => (view.current?.clientWidth ?? 0) / 2 - (i + 0.5) * SLOT;

  useLayoutEffect(() => {
    if (track.current) gsap.set(track.current, { x: xFor(at.current) });
  }, [cards]);
  useEffect(() => {
    const onResize = () => track.current && phase !== 'spin' && gsap.set(track.current, { x: xFor(at.current) });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [phase]);

  const cost = BOX.price * count;
  const inPay = (cost / rate(pay)).toFixed(pay === 'BTC' ? 5 : 4);

  const spin = (demo: boolean) => {
    if (phase === 'spin' || !track.current) return;
    const prize = draw();
    setWon(null);
    setPhase('spin');
    at.current = 3;
    setCards(strip(prize));
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const land = () => {
      at.current = WIN;
      setWon(prize);
      setPhase('won');
      redraw();
      if (!demo) onWin(prize, cost);
    };
    if (box.current) {
      gsap.killTweensOf(box.current);
      gsap.to(box.current, { autoAlpha: 0, scale: 0.7, y: -30, duration: still ? 0 : 0.5, ease: 'power2.in' });
    }
    if (still) {
      gsap.set(track.current, { x: xFor(WIN) });
      land();
      return;
    }
    const tl = gsap.timeline({ onComplete: land });
    tl.set(track.current, { x: xFor(3) });
    tl.to(track.current, { x: xFor(WIN) + (Math.random() - 0.5) * SLOT * 0.5, duration: 4.2, ease: 'power4.out' }, 0.25);
    tl.to(track.current, { x: xFor(WIN), duration: 0.6, ease: 'power2.inOut' });
  };

  const reset = () => {
    if (phase !== 'won' || !box.current) return;
    setPhase('idle');
    setWon(null);
    at.current = 3;
    setCards(strip());
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.killTweensOf(box.current);
    gsap.fromTo(box.current, { autoAlpha: 0, scale: 0.7, y: -30 }, { autoAlpha: 1, scale: 1, y: 0, duration: still ? 0 : 0.5, ease: 'power2.out' });
  };

  return (
    <section className="card opener" aria-labelledby="opener-title">
      <header className="card__head opener__head">
        <div>
          <h2 className="card__title" id="opener-title">Open a box</h2>
          <p className="orders__sub"><span className="num">{BOX.left.toLocaleString()}</span> left at ${BOX.price} each</p>
        </div>
        <div className="opener__pay" role="group" aria-label="Pay with">
          {PAY.map((id) => (
            <button key={id} type="button" className="chip opener__chip" aria-pressed={pay === id} onClick={() => setPay(id)}>
              <PayMark id={id} className="icon-16" /> {id}
            </button>
          ))}
        </div>
      </header>

      <FxRow className={`reel reel--${phase}`}>
        <div className="reel__view" ref={view} />
        <div className="reel__mark" aria-hidden="true" />
        <div className="reel__track" ref={track}>
          {cards.map((p, i) => (
            <div className={`reel__slot${phase === 'idle' && i === 3 ? ' reel__slot--under' : ''}`} key={`${i}-${p.id}`}>
              <span className="reel__cap">{CAPS[i % 3]}</span>
              <PrizeCard p={p} won={phase === 'won' && i === WIN} />
              <span className="reel__cap num">Prize #{124 + i}</span>
            </div>
          ))}
        </div>
        <div className="reel__box" ref={box}>
          <button type="button" className="reel__open" onClick={() => spin(false)} aria-label="Open a box">
            <img src="/figma/mystery-box.webp" alt="" width={215} height={215} />
          </button>
          <span className="reel__hint">Click to open a box!</span>
        </div>
        {phase === 'won' && won && (
          <button type="button" className="reel__result" onClick={reset}>
            You won <strong>{reward(won)}</strong> · open another
          </button>
        )}
      </FxRow>

      <footer className="opener__foot">
        <p className="opener__fair">
          <span className="opener__tick" aria-hidden="true"><CheckIcon className="icon-16" /></span>
          100% authentic, secured by provable fairness
        </p>
        <div className="opener__actions">
          <Button variant="ghost" onClick={() => spin(true)} disabled={phase === 'spin'}>Demo spin</Button>
          <Button onClick={() => spin(false)} disabled={phase === 'spin'}>
            Open for ${cost} <span className="opener__rate num">≈ {inPay} {pay}</span>
          </Button>
        </div>
        <div className="opener__count" role="group" aria-label="Boxes to open">
          <span>Boxes to open</span>
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" className="chip num opener__n" aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>
          ))}
        </div>
      </footer>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { TokenId } from '../data';
import { Button } from '../Button';
import { CheckIcon, PayMark } from '../icons';
import { PrizeCard } from './PrizeCard';
import { MysteryChest } from './MysteryChest';
import { FxRow } from './FxRow';
import { burst, redraw } from './arc';
import { BOX, PAY, PRIZES, RARITY, draw, rate, reward, type Prize } from './data';

/**
 * The opener: a reel of prize cards behind a centre marker, the box sitting
 * over the middle slot until it is opened, and the controls under it. A spin
 * lays out a fresh strip with the drawn prize at a fixed slot, snaps the reel
 * to its start, and eases it there over four seconds; the box lifts as the
 * reel starts and the winning card is lit when it stops.
 */
const SLOT = 218;
const LEN = 48;
/* The slot the box rests on and the slot a spin stops at: eight cards lead
   the first and eight trail the second, so the reel is full to the edges on
   a screen up to 3,500px wide. */
const START = 8;
const WIN = 40;
/* The lean at the reel's edge: degrees turned toward the marker, the step
   back in scale, and the shade laid over the card. */
const LEAN = 16;
const SHRINK = 0.12;
const SHADE = 0.3;
/* How far the edge slots gather toward the centre, as a share of the half
   width: the strip curves away, so its pitch tightens outward. */
const GATHER = 0.1;
const CAPS = ['Unwrapping…', 'You can win…', 'Opening up…'];
const LIME: [number, number, number] = [217, 242, 78];
const INDIGO: [number, number, number] = [64, 66, 210];
/** How big a landing is, by rarity: sparks thrown and how far the glow reaches. */
const TIER: Record<Prize['rarity'], [number, number]> = { uncommon: [28, 0.25], rare: [44, 0.35], epic: [64, 0.45], legendary: [90, 0.6], mythic: [130, 0.75] };
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function strip(winner?: Prize): Prize[] {
  const out = Array.from({ length: LEN }, (_, i) => PRIZES[(i * 7) % PRIZES.length]);
  for (let i = 0; i < LEN; i++) if (i > START + 1 && Math.random() < 0.6) out[i] = draw();
  if (winner) out[WIN] = winner;
  return out;
}

export function Opener({ onWin }: { onWin: (p: Prize, spent: number) => void }) {
  const [pay, setPay] = useState<TokenId>(PAY[0]);
  const [count, setCount] = useState(1);
  const [cards, setCards] = useState<Prize[]>(() => strip());
  const [phase, setPhase] = useState<'idle' | 'spin' | 'won'>('idle');
  const [won, setWon] = useState<Prize | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const tick = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLButtonElement>(null);
  const at = useRef(START);
  const root = () => view.current?.closest<HTMLElement>('.fx-row') ?? null;
  /* The opening's own light: lime on the dark stage, the theme's indigo on the light one. */
  const hue = () => (root()?.closest('.dash')?.getAttribute('data-theme') === 'light' ? INDIGO : LIME);
  /** A point in the reel's own space. */
  const local = (el: Element) => {
    const r = el.getBoundingClientRect();
    const b = root()!.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2, w: r.width, h: r.height };
  };

  /** x that centres slot `i` in the viewport. */
  const xFor = (i: number) => (view.current?.clientWidth ?? 0) / 2 - (i + 0.5) * SLOT;

  /** The perspective: every slot turns to face the marker by how far it
      stands from it, and steps back and into shade as it goes. Runs on
      every frame the strip moves, since the lean follows the slot. */
  const lean = () => {
    if (!view.current || !track.current) return;
    const half = view.current.clientWidth / 2;
    const x = Number(gsap.getProperty(track.current, 'x'));
    const leans = track.current.querySelectorAll<HTMLElement>('.reel__lean');
    leans.forEach((el, i) => {
      const d = (x + (i + 0.5) * SLOT - half) / half;
      if (Math.abs(d) > 1.4) return;
      const a = Math.min(1, Math.abs(d));
      const k = Math.sign(d) * a ** 1.25;
      const deg = k * LEAN;
      el.dataset.lean = deg.toFixed(1);
      el.style.setProperty('--shade', (a * SHADE).toFixed(3));
      gsap.set(el, { rotateY: deg, scale: 1 - a * SHRINK });
      // The slot slides in with the curve.
      gsap.set(el.parentElement, { x: -Math.sign(d) * a ** 3 * half * GATHER });
    });
  };
  /** Puts the strip at slot `i` and leans it. */
  const place = (i: number) => {
    if (!track.current) return;
    gsap.set(track.current, { x: xFor(i) });
    lean();
  };

  useLayoutEffect(() => {
    place(at.current);
  }, [cards]);
  useEffect(() => {
    const onResize = () => phase !== 'spin' && place(at.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [phase]);

  const cost = BOX.price * count;
  const inPay = (cost / rate(pay)).toFixed(pay === 'BTC' ? 5 : 4);

  const spin = (demo: boolean) => {
    if (phase === 'spin' || !track.current || !box.current) return;
    const prize = draw();
    setWon(null);
    setPhase('spin');
    at.current = START;
    setCards(strip(prize));
    const land = () => {
      at.current = WIN;
      setWon(prize);
      setPhase('won');
      redraw();
      if (!demo) onWin(prize, cost);
    };
    gsap.killTweensOf(box.current);
    if (still()) {
      setChestOpen(true);
      gsap.set(box.current, { autoAlpha: 0 });
      place(WIN);
      land();
      return;
    }
    const r = root()!;
    const c = local(box.current);
    let lastSlot = -1;
    const tl = gsap.timeline({ onComplete: land });
    // The chest's own opening: the latch gives, the lid lifts and the coins
    // are thrown (MysteryChest). The crate leans into it, then bursts in a
    // flash of lime sparks and is gone…
    tl.add(() => setChestOpen(true), 0)
      .to(box.current, { scale: 1.06, y: -6, duration: 0.9, ease: 'power1.out' }, 0.2)
      .add(() => burst(r, c.x, c.y - 20, hue(), 90, 1.3), 1.15)
      .to(box.current, { scale: 1.6, autoAlpha: 0, duration: 0.32, ease: 'power3.in' }, 1.15)
      // …and the reel is already flying, ticking past the marker as it slows.
      .set(track.current, { x: xFor(START) }, '<')
      .to(track.current, {
        x: xFor(WIN) + (Math.random() - 0.5) * SLOT * 0.5,
        duration: 4.6,
        ease: 'power4.out',
        onUpdate: () => {
          lean();
          const x = Number(gsap.getProperty(track.current!, 'x'));
          const slot = Math.floor(((view.current?.clientWidth ?? 0) / 2 - x) / SLOT);
          if (slot !== lastSlot && tick.current) {
            lastSlot = slot;
            gsap.fromTo(tick.current, { autoAlpha: 0.7, scaleX: 1.6 }, { autoAlpha: 0, scaleX: 1, duration: 0.28, ease: 'power2.out', overwrite: true });
          }
        },
      }, '<+0.05')
      .to(track.current, { x: xFor(WIN), duration: 0.55, ease: 'power2.inOut', onUpdate: lean });
  };

  /* The landing: the card pops, a ring of its colour rolls out, sparks fly
     in it, the reel's edges glow with it, and the result drops in. Bigger
     the rarer the prize. */
  useEffect(() => {
    if (phase !== 'won' || !won || still()) return;
    const r = root();
    const card = r?.querySelector<HTMLElement>('.prize[data-won="true"]');
    if (!r || !card) return;
    const { ink, glow: g } = RARITY[won.rarity];
    const [sparks, reach] = TIER[won.rarity];
    const c = local(card);
    burst(r, c.x, c.y, g, sparks, 1 + reach);
    gsap.fromTo(card, { scale: 0.9 }, { scale: 1.06, duration: 0.45, ease: 'back.out(3)' });
    gsap.to(card, { scale: 1, duration: 0.5, delay: 0.55, ease: 'power2.inOut' });
    if (ring.current) {
      Object.assign(ring.current.style, { left: `${c.x}px`, top: `${c.y}px`, width: `${c.w}px`, height: `${c.h}px`, borderColor: ink });
      gsap.fromTo(ring.current, { scale: 0.6, autoAlpha: 0.9 }, { scale: 2.2, autoAlpha: 0, duration: 0.9, ease: 'power2.out' });
    }
    if (glow.current) {
      glow.current.style.setProperty('--win-glow', g.join(','));
      gsap.fromTo(glow.current, { autoAlpha: 0 }, { autoAlpha: reach, duration: 0.3, ease: 'power1.out', yoyo: true, repeat: 1, repeatDelay: 0.5 });
    }
    if (result.current) gsap.fromTo(result.current, { y: 18, scale: 0.8, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.55, ease: 'back.out(2)', delay: 0.15 });
  }, [phase, won]);

  const reset = () => {
    if (phase !== 'won' || !box.current) return;
    setPhase('idle');
    setWon(null);
    at.current = START;
    setCards(strip());
    setChestOpen(false);
    gsap.killTweensOf(box.current);
    gsap.fromTo(box.current, { autoAlpha: 0, scale: 0.7, y: -30 }, { autoAlpha: 1, scale: 1, y: 0, duration: still() ? 0 : 0.5, ease: 'back.out(1.6)' });
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
        <div className="reel__glow" ref={glow} aria-hidden="true" />
        <div className="reel__tick" ref={tick} aria-hidden="true" />
        <div className="reel__mark" aria-hidden="true" />
        <div className="reel__track" ref={track}>
          {cards.map((p, i) => (
            <div className={`reel__slot${phase === 'idle' && i === START ? ' reel__slot--under' : ''}`} key={`${i}-${p.id}`}>
              <div className="reel__lean">
                {phase === 'won' && i === WIN ? (
                  <span className="reel__cap reel__cap--win" style={{ color: RARITY[p.rarity].ink }}>{RARITY[p.rarity].label}!</span>
                ) : (
                  <span className="reel__cap">{phase === 'won' ? 'Open next…' : CAPS[i % 3]}</span>
                )}
                <PrizeCard p={p} won={phase === 'won' && i === WIN} />
                <span className="reel__cap num">Prize #{124 + i}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="reel__box">
          <div className="reel__anim" ref={box}>
            <div className="reel__chest">
              <MysteryChest open={chestOpen} />
              <button type="button" className="reel__open" onClick={() => spin(false)} aria-label="Open a box" />
            </div>
            <span className="reel__hint">Click to open a box!</span>
          </div>
        </div>
        <div className="reel__ring" ref={ring} aria-hidden="true" />
        {phase === 'won' && won && (
          <button type="button" className="reel__result" ref={result} onClick={reset}>
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
            Open for ${cost}
            <span className="opener__rate num">≈ {inPay} {pay} <PayMark id={pay} className="icon-16 opener__rate-mark" /></span>
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
